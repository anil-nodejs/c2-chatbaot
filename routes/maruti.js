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
        req.query['hub.verify_token'] === "anilyadav_chatbotDemo2020") {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});
module.exports=app