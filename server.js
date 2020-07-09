
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
var mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 9000;
// mongoose.Promise = global.Promise;
mongoose.connect("mongodb://aa_chatbot2020:7n!mT5e5dceAs_5@ds041432.mlab.com:37357/heroku_f6wxmjw9", { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }, (ignore, connection) => {
    // connection.onOpen();
    console.log("dekcmek")
});

app.get('/', (req, res) => {

    res.send("Working...")
});
//maruti route
const marutiRoute = require('./routes/maruti');
app.use('/maruti', marutiRoute);
// end path
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

var server = require('http').Server(app);
server.listen(port, function () {
    console.log('C2 Chatbot server is running...at', port);
});

