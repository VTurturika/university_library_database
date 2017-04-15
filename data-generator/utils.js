"use strict";

const fs = require("fs");
const args = require("args-parser")(process.argv);

function createInsertStatement(table, record) {

    let values = Object.values(record).map ( value =>
        typeof value === "string"
        ? `'${value}'`
        : value === null
        ? "null"
        : value
    );

    return `INSERT INTO ${table}(${Object.keys(record).join()}) VALUES(${values.join()});`;
}

module.exports = {

    args: args,

    hasArguments: () => {
        return Object.keys(args).length != 0;
    },

    showReaderGeneratorHelp: () => {
        console.log("Usage:\n\tnode table-generator.js table=TABLE [rows_count=COUNT]");
        console.log("\tTABLE: student | teacher | postgraduate | preparatory | applicant | certification_training | section");
        console.log("\tCOUNT: min=2, max=5000, default=10");
    },

    showGrabberHelp: () => {
        console.log("Usage:\n\tnode openlibrary-grabber.js books=COUNT");
    },

    writeSqlToFile: (params) => {

        let file = fs.createWriteStream(`sql/${params.table}.sql`);
        console.log(`Writing insert script to sql/${params.table}.sql`);
        params.records.forEach(record => file.write(createInsertStatement(params.table, record) + "\n"));
        console.log(`Wrote ${params.records.length} records to sql/${params.table}.sql\n`);
    },

    writeJsonToFile: (params) => {
        fs.writeFileSync(`openlibrary/${params.name}.json`, JSON.stringify(params.data, null,2))
        console.log(`Wrote ${params.data.length} book records to openlibrary/${params.name}.json`);
    },

    clearOpenLibraryDirectory: () => {
        fs.readdir("openlibrary", (err, files) => {
            files.forEach(file => fs.unlink(`openlibrary/${file}`) );
        });
    },

    getRandomArrayItem : (array) => array[Math.floor(Math.random()*array.length)],

    getRandomInt : (min,max) => Math.floor(Math.random() * (max - min + 1)) + min,

    splitFirstName : (fullName) => fullName ? fullName.replace(/(\s\S+)+$/, "") : "Unknown",

    splitLastName : (fullName) => fullName ? fullName.replace(/^\S+\s/, "") : "Unknown",

    getRandomDate : (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
                                            .toISOString().slice(0, 10),

    showRelationGeneratorHelp: () => {
        console.log("Usage:\n\tnode relation-generator.js tables=TABLES " +
                    "\n\tTABLES: book+author | book+section | book+section+reader");
    },

    runSerial: (tasks) => {
        let result = Promise.resolve();
        tasks.forEach(task => {
            result = result.then(() => task());
        });
        return result;
    },

    readOpenLibraryJsons: () => {
        let result = [];
        console.log("Reading openlibrary jsons...");
        fs.readdirSync("openlibrary").forEach(file => {
            let json = require(`./openlibrary/${file}`);
            result.push(json);
        })
        console.log("Done");
        return result;
    },

    cutLongStr: (str) => str.length > 100 ? str.slice(0,100): str,

    checkReaderGeneratorArgs: () => {
        const possibleTables = {
            "student": true,
            "teacher": true,
            "postgraduate": true,
            "preparatory": true,
            "applicant": true,
            "certification_training": true,
            "section": true
        }

        return args.table && possibleTables[args.table];
    }
}
