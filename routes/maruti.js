const bodyParser = require('body-parser'),
    express = require('express'),
    request = require('request'),
    rp = require('request-promise');
const router = require('./chatroute');
const app=express();
const URL='https://c2-chatbot.herokuapp.com/maruti/open';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
const access_token='EAAFvWNLDGMMBAFJaPNoLHLxKxZBV7KRvlJwNk1LauPFLZAKMqIJI6XtCRWascoa5752CoielePM4yfdmVJ1bVm54jp4c9a8Q0X3fNc6Fy9M9akZC93w3ILwXUgMsj6LUrfJRChTnuN6UyzLS9A87vCcRLyAcZApIZA0ZCykMWr6BgeRXdQmuqg';
const User =require('../models/User');


//start button routing
app.get('/getStarted',(req,res)=>
{
  res.status(200).send("getStarted");
  rp(
      {
        uri: 'https://graph.facebook.com/v4.0/me/thread_settings',
        qs: { access_token: access_token },
        method: 'POST',
        json: {
            "setting_type": "call_to_actions",
            "thread_state": "new_thread",
            "call_to_actions": [
                {
                    "payload": "getStarted"
                }
            ]
        }
      });
});

//add menu list

app.get('/menu', (req, res) => {
    res.status(200).send("menu");
    let messageData = {
        "persistent_menu": [
            {
                "locale": "default",
                "composer_input_disabled": true,
                "call_to_actions": [
                    {
                        "type": "postback",
                        "title": "Explore Mission Green Million",
                        "payload": "Mission_Green_Million"
                    },
                    {
                        "type": "postback",
                        "title": "Know More about Auto Expo 2020",
                        "payload": "whats_happening"
                    },
                    {
                        "type": "postback",
                        "title": "Restart bot",
                        "payload": "restart"
                    }
                ]
            }
        ]
    };

    rp({
        uri: 'https://graph.facebook.com/v4.0/me/messenger_profile',
        qs: { access_token: access_token },
        method: 'POST',
        json: messageData
    })
        .then(response => {
            console.log(response);
        })
        .catch(error => {
            console.log(error);
        });
});



//bot added the verify token

app.get('/bot', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === "96529652959") {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

//post reques for bot


app.post('/bot', (req, res) => {
    let data = req.body;
    res.sendStatus(200);
    if (data.object === 'page') {
        data.entry.forEach(entry => {
            entry.messaging.forEach(event => {
                if (event.sender == undefined || event.sender.id == undefined) {
                    return;
                }
                let senderID = event.sender.id;
                if (event.delivery != undefined) {
                    deliveryReport(senderID);
                    return;
                }
                let message = event.message;
                User.findOne({ fbid: senderID }).exec((err, user) => {
                    if (!err) {
                        // New User
                        if (user == null) {
                            console.log("new user");
                            let newUser = User();
                            newUser.fbid = senderID;
                            newUser.first_name = "";
                            newUser.last_name = "";
                            newUser.lastAction = "get started";
                            newUser.getstarted_clicks = 1;
                            newUser.save((err, user) => {
                                if (!err) {
                                    getData(senderID);
                                    /* getstarted(senderID); */
                                }
                                else {
                                    console.log("err 1");
                                    console.log(err);
                                }
                            });
                        }
                        //Old user
                        else {
                            console.log("Old user");

                            if (user.first_name == "" || user.first_name == null) {
                                getData1(senderID);
                            }

                            let eventAction = "";
                            if (event.message != undefined && event.message.quick_reply != undefined) {
                                eventAction = event.message.quick_reply.payload;
                                quickReplyRequest(senderID, eventAction);
                            }
                            else if (event.message != undefined && event.message.text != undefined) {
                                textMessageRequest(senderID, event.message.text.toLowerCase(),user);
                            }
                            else if (event.message != undefined && event.message.attachments != undefined) {
                                attachmentsRequest(senderID, event.message.attachments, user);
                            }
                            else {
                                if (event.postback != undefined && event.postback.payload != undefined) {
                                    eventAction = event.postback.payload;
                                    postbackRequest(senderID, eventAction, user);
                                }
                                else {
                                    defaultMessage(senderID);
                                }
                            }
                        }
                    }
                    else {
                        console.log("err");
                        console.log(err);
                    }
                });

            });
        });
    }
});

function getstarted(senderID, user) {
    sendTextMessage(senderID, "Hey " + user.first_name + "! It's that time of the year again. We are back with our presence at Auto Expo. Tell us, what would you like to know");

    setTimeout(() => {
        sendItems(senderID, 'level_1Obj');
    }, 500);
}
module.exports=app