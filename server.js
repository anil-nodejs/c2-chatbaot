const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
var mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 9000;

//database
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://c2_chatbot:MnsrVpD7Fv2!GGt@ds237357.mlab.com:37357/heroku_f6wxmjw9", { useNewUrlParser: true }, (ignore, connection) => {
    connection.onOpen();
    console.log("mongo is bconnected");

});

//route set path

app.get('/', (req, res) => {
    res.send("Working...");
})
const marutiRoute = require('./routes/m2.js');
app.use('/maruti', marutiRoute);
// end pathfredsde


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());


// app.listen(process.env.PORT || port, () => {
//     console.log("chatbot server is runnig... at ", port);
// })

var server = require('http').Server(app);
server.listen(port, () => {
    console.log("C2- chatbot server is running...");
})

