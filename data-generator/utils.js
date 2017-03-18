"use strict";

const fs = require("fs");
const args = require("args-parser")(process.argv);

function createInsertStatement(table, record) {

    let result = "INSERT INTO " + table + " (";
    Object.keys(record).forEach( column => result = result.concat(column + ","));
    result = result.slice(0,-1) + ") VALUES (";

    Object.values(record).forEach( value => result = result.concat(
        typeof value === "string" ? "'" + value.replace(/\'/g, "\\'") + "'," : value + ","));

    return result.slice(0,-1) + ");";
}

module.exports = {

    args: args,

    hasArguments: () => {
        return Object.keys(args).length != 0;
    },

    showHelp: () => {
        console.log("Usage: node generator.js table=TABLE [rows_count=COUNT]\n");
        console.log("\tTABLE: student | teacher | postgraduate | preparatory | applicant | certification_training");
        console.log("\tCOUNT: min=2, max=5000, default=10");
    },

    writeSqlToFile: (params) => {

        let file = fs.createWriteStream("sql/" + params.table + ".sql");
        console.log("Writing insert script to sql/" + params.table + ".sql");
        params.records.forEach(record => file.write(createInsertStatement(params.table, record) + "\n"));
        console.log("Wrote " + params.records.length + " records to sql/" + params.table + ".sql");
    }
}
