"use strict";

const request = require("request");
const utils = require("./utils.js");

const options = {
    uri: "http://openlibrary.org/api/things",
    qs: {
        'query': '{"type":"\/type\/edition"}'
    },
    json: true
}

let count = 1;
const baseUrl = "http://openlibrary.org";
const getRandomArrayItem = array => array[Math.floor(Math.random()*array.length)];
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
                                            .toISOString().slice(0, 10);

function processBook(book) {

    return new Promise( (resolve, reject) => {

        request.get(baseUrl + book + ".json", (err, res, body) => {

            console.log("Processing book record " + count++);
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
                data.authors.forEach(author => authorsPromises.push(processAuthor(author)));

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
                resolve({key: book, data: processedBook});
            }
        });
    });
}

function processAuthor(author) {

    return new Promise( (resolve, reject) => {
        request.get(baseUrl + author + ".json", (err, res, body) => {
            let data = JSON.parse(body);
            let processedAuthor;

            if(data.name) {

                processedAuthor = {
                    key: author,
                    last_name: data.name.replace(/^\S\s+/, ""),
                    first_name: data.name.replace(/(\s\S+)+$/, "")
                };
            }
            resolve(processedAuthor);
        });
    });
}

request(options, (err, res, body) => {

    if(err) {
        console.log(err);
        return;
    }

    if(body.status == "ok") {

        console.log("Fetched " + body.result.length + "records\nStart processing...");

        let bookPromises = [];
        body.result.forEach(book => bookPromises.push(processBook(book)));

        Promise
            .all(bookPromises)
            .then( (data) => {

                utils.writeJsonToFile({ name: "books", data: data });
            });
    }
});
