"use strict";

const conf = require("./config.js");
const Mockaroo = require('mockaroo');
const data = require("./data.json");

const client = new Mockaroo.Client({
    apiKey: conf.MOCKAROO_API_KEY
})

const getRandomArrayItem = array => array[Math.floor(Math.random()*array.length)];
const getRandomInt = (min,max) => Math.floor(Math.random() * (max - min + 1)) + min;

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
    },

    postgraduate: (rowsCount, callback) => {

        console.log("Fetching records for postgraduate schema...");
        client.generate({
            count: rowsCount,
            schema: "postgraduate"
        }).then((records) => {
            console.log("Fetched " + records.length + " records");
            console.log("Processing records...");

            records.forEach( record => {
                record.speciality_title = data.student.speciality[record.speciality_code];
                let yearOffset = getRandomInt(1,7);
                let startYear = +record.start_date.substr(0,4) - yearOffset;
                let endYear = startYear + 3;
                record.start_date = record.start_date.replace(/^\d{4}/, startYear);
                record.graduation_date = record.graduation_date.replace(/^\d{4}/, endYear);
                record.is_active = yearOffset < 4;
            });
            console.log("Records processed");
            callback(records);
        });
    },

    preparatory: (rowsCount, callback) => {

        console.log("Fetching records for preparatory schema...");
        client.generate({
            count: rowsCount,
            schema: "preparatory"
        }).then((records) => {
            console.log("Fetched " + records.length + " records");
            console.log("Processing records...");

            records.forEach( record => {
                let yearOffset = getRandomInt(0,7);
                let year = +record.start_studying.substr(0,4) - yearOffset;
                record.start_studying = record.start_studying.replace(/^\d{4}/, year);
                record.end_studying = record.end_studying.replace(/^\d{4}/, year);
                record.is_active = year == 0;
            });
            console.log("Records processed");
            callback(records);
        });
    },

    applicant: (rowsCount, callback) => {

        console.log("Fetching records for applicant schema...");
        client.generate({
            count: rowsCount,
            schema: "applicant"
        }).then((records) => {
            console.log("Fetched " + records.length + " records");
            console.log("Processing records...");

            records.forEach( record => {
                record.speciality_title = data.student.speciality[record.speciality_code];
                record.entry_year = +record.entry_year.substr(0,4);
                record.is_active = record.entry_year == 2017;
            });
            console.log("Records processed");
            callback(records);
        });
    },

    certification_training: (rowsCount, callback) => {

        console.log("Fetching records for certification_training schema...");
        client.generate({
            count: rowsCount,
            schema: "certification_training"
        }).then((records) => {
            console.log("Fetched " + records.length + " records");
            console.log("Processing records...");

            records.forEach( record => {
                record.departument = getRandomArrayItem(data.teacher.departument[record.faculty]);
                record.speciality_title = data.student.speciality[record.speciality_code];
                let yearOffset = getRandomInt(0,7);
                let year = +record.start_training.substr(0,4) - yearOffset;
                record.start_training = record.start_training.replace(/^\d{4}/, year);
                record.end_training = record.end_training.replace(/^\d{4}/, year);
                record.is_active = false;
            });
            console.log("Records processed");
            console.log(records);
            callback(records);
        });
    }
}
