const mongoose = require('mongoose');

async function main() {
    mongoose.connect(process.env.DB_CONNECTION_STRING)
    console.log('Connected to MongoDB database');
}

module.exports = main;