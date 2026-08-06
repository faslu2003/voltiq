const mongoose = require('mongoose');


async function connectDB() {

    await mongoose.connect('mongodb://localhost:27017/voltiq');

    console.log("connected to database");
}



module.exports = connectDB;