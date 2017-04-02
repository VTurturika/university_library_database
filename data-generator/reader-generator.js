"use strict";

const utils = require("./utils.js");
const fetch = require("./mockaroo-fetch.js");
const args = utils.args;

if(!utils.hasArguments()) {
    utils.showReaderGeneratorHelp();
}
else {

    fetch[ args.table ]( args.rows_count || 10).then( records => {

        utils.writeSqlToFile({
            table: args.table,
            records: records
        });
    });
}
