"use strict";

const fs = require("fs");
const args = require("args-parser")(process.argv);

function createInsertStatement(table, record) {


    let result = "INSERT INTO " + table + " (";
    Object.keys(record).forEach( column => result = result.concat(column + ","));
    result = result.slice(0,-1) + ") VALUES (";

    Object.values(record).forEach( value => result = result.concat(
        typeof value === "string" ? "'" + value + "'," : value + ","));

    return result.slice(0,-1) + ");";
}

module.exports = {

    args: args,

    hasArguments: () => {
        return Object.keys(args).length != 0;
    },

    showHelp: () => {
        console.log("Usage: node generator.js table=TABLE [rows_count=COUNT]\n");
        console.log("\tTABLE: student");
        console.log("\tCOUNT: min=1, max=5000, default=50");
    },

    writeSqlToFile: (params) => {

        let file = fs.createWriteStream("sql/" + params.table + ".sql");
        params.records.forEach(record => file.write(createInsertStatement(params.table, record) + "\n"));
    }
}
