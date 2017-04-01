"use strict";

const fs = require("fs");
const args = require("args-parser")(process.argv);

function createInsertStatement(table, record) {

    let result = `INSERT INTO ${table} (`;
    Object.keys(record).forEach( column => result = result.concat(column + ","));
    result = result.slice(0,-1) + ") VALUES (";

    Object.values(record).forEach( value => result = result.concat(
        typeof value === "string" ? `'${value.replace(/\'/g, "`")}',` : `${value},`));

    return result.slice(0,-1) + ");";
}

module.exports = {

    args: args,

    hasArguments: () => {
        return Object.keys(args).length != 0;
    },

    showHelp: () => {
        console.log("Usage: node reader-generator.js table=TABLE [rows_count=COUNT]\n");
        console.log("\tTABLE: student | teacher | postgraduate | preparatory | applicant | certification_training");
        console.log("\tCOUNT: min=2, max=5000, default=10");
    },

    showGrabberHelp: () => {
        console.log("Usage:\n\tnode openlibrary-grabber.js books_count=COUNT");
    },

    writeSqlToFile: (params) => {

        let file = fs.createWriteStream(`sql/${params.table}.sql`);
        console.log(`Writing insert script to sql/${params.table}.sql`);
        params.records.forEach(record => file.write(createInsertStatement(params.table, record) + "\n"));
        console.log(`Wrote ${params.records.length} records to sql/${params.table}.sql`);
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
                                            .toISOString().slice(0, 10)

}
