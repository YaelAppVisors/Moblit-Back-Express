var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors'); // Importa cors
require("dotenv").config();
const connectDB = require("./config/mongo");
connectDB();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var negociosRouter = require('./routes/negocios');
var formRouter = require('./routes/form');

var app = express();

app.use(cors()); // Configura cors
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/negocios', negociosRouter);
app.use('/form', formRouter);

module.exports = app;
