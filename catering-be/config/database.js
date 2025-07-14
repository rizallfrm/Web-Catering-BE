require("dotenv").config();

// database config
module.exports = {
    development: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        host: "127.0.0.1",
        dialect: "postgres",
    },
};