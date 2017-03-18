"use strict";

const conf = require("./config.js");
const Mockaroo = require('mockaroo');
const data = require("./data.json");

const client = new Mockaroo.Client({
    apiKey: conf.MOCKAROO_API_KEY
})

function getRandomArrayItem(array) {
    return array[Math.floor(Math.random()*array.length)];
}

module.exports = {

    student: (rowsCount, callback) => {

        console.log("Fetching records for student schema...");
        client.generate({
            count: rowsCount,
            schema: "student"
        }).then((records) => {
            
            console.log("Fetched " + records.length + " records");
            console.log("Processing records...");

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
            console.log("Records processed");
            callback(records);
        })
    },

    teacher: (rowsCount, callback) => {

        console.log("Fetching records for teacher schema...");
        client.generate({
            count: rowsCount,
            schema: "teacher"
        }).then((records) => {

            console.log("Fetched " + records.length + " records");
            console.log("Processing records...");

            records.forEach( record => {
                record.departument = getRandomArrayItem(data.teacher.departument[record.faculty]);
                switch (data.teacher.position[record.position]) {
                    case "3":
                        record.degree = getRandomArrayItem(data.teacher.degree["3"]);
                        record.rank = data.teacher.rank["3"];
                        break;
                    case "2":
                        record.degree = getRandomArrayItem(data.teacher.degree["2"]);
                        record.rank = record.rank ? data.teacher.rank["2"] : null;
                        break;
                    case "1":
                        record.degree = null;
                        record.rank = record.rank ? data.teacher.rank["1"] : null;
                        break;
                    case "0":
                        record.degree = null;
                        record.rank = null;
                        break;
                }
            });
            console.log("Records processed");
            callback(records);
        });
    }
}
