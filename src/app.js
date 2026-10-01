require('dotenv').config();

const express = require('express');
const app = express();

const nocache = require('nocache');
app.use(nocache());

app.use(express.static('public'));
app.set('view engine', 'ejs');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static('uploads'));


const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, rolling: true }
}));


const adminRoutes = require('../routes/adminRoutes');
app.use('/admin', adminRoutes);

const userRoutes = require('../routes/userRoutes');
app.use('/', userRoutes);






module.exports = app;