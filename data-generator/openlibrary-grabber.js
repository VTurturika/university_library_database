"use strict";

const request = require("request");
const utils = require("./utils.js");
const args = utils.args;

let totalCount = 0;
const recordsPerRequest = 200;
const maxBookOffset = 5000000;
const maxAuthorOffset = 500000;
const baseUrl = "http://openlibrary.org";
const requestUrl = "http://openlibrary.org/api/things";

function main() {

    if(utils.hasArguments() && args.books) {

        let booksCount = +args.books;
        utils.clearOpenLibraryDirectory();

        if(booksCount <= recordsPerRequest) {

            utils.runSerial([
                processRequest({
                    count:booksCount,
                    number: 1,
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
                    number: i+1
                }));
            }

            if(booksCount%recordsPerRequest != 0) {
                requestsPromises.push(processRequest({
                    count: booksCount%recordsPerRequest,
                    number: requestsCount+1
                }))
            }

            utils.runSerial(requestsPromises)
                .then(() => console.log(`\nAll requests finished\n`+
                                        `Fetched ${totalCount} records, wrote to ${requestsCount} files`));
        }
    }
    else {
        utils.showGrabberHelp();
    }
}


function processBook(book) {

    return new Promise( resolve => {

        request.get(`${baseUrl}${book}.json`, (err, res, body) => {

            let data = JSON.parse(body);
            let processedBook = {
                openlibrary_id: book,
                title: utils.cutLongStr(data.title),
                city: data.publish_places ? data.publish_places[0] : null,
                publisher: data.publishers ? data.publishers[0] : null,
                year: data.publish_date ? +data.publish_date.slice(-4) : null,
                subject: data.subjects ? data.subjects[0] : null,
                genre: data.genres ? data.genres[0] : null,
                periodic_release: utils.getRandomArrayItem([null, null, null, null, null, 1, 2, 3]),
                page_count: data.number_of_pages ? +data.number_of_pages : 0,
                lang: data.languages ? data.languages[0].key.slice(11) : null,
                days_keep_count: utils.getRandomArrayItem([10,30,50,100,200]),
                adding_date: utils.getRandomDate(new Date(2000,0,1), new Date(2016,11,31)),
                count: utils.getRandomArrayItem([5,10,20,50,100,300,500]),
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
                        resolve(processedBook);
                    });
            }
            else {
                fetchRandomAuthor()
                    .then(randomAuthor => {
                        processedBook.authors.push({
                            openlibrary_id: randomAuthor.key,
                            last_name: utils.cutLongStr(utils.splitLastName(randomAuthor.name)),
                            first_name: utils.cutLongStr(utils.splitFirstName(randomAuthor.name))
                        });
                        resolve(processedBook);
                    });
            }
        });
    });
}

function processAuthor(author) {

    return new Promise( resolve => {
        request.get(`${baseUrl}${author}.json`, (err, res, body) => {

            let data = JSON.parse(body);
            if(data.name) {
                resolve({
                    openlibrary_id: author,
                    last_name: utils.cutLongStr(utils.splitLastName(data.name)),
                    first_name: utils.cutLongStr(utils.splitFirstName(data.name)),
                });
            }
            else {
                fetchRandomAuthor()
                    .then(randomAuthor => {
                        resolve({
                            openlibrary_id: randomAuthor.key,
                            last_name: utils.cutLongStr(utils.splitLastName(randomAuthor.name)),
                            first_name: utils.cutLongStr(utils.splitFirstName(randomAuthor.name))
                        });
                    });
            }
        });
    });
}

function fetchRandomAuthor() {

    return new Promise( resolve => {

        request({
            uri: requestUrl,
            qs: {
                'query': `{"type":"\/type\/author", "limit":1, `+
                          `"offset":${utils.getRandomInt(0,maxAuthorOffset)}}`
            },
            json: true
        },(err, res, body) => {
            let author = body.result[0];
            request.get(`${baseUrl}${author}.json`, (err,res,body) => {

                let author = JSON.parse(body);
                if(author.name) {
                    resolve(author);
                }
                else {
                    resolve({
                        openlibrary_id: "/authors/unknown",
                        name: "Unknown Unknown"
                    });
                }
            });
        });
    });
}

function processRequest(params) {

    return () => new Promise( resolve => {

        const options = {
            uri: requestUrl,
            qs: {
                'query' : `{"type":"\/type\/edition", "limit":${params.count},`+
                           `"offset":${utils.getRandomInt(0,maxBookOffset)}}`
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
