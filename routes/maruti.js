const bodyParser = require('body-parser'),
    express = require('express'),
    request = require('request'),
    rp = require('request-promise');
// const router = require('./chatroute');
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



app.get('/open/:fbid/:story', (req, res) => {
    let fbid = parseInt(req.params.fbid) || 0;
    let story = req.params.story || null;
    console.log("fbid", fbid, "story", story);

    const data = {
        "Mission_Green_Million_lnk": "https://www.marutisuzuki.com/auto-expo-2020/mission-green-million.html",
        "Venue_of_Auto_Expo_lnk": "https://goo.gl/maps/e3WgR91vRNkroHLe6",
        "Dates_Timings_lnk": "https://www.marutisuzuki.com/auto-expo-2020/studio.html",
        "Book_My_Tickets_lnk": "https://in.bookmyshow.com/national-capital-region-ncr/events/auto-expo-the-motor-show-2020/ET00118921",
        "Ignis_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Brezza_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Swift_Hybrid_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Jimny_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Concept_FUTURO_e_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "About_Maruti_Suzuki_Studio_lnk": "https://www.marutisuzuki.com/auto-expo-2020/studio.html",
        "Studio_Spotlight_lnk": "https://www.marutisuzuki.com/auto-expo-2020/studio.html",
        "Twitter_Green_Room_lnk": "https://www.marutisuzuki.com/auto-expo-2020/studio.html",
        "Studio_Schedule_lnk": "https://www.marutisuzuki.com/auto-expo-2020/studio.html",
        "Ertiga_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "S_presso_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "WagonR_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Celerio_X_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Vitara_Brezza_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "EECO_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Celerio_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Alto_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Swift_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "DZire_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Ignis_Nexa_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "XL6_Nexa_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "S_Cross_Nexa_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Baleno_Nexa_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Ciaz_Nexa_btn_lnk": "https://www.marutisuzuki.com/auto-expo-2020/our-showcase.html",
        "Maruti_Suzuki_Arena_btn_lnk": "https://www.marutisuzuki.com/corporate/reach-us/contact-us#write-to-us",
        "Maruti_Suzuki_Nexa_btn_lnk": "https://www.nexaexperience.com/contact-us/",
        "Maruti_Suzuki_True_Value_btn_lnk": "https://www.marutisuzukitruevalue.com/contact",
        "Maruti_Suzuki_Commercial_btn_lnk": "http://www.marutisuzukicommercial.com/#enq_popup",
        "Maruti_Suzuki_Arena_loc_btn_lnk": "https://www.marutisuzuki.com/channels/arena/locate-a-dealer",
        "Maruti_Suzuki_Nexa_loc_btn_lnk": "https://www.nexaexperience.com/showroom-locator/",
        "Maruti_Suzuki_True_Value_loc_btn_lnk": "https://www.marutisuzukitruevalue.com/dealerlocator/",
        "Maruti_Suzuki_Commercial_loc_btn_lnk": "http://www.marutisuzukicommercial.com/find-dealer.html",
        "About_Maruti_Suzuki_btn_lnk": "https://www.marutisuzuki.com/corporate/about-us",
        "Maruti_Suzuki_Arena_about_btn_lnk": "https://www.marutisuzuki.com/channels/arena/all-cars",
        "Maruti_Suzuki_Nexa_about_btn_lnk": "https://www.nexaexperience.com/",
        "Maruti_Suzuki_True_Value_about_btn_lnk": "https://www.marutisuzukitruevalue.com/",
        "Maruti_Suzuki_Commercial_about_btn_lnk": "http://www.marutisuzukicommercial.com/"
    };

    if (data[story]) {
        User.findOneAndUpdate(
            { fbid: fbid },
            { $inc: { [story]: 1 } },
            { upsert: false },
            (err, user) => {
            });
        res.redirect(data[story]);
    } else {
        res.redirect("https://www.marutisuzuki.com/auto-expo-2020/");
    }
});

function deliveryReport(senderID) {
    User.findOne({ fbid: senderID }).exec((err, user) => {
        if (!err && user) {
            if (user.lastAction == "done") {
                User.findOneAndUpdate(
                    { fbid: senderID },
                    { $set: { "lastAction": "end" } },
                    { upsert: false },
                    (err, user) => {
                        //getstarted(senderID, user);
                    });
            }
        }
    });
}

function getData(senderID) {
    rp({
        uri: 'https://graph.facebook.com/v4.0/' + senderID,
        qs: {
            access_token: access_token,
            fields: 'first_name,last_name'
        },
        method: 'GET'
    })
        .then(response => {
            let data = JSON.parse(response);
            User.findOneAndUpdate(
                { fbid: senderID },
                { $set: { "first_name": data.first_name, "last_name": data.last_name } },
                { upsert: false },
                (err, user) => {
                    user.first_name = data.first_name;
                    getstarted(senderID, user);
                });
        })
        .catch(error => {

        });
}
function getData1(senderID) {
    rp({
        uri: 'https://graph.facebook.com/v4.0/' + senderID,
        qs: {
            access_token: access_token,
            fields: 'first_name,last_name'
        },
        method: 'GET'
    })
        .then(response => {
            let data = JSON.parse(response);
            User.findOneAndUpdate(
                { fbid: senderID },
                { $set: { "first_name": data.first_name, "last_name": data.last_name } },
                { upsert: false },
                (err, user) => {
                });
        })
        .catch(error => {

        });
}

function quickReplyRequest(senderID, eventAction) {
    if (eventAction == "pic_count_2") {

    }
    else {
        defaultMessage(senderID);
    }
}

function textMessageRequest(senderID, text, user) {
    if (text == "get started") {
        getstarted(senderID, user);
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "getstarted_clicks": 1 } },
            { upsert: false },
            function (err, user) {
            });
    }
    else if (text == "restart") {
        getstarted(senderID, user);
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "restart_clicks": 1 } },
            { upsert: false },
            function (err, user) {
            });
    }
    else {
        defaultMessage(senderID);
    }
}

function attachmentsRequest(senderID, attachments, user) {
    defaultMessage(senderID);
}

function postbackRequest(senderID, eventAction, user) {
    if (eventAction == "getStarted") {
        getstarted(senderID, user);
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "getstarted_clicks": 1 } },
            { upsert: false },
            function (err, user) {
            });
    }

    else if (eventAction == "restart") {
        getstarted(senderID, user);
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "restart_clicks": 1 } },
            { upsert: false },
            function (err, user) {
            });
    }
}
module.exports=app