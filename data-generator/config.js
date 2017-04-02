"use strict";

module.exports = {

    MOCKAROO_API_KEY: process.env.MOCKAROO_API_KEY || "",
    DB_HOST: process.env.DB_HOST || "localhost",
    DB_NAME: process.env.DB_NAME || "university_library",
    DB_USER: process.env.DB_USER || "victor",
    DB_PASSWORD: process.env.DB_PASSWORD || "",
    DB_PORT: process.env.DB_PORT || 5432
    
}
