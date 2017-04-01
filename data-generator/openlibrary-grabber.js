"use strict";

const request = require("request");
const utils = require("./utils.js");
const args = utils.args;

let totalCount = 0;
const recordsPerRequest = 200;
const baseUrl = "http://openlibrary.org";
const getRandomArrayItem = array => array[Math.floor(Math.random()*array.length)];
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
                                            .toISOString().slice(0, 10);

function main() {
    
    if(utils.hasArguments() && args.books_count) {

        let booksCount = +args.books_count;
        let startOffset = args.offset ? args.offset : 0;
        utils.clearOpenLibraryDirectory();

        if(booksCount <= recordsPerRequest) {

            runSerial([
                processRequest({
                    count:booksCount,
                    number: 1,
                    offset: startOffset
                })
            ]).then(() => console.log(`\nAll requests finished\n`+
                                      `Fetched ${totalCount} records, wrote to 1 file`));
        }
        else {

            let requestsPromises = [];
            let requestsCount = Math.floor(booksCount/recordsPerRequest);

            for(let i=0; i < requestsCount; i++) {
                requestsPromises.push(processRequest({
                    count: recordsPerRequest,
                    offset: startOffset + i*recordsPerRequest,
                    number: i+1
                }));
            }

            if(booksCount%recordsPerRequest != 0) {
                requestsPromises.push(processRequest({
                    count: booksCount%recordsPerRequest,
                    offset: startOffset + requestsCount*recordsPerRequest,
                    number: requestsCount+1
                }))
            }

            runSerial(requestsPromises)
                .then(() => console.log(`\nAll requests finished\n`+
                                        `Fetched ${totalCount} records, wrote to ${requestsCount} files`));
        }
    }
    else {
        utils.showGrabberHelp();
    }
}

function runSerial(tasks) {
    let result = Promise.resolve();
    tasks.forEach(task => {
        result = result.then(() => task());
    });
    return result;
}

function processBook(book) {

    return new Promise( (resolve, reject) => {

        request.get(baseUrl + book + ".json", (err, res, body) => {

            let data = JSON.parse(body);
            let processedBook = {
                title: data.title,
                city: data.publish_places ? data.publish_places[0] : null,
                publisher: data.publishers ? data.publishers[0] : null,
                year: data.publish_date ? +data.publish_date.slice(-4) : 1950,
                subject: data.subjects ? data.subjects[0] : null,
                genre: data.genres ? data.genres[0] : null,
                periodic_release: getRandomArrayItem([null, null, null, null, null, 1, 2, 3]),
                page_count: data.number_of_pages ? +data.number_of_pages : 0,
                lang: data.languages ? data.languages[0].key.slice(11) : null,
                days_keep_count: getRandomArrayItem([10,30,50,100,200]),
                adding_date: getRandomDate(new Date(2000,0,1), new Date(2016,11,31)),
                count: getRandomArrayItem([5,10,20,50,100,300,500]),
                authors: []
            }

            if(data.authors) {

                let authorsPromises = [];
                data.authors.forEach(author => authorsPromises.push(processAuthor(author.key)));

                Promise
                    .all(authorsPromises)
                    .then( data => {
                        data.forEach(processedAuthor => {
                            if(processedAuthor) processedBook.authors.push(processedAuthor);
                        });
                        resolve({key: book, data: processedBook});
                    });
            }
            else {
                processedBook.authors.push({
                    key: "/authors/unknown",
                    last_name: "Unknown",
                    first_name: "Unknown"
                });
                resolve({key: book, data: processedBook});
            }
        });
    });
}

function processAuthor(author) {

    return new Promise( (resolve, reject) => {
        request.get(baseUrl + author + ".json", (err, res, body) => {

            let data = JSON.parse(body);
            let processedAuthor = {
                key: data.name ? author: "/authors/unknown",
                last_name: data.name ? data.name.replace(/^\S+\s/, "") : "Unknown",
                first_name: data.name ? data.name.replace(/(\s\S+)+$/, "") : "Unknown"
            };

            resolve(processedAuthor);
        });
    });
}

function processRequest(params) {

    return () => new Promise( (resolve, reject) => {

        const options = {
            uri: "http://openlibrary.org/api/things",
            qs: {
                'query' : params.offset
                        ? `{"type":"\/type\/edition", "limit":${params.count}, "offset":${params.offset}}`
                        : `{"type":"\/type\/edition", "limit":${params.count}}`
            },
            json: true
        }
        console.log(`Sending request ${params.number}...`);

        request(options, (err, res, body) => {

            if(body.status == "ok") {

                console.log(`Fetched ${body.result.length} records\nStart processing...`);

                let booksPromises = [];
                body.result.forEach(book => booksPromises.push(processBook(book)));
                Promise.all(booksPromises).then( data => {
                    console.log("Records processed");
                    totalCount += data.length;
                    utils.writeJsonToFile({name: `books${params.number}`, data: data});
                    resolve();
                });
            }
        });
    });
}

main();
