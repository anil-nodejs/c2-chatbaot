const bodyParser = require('body-parser'),
    express = require('express');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const User = require('../models/User');
app.get('/count/:fieldName/:key', (req, res) => {
    let fieldName = req.params.fieldName || null;
    let key = req.params.key || null;
    if (key == "alivenowchatbot") {
        if (fieldName == "total") {
            User.countDocuments({}, function (err, count) {
                if (!err) {
                    return res.send(count.toString());
                }
                else {
                    return res.send(400);
                }
            });
        }
        else {
            return res.sendStatus(400);
        }

    }
    else {
        return res.sendStatus(400);
    }
});

app.get('/total/:fieldName/:key', (req, res) => {
    let fieldName = req.params.fieldName || null;
    let key = req.params.key || null;
    let columnName = ''
    if (key == 'alivenowchatbot') {
        if (fieldName != null) {
            columnName = "$" + fieldName
        }
        if (columnName != '') {
            User.aggregate([
                { $match: {} },
                { $group: { _id: null, total_count: { $sum: columnName } } }
            ]).exec(function (err, data) {
                if (!err) {
                    return res.send(data[0].total_count.toString())
                }
            })
        }
    }

});


module.exports = app;