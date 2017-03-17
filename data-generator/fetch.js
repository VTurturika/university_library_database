"use strict";

const conf = require("./config.js");
const Mockaroo = require('mockaroo');
const data = require("./data.json");

const client = new Mockaroo.Client({
    apiKey: conf.MOCKAROO_API_KEY
})

module.exports = {

    student: (rowsCount, callback) => {

        console.log("Fetching records for student schema...");
        client.generate({
            count: rowsCount,
            schema: "student"
        }).then((records) => {

            records.forEach( record => {

                record.speciality_title = data.student.speciality[record.speciality_code];

                let startYear = +record.start_date.substr(0,4) - record.course + 1;
                let endYear = startYear + 4;
                record.start_date = record.start_date.replace(/^\d{4}/, startYear);
                record.graduation_date = record.graduation_date.replace(/^\d{4}/, endYear);
                record.is_active = true;
                if(record.course > 4) {
                    record.is_active = false;
                    record.course = 4;
                }
            })
            callback(records);
        })
    }
}
