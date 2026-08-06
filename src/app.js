require('dotenv').config();

const express = require('express');
const app = express();


// app.use((req, res, next) => {
//     res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
//     res.set('Pragma', 'no-cache');
//     res.set('Expires', '0');

//     next();
// });


app.use(express.static('public'));
app.set('view engine', 'ejs');


app.use(express.urlencoded({ extended: true }));


const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, rolling: true }
}));


const userRoutes = require('../routes/userRoutes');
app.use('/', userRoutes);

const adminRoutes = require('../routes/adminRoutes');
app.use('/admin', adminRoutes);










module.exports = app;