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
                        return db.many("SELECT * FROM book");
                    })
                    .then(books => {
                        books.forEach( (book,i) => queryPromises.push(
                            () => processBookSectionRelation(book, sections, i+1)
                        ))
                        return utils.runSerial(queryPromises);
                    })
                    .then( () => pg.end() )
                    .catch(err => {
                        console.log(err)
                        pg.end();
                    });

                break;

            case "book+section+reader":

                db.many("SELECt * FROM reader")
                    .then(readers => {

                        readers.forEach( reader => {
                            queryPromises.push( () => processReader(reader));
                        })
                        utils.runSerial(queryPromises)
                            .then( () => {
                                console.log(`All ${queryPromises.length} records processed`);
                                pg.end();
                            })
                    })

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
            book_count: count,
            available_count: count
        };

        db.one("SELECT * FROM book_section WHERE book_id=$1 AND section_id=$2", [
            book.id,
            section.id
        ])
            .then( () => resolve() )
            .catch(err => {

                db.one(createInsertTemplate(relation, "book_section"), relation)
                    .then( row => {
                        resolve(row)
                    })
                    .catch( err => {
                        console.log(err);
                        resolve();
                    })
        });
    });
}

function processReader(reader) {

    return new Promise( resolve => {

        console.log(`Start processing reader ${reader.reader_id}...`);
        let relationsPromises = [];
        let relationsCount = utils.getRandomInt(1,5);
        console.log(`Reader may has ${relationsCount} book events`);
        for(let i=0; i<relationsCount; i++) {
            relationsPromises.push( () => processReaderBookRelation(reader,i+1) )
        }

        utils.runSerial(relationsPromises)
            .then( () => {
                console.log(`Reader ${reader.reader_id} processed\n`);
                resolve();
            })
    });
}

function processReaderBookRelation(reader, count) {

    return new Promise( resolve => {

        const relation = {};
        let specifiedReader, random;
        console.log(`\nRelation #${count}`);
        db.one(`SELECT * FROM ${reader.kind} WHERE reader_id=$1`, reader.reader_id)
            .then( reader => {
                specifiedReader = reader;
                return getRandomBook();
            })
            .then( randomBookAndSection => {
                random = randomBookAndSection;
                console.log(`Reader ${reader.reader_id}, book ${random.book.id}, section ${random.section.id}`);
                console.log("Checking if book available...");
                return db.one("SELECT * FROM book_section WHERE book_id=$1 AND section_id=$2", [
                    random.book.id,
                    random.section.id
                ])
            })
            .then( bookSection => {

                if(bookSection.available_count == 0) {
                    console.log("This book doesn't available. Relation rejected");
                    resolve();
                }
                else console.log("Book available");

                relation.reader_id = reader.reader_id;
                relation.book_id = random.book.id;
                relation.section_id = random.section.id;

                let dateResult;
                console.log("Determining dates for event...");
                switch (random.section.type) {

                    case "міжбібліотечний абонемент":
                        dateResult = generateDatesForOverLibrarySubscription(specifiedReader, random.book);
                        break;
                    case "абонемент":
                        dateResult = generateDatesForSubscription(specifiedReader, random.book);
                        break;
                    case "читальна зала":
                        dateResult = generateDatesForReadingRooms(specifiedReader);
                        break;
                }

                if(!dateResult.cansel) {
                    delete dateResult.cansel;
                    Object.keys(dateResult).forEach( key => relation[key] = dateResult[key] );
                    console.log("Generated dates:");
                    console.log(dateResult);
                    let violation = generateViolation(random.book, random.section, dateResult);
                    Object.keys(violation).forEach( key => relation[key] = violation[key] );
                    console.log("Generated violations:");
                    console.log(violation);
                    createReaderBookSectionRealtion(relation).then( () => resolve());
                }
                else {
                    console.log("Relation rejected");
                    console.log(`Readers from ${reader.kind} group can't take books from ${random.section.type}`);
                    resolve();
                }
            })
            .catch( err => {
                console.log(err);
                resolve();
            });
    });
}

function getRandomBook() {

    return new Promise( resolve => {
        console.log("Fetching random book...");
        let randomBook;
        db.many("SELECT * FROM book")
            .then( books => {
                randomBook = utils.getRandomArrayItem(books);
                return db.many("SELECT * FROM book_section WHERE book_id=$1", randomBook.id);
            })
            .then( sections => {
                let randomSection = utils.getRandomArrayItem(sections);
                return db.one("SELECT * FROM section WHERE id=$1", randomSection.section_id);
            })
            .then( section => {
                console.log(`Fetched book ${randomBook.id} from section ${section.id}`);
                resolve({
                    book: randomBook,
                    section: section
                })
            })
            .catch(err => {
                console.log(err);
                resolve();
            });
    });
}

function createReaderBookSectionRealtion(relation) {

    relation.event_state = ( relation.start_date == null && relation.end_date == null ) ? "замовлена" :
                           ( relation.start_date != null && relation.end_date == null ) ? "на руках" : "повернена"
    console.log("Checking relation...");
    return new Promise( resolve => {
        db.one("SELECT * FROM book_event WHERE reader_id=$(reader_id) " +
               "AND book_id=$(book_id) AND section_id=$(section_id)", relation)
               .then( row => {
                   console.log(`Relation already exist`);
                   resolve();
               })
               .catch( err => {
                   console.log("Relation not exist. Creating...");
                   db.one(createInsertTemplate(relation, "book_event"), relation)
                        .then( dbRelation => {

                            console.log("Relation created");

                            if(relation.start_date != null && relation.end_date == null) {

                                db.one("SELECT * FROM book_section WHERE book_id=$1 AND section_id=$2", [
                                    relation.book_id,
                                    relation.section_id
                                ])
                                .then( row => {
                                    return db.any("UPDATE book_section SET available_count=available_count-1 " +
                                                  "WHERE book_id=$1 AND section_id=$2", [
                                                      relation.book_id,
                                                      relation.section_id
                                                  ])
                                })
                                .then( () => {
                                    resolve();
                                })
                                .catch(err => {
                                    console.log(err);
                                    resolve();
                                })

                            }
                            else {
                                resolve();
                            }
                        })
                        .catch( err => {
                            console.log(err);
                            resolve();
                        });
               });
    });
}

function generateDatesForReadingRooms(reader) {

    let date;
    switch (reader.kind) {

        case "student":
        case "postgraduate":
            date = utils.getRandomDate( new Date(reader.start_date),
                                        reader.is_active ? new Date() :
                                        new Date(reader.graduation_date));
            break;
        case "preparatory":
            date = utils.getRandomDate( new Date(reader.start_studying),
                                        reader.is_active ? new Date() :
                                        new Date(reader.end_studying));
            break;
        case "certification_training":
            date = utils.getRandomDate( new Date(reader.start_training),
                                        reader.is_active ? new Date() :
                                        new Date(reader.end_training));
            break;
        case "applicant":
            date = utils.getRandomDate( new Date(reader.entry_year, 5, 1),
                                        reader.is_active ? new Date() :
                                        new Date(reader.entry_year, 5, 1));
                break;
        case "teacher":
            date = utils.getRandomDate( new Date(2000, 0, 1), new Date() );
            break;
    }

    return {
        cansel: false,
        start_date: date,
        end_date: date
    };
}

function generateDatesForSubscription(reader, book) {

    let startDate, endDate;
    if(reader.priority > 0) {

        switch (reader.kind) {
            case "student":
            case "postgraduate":
                startDate = utils.getRandomDate( new Date(reader.start_date),
                                                 reader.is_active ? new Date() :
                                                 new Date(reader.graduation_date));
                endDate = new Date(startDate);
                endDate.setDate( endDate.getDate() + utils.getRandomInt(book.days_keep_count-8, book.days_keep_count));
                if(endDate > new Date(reader.graduation_date)) endDate = reader.graduation_date;
                break;

            case "teacher":
                startDate = utils.getRandomDate( new Date(2000, 0, 1), new Date() );
                endDate = new Date(startDate);
                endDate.setDate( endDate.getDate() + utils.getRandomInt(book.days_keep_count-8, book.days_keep_count));
                break;
        }
        if(endDate > new Date()) endDate = null;
        return {
            cansel: false,
            start_date: startDate,
            end_date: endDate ? endDate.toISOString().slice(0, 10) : endDate
        };
    }
    else return {cansel: true};
}

function generateDatesForOverLibrarySubscription(reader, book) {

    let orderDate, startDate, endDate;
    if(reader.priority > 0) {

        switch (reader.kind) {
            case "student":
            case "postgraduate":
                orderDate = utils.getRandomDate( new Date(reader.start_date),
                                                 reader.is_active ? new Date() :
                                                 new Date(reader.graduation_date));
                startDate = new Date(orderDate);
                startDate.setDate( startDate.getDate() + utils.getRandomInt(5,10));
                if(startDate > new Date() ) startDate = null;
                endDate = new Date(startDate);
                endDate.setDate( endDate.getDate() + utils.getRandomInt(book.days_keep_count-8, book.days_keep_count));
                if(endDate > new Date(reader.graduation_date)) endDate = reader.graduation_date;
                break;

            case "teacher":
                orderDate = utils.getRandomDate( new Date(2000, 0, 1), new Date() );
                startDate = new Date(orderDate);
                endDate = new Date(startDate);
                endDate.setDate( endDate.getDate() + utils.getRandomInt(book.days_keep_count-8, book.days_keep_count));
                break;
        }
        if(endDate > new Date()) endDate = null;
        return {
            cansel: false,
            start_date: startDate ? startDate.toISOString().slice(0, 10) : startDate,
            end_date: endDate ? endDate.toISOString().slice(0, 10) : endDate,
            order_date: orderDate
        };
    }
    else return {cansel: true};
}

function generateViolation(book, section, dateResult) {

    if(utils.getRandomInt(1,100) > 30) return {};

    const possibleViolation = [{
            violation: "не вчасно повернена",
            punishment: ["штраф"],
        },{
            violation: "загублена",
            punishment: ["заміна", "відшкодування"],
        },{
            violation: "зіпсована",
            punishment: ["заміна", "відшкодування"],
        }
    ];

    let randomViolation = utils.getRandomArrayItem(possibleViolation);
    let newEndDate;
    if( section.type != "читальна зала" && randomViolation == "не вчасно повернена" && dateResult.start_date ) {
        newEndDate = new Date(dateResult.start_date);
        newEndDate.setDate( newEndDate.getDate() + book.days_keep_count + utils.getRandomInt(10,50) );
        newEndDate = newEndDate.toISOString().slice(0, 10);
    }
    let randomPunishment = utils.getRandomArrayItem(randomViolation.punishment);

    return {
        violation: randomViolation.violation,
        punishment: randomPunishment,
        punishment_cost: randomPunishment != "заміна" ? utils.getRandomInt(100, 1000) : null,
        end_date: newEndDate ? newEndDate : dateResult.end_date
    }
}

main();
