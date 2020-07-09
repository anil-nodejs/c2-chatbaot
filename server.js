const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
var mongoose = require('mongoose');
const app = express();
const port = 9000;

//database
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://c2_chatbot:MnsrVpD7Fv2!GGt@ds041432.mlab.com:37357/heroku_f6wxmjw9", { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }, (ignore, connection) => {
    connection.onOpen();
    console.log("mongo is connected");

});

//route set path

app.get('/', (req, res) => {
    res.send("Working...");
})
const marutiRoute = require('./routes/maruti');
app.use('/maruti', marutiRoute);
// end path


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.listen(process.env.PORT || port, () => {
    console.log("chatbot server is runnig... at ", port);
})

module.exports = app;