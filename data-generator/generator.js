"use strict";

const utils = require("./utils.js");
const fetch = require("./fetch.js");
const args = utils.args;

if(!utils.hasArguments()) {
    utils.showHelp();
}
else {

    fetch[ args.table ]( args.rows_count || 50, (records) => {

        utils.writeSqlToFile({
            table: args.table,
            records: records
        });
    });
}
