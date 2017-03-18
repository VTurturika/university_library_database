"use strict";

const utils = require("./utils.js");
const fetch = require("./fetch.js");
const args = utils.args;

if(!utils.hasArguments()) {
    utils.showHelp();
}
else {

    fetch[ args.table ]( args.rows_count || 10, (records) => {

        utils.writeSqlToFile({
            table: args.table,
            records: records
        });
    });
}
