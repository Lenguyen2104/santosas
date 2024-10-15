require('dotenv').config();
const { MONGODB_CONNECT } = process.env;

var mongoose = require('mongoose');
mongoose.connect(MONGODB_CONNECT);

const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const server = http.createServer(app);
const ejs         = require('ejs');


app.use(cors());
app.use(express.json());


const userRoute     = require('./routes/userRoute');
const User          = require('./models/userModel');
require('./controllers/crontabController');



app.set('view engine', 'ejs');
app.use('/', userRoute);




app.listen(3000, function () {
    console.log('Server is running');
});



