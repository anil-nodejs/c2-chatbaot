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
    if (key == "hdniewnfciejfcie") {
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




module.exports = app;