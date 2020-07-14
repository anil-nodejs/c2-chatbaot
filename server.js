const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
var mongoose = require('mongoose');
var db = require('./config/database').mongoDB_URL;
const app = express();
const port = process.env.PORT || 9000;

//database
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://c2_chatbot:$zN@U@gdCVdL#2t@ds021182.mlab.com:21182/heroku_19sv2vb4', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (connection) => {
    connection.onOpen();
});
//route set path

app.get('/', (req, res) => {
    res.send("Working....");
})
const marutiRoute = require('./routes/maruti.js');
app.use('/maruti', marutiRoute);

const dashboardRoute = require('./routes/dashboard.js');
app.use('/dashboard', dashboardRoute);

// end 

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

var server = require('http').Server(app);
server.listen(port, () => {
    console.log("C2- chatbot server is running...");
})

