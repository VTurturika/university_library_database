"use strict";

const pg = require("pg-promise")();
const conf = require("./config.js")
const utils = require('./utils.js');
const args = utils.args;

const db = pg({
    host: conf.DB_HOST,
    port: conf.DB_PORT,
    database: conf.DB_NAME,
    user: conf.DB_USER,
    password: conf.DB_PASSWORD
});


function main() {

    if(utils.hasArguments() && args.tables) {

        let queryPromises = [];
        switch (args.tables) {

            case "book+author":

                utils.readOpenLibraryJsons().forEach( json => {
                    json.forEach( (record,i) => {
                        queryPromises.push( () => processBooksJsonRecord(record, i+1) );
                    });
                });

                utils.runSerial(queryPromises)
                    .then( () => {
                        console.log(`All ${queryPromises.length} records processed`);
                        pg.end();
                    })
                break;

            case "book+section":

                let sections;
                db.many("SELECT * FROM section")
                    .then(rows => {
                        sections = rows;
                        return db.many("SELECT * FROM book")
                    })
                    .then(books => {
                        books.forEach( (book,i) => queryPromises.push(
                            processBookSectionRelation(book, sections, i+1)
                        ))
                        return Promise.all(queryPromises);
                    })
                    .then( () => pg.end() )
                    .catch(err => {
                        console.log(err)
                        pg.end();
                    })

                break;

            case "book+section+reader":

                /*
                forEach(reader) => {

                    for i in range( getRandomInt(1,5) ) {

                        book = getSomeBook() {
                            return randId(minId, maxId)
                        }

                        section = getSomeSection(book)

                    }

                }
                */

                break;

            default:
                utils.showRelationGeneratorHelp();
        }
    }
    else {
        utils.showRelationGeneratorHelp();
    }
}

function processBooksJsonRecord(record, number) {

    return new Promise( resolve => {

        console.log(`Start processing record #${number} (${record.openlibrary_id})...`);

        db.one("SELECT * FROM book WHERE openlibrary_id=$1", record.openlibrary_id)
            .then( dbRecord => {
                console.log(`Book (${record.openlibrary_id}) already exist in database`);
                return utils.runSerial(prepareBookAutorRelations(record, dbRecord))
            })
            .then( () => {
                console.log(`Record #${number} processed\n`);
                resolve();
            })
            .catch(err => {

                console.log("Book not exist. Creating...");
                db.one(createInsertTemplate(record, "book"), record)
                    .then(dbRecord => {
                        console.log(`Book (${record.openlibrary_id}) created`);
                        return utils.runSerial(prepareBookAutorRelations(record, dbRecord))
                    })
                    .then( () => {
                        console.log(`Record #${number} processed\n`)
                        resolve();
                    })
                    .catch(err => resolve() );
            });
    });
}

function processBookAuthorRelation(book, author, authorNumber) {

    return new Promise( resolve => {

        db.one("SELECT * FROM author WHERE openlibrary_id=$1", author.openlibrary_id)
            .then(dbAuthor => {

                console.log(`Author #${authorNumber} (${author.openlibrary_id}) `+
                            `already exist in database`);
                createBookAuthorRelation(book, dbAuthor, authorNumber)
                    .then( row => resolve() )
            })
            .catch(err => {

                console.log(`Author #${authorNumber} not exits. Creating...`)
                db.one(createInsertTemplate(author, "author"), author)
                    .then(dbAuthor => {
                        console.log(`Author (${author.openlibrary_id}) created`);
                        return createBookAuthorRelation(book, dbAuthor, authorNumber)
                    })
                    .then( row => resolve() )
                    .catch(err =>{
                        console.log(err);
                        resolve()
                    })
            })
    });
}

function prepareBookAutorRelations(record, dbRecord) {
    let promises = [];
    console.log(`Checking ${record.authors.length} book's authors...`);
    record.authors.forEach( (author,i) => promises.push(
        () => processBookAuthorRelation(dbRecord, author, i+1)
    ));
    return promises;
}

function createBookAuthorRelation(book, author, authorNumber) {

    return new Promise ( resolve => {

        console.log("Checking relation...");
        db.one("SELECT * FROM book_author WHERE book_id=$1 AND author_id=$2", [book.id, author.id])
            .then(row => {
                console.log(`Relation book (${book.openlibrary_id}) - ` +
                            `author #${authorNumber} (${author.openlibrary_id}) already exist`);
                resolve(row);
            })
            .catch(err => {
                console.log("Relation not exist. Creating...");
                let relation = {
                    book_id: book.id,
                    author_id: author.id
                }
                db.one(createInsertTemplate(relation,"book_author"), relation)
                    .then( row => {
                        console.log(`Relation book (${book.openlibrary_id}) - ` +
                                    `author #${authorNumber} (${author.openlibrary_id}) created`);
                        resolve(row)
                    })
                    .catch(err => resolve() );
            })
    });
}

function createInsertTemplate(obj, table) {

    let fields = (table == "book") ? Object.keys(obj).slice(0,-1) : Object.keys(obj);
    let values = fields.map( value => `$(${value})`).join();

    return `INSERT INTO ${table}(${fields}) VALUES(${values}) RETURNING *`;
}

function processBookSectionRelation(book, sections, bookNumber) {

    return new Promise ( resolve => {
        console.log(`Start processing book #${bookNumber}...`);
        let relationsPromises = [];
        if(book.count == 5) {
            sections.forEach(section => {
                    if(section.type != "читальна зала") {
                        relationsPromises.push(
                            createBookSectionRelation(book, section, 1)
                        )
                    }
                });
        }
        else {
            sections.forEach(section => relationsPromises.push(
                createBookSectionRelation(book, section, book.count/sections.length)
            ));
        }
        Promise.all(relationsPromises)
            .then( () => {
                console.log(`Relations of book #${bookNumber} processed`);
                resolve()
            });
    });
}

function createBookSectionRelation(book, section, count) {

    return new Promise ( resolve => {

        const relation = {
            book_id: book.id,
            section_id: section.id,
            book_count: count
        }

        db.one("SELECT * FROM book_section WHERE book_id=$1 AND section_id=$2", [
            book.id,
            section.id
        ])
        .then( () => resolve() )
        .catch(err =>{

            db.one(createInsertTemplate(relation, "book_section"), relation)
                .then( row => {
                    resolve(row)
                })
                .catch( err => {
                    console.log(err);
                    resolve();
                })
        })
    });
}

main();
