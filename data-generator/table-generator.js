"use strict";

const utils = require("./utils.js");
const fetch = require("./mockaroo-fetch.js");
const data = require('./filling-data.json');
const args = utils.args;

if(!utils.hasArguments() || utils.hasArguments() && !utils.checkReaderGeneratorArgs()) {
    utils.showReaderGeneratorHelp();
}
else {

    if(args.table == "section") {
        utils.writeSqlToFile({
            table: "section",
            records: data.section
        })
    }
    else {
        fetch[ args.table ]( args.rows_count || 10)
            .then( records => {

                utils.writeSqlToFile({
                    table: args.table,
                    records: records
                });
            });
    }
}
