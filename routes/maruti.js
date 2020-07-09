const bodyParser = require('body-parser'),
    express = require('express'),
    request = require('request'),
    rp = require('request-promise');

const URL = 'https://c2-chatbot.herokuapp.com/maruti/open/';
var imageURL = 'https://c2-chatbot.herokuapp.com/images'
const app = express.Router();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const access_token = "EAApXxrxbGs0BAH8iGRovQZADBVjlkW9ZBWzVTyWrdXNspxwKmV7qE1hNMuOgw5yDkBrO7G0ZAZBkaeZAXLE9pxqcSt1dI2KiacXJ2ZAEpvqDNcITPS9aNGWmz4noyHl9uyQUJZA6QZArRfveGdSi27G0IPbXxZBv5PFHjZC3k7KZA7Xzp9cZA6CxkCPm";
const User = require('../models/User');

//To add Get Started buttongrtgvtrgv
app.get('/getStarted', (req, res) => {
    res.status(200).send("getStarted");
    rp({
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

//To add persistent menu
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

app.get('/bot', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === "alivenow_chatbot") {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

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
                                textMessageRequest(senderID, event.message.text.toLowerCase());
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
                                    // defaultMessage(senderID);
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

function textMessageRequest(senderID, text) {
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
        ggetstarted(senderID, user);
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
    else if (eventAction == "level_1") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_to_home": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "");
            });
    }
    else if (eventAction == "whats_happening") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "whats_happening": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "whats_happening");
            });
    }
    else if (eventAction == "back_whats_happening") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_whats_happening": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "whats_happening");
            });
    }
    else if (eventAction == "all_maruti_suzuki_cars") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "all_maruti_suzuki_cars": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "all_maruti_cars");
            });
    }
    else if (eventAction == "enquiries") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "enquiries": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "enquiries");
            });
    }
    else if (eventAction == "back_enquiries") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_enquiries": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "enquiries");
            });
    }
    else if (eventAction == "know_more_about_us") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "know_more_about_us": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "know_more_about_us");
            });
    }
    else if (eventAction == "back_know_more_about_us") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_know_more_about_us": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "know_more_about_us");
            });
    }
    else if (eventAction == "Mission_Green_Million") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Mission_Green_Million": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Mission_Green_Million");
            });
    }
    else if (eventAction == "Venue_of_Auto_Expo") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Venue_of_Auto_Expo": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Venue_of_Auto_Expo");
            });
    }
    else if (eventAction == "Dates_Timings") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Dates_Timings": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Dates_Timings");
            });
    }
    else if (eventAction == "Book_My_Tickets") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Book_My_Tickets": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Book_My_Tickets");
            });
    }
    else if (eventAction == "New_Launches") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "New_Launches": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "New_Launches");
            });
    }
    else if (eventAction == "back_New_Launches") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_New_Launches": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "New_Launches");
            });
    }
    else if (eventAction == "Ignis") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Ignis": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Ignis");
                setTimeout(() => {
                    sendItems(senderID, "Ignis_btn");
                }, 500);
            });
    }
    else if (eventAction == "Brezza") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Brezza": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Brezza");
                setTimeout(() => {
                    sendItems(senderID, "Brezza_btn");
                }, 500);
            });
    }
    else if (eventAction == "Cars_at_Display") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Cars_at_Display": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Cars_at_Display");
            });
    }
    else if (eventAction == "back_Cars_at_Display") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_Cars_at_Display": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Cars_at_Display");
            });
    }
    else if (eventAction == "Swift_Hybrid") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Swift_Hybrid": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Swift_Hybrid");
                setTimeout(() => {
                    sendItems(senderID, "Swift_Hybrid_btn");
                }, 500);
            });
    }
    else if (eventAction == "Jimny") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Jimny": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Jimny");
                setTimeout(() => {
                    sendItems(senderID, "Jimny_btn");
                }, 500);
            });
    }
    else if (eventAction == "Concept_FUTURO_e") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Concept_FUTURO_e": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Concept_FUTURO_e");
                setTimeout(() => {
                    sendItems(senderID, "Concept_FUTURO_e_btn");
                }, 500);
            });
    }
    else if (eventAction == "Maruti_Suzuki_Studio") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_Studio": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_Studio");
            });
    }
    else if (eventAction == "back_Maruti_Suzuki_Studio") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_Maruti_Suzuki_Studio": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_Studio");
            });
    }
    else if (eventAction == "About_Maruti_Suzuki_Studio") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "About_Maruti_Suzuki_Studio": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "About_Maruti_Suzuki_Studio");
            });
    }
    else if (eventAction == "Studio_Spotlight") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Studio_Spotlight": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Studio_Spotlight");
            });
    }
    else if (eventAction == "Twitter_Green_Room") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Twitter_Green_Room": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Twitter_Green_Room");
            });
    }
    else if (eventAction == "Studio_Schedule") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Studio_Schedule": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Studio_Schedule");
            });
    }
    else if (eventAction == "Arena") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Arena": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Arena");
            });
    }
    else if (eventAction == "back_Arena_all_maruti_cars") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_Arena_all_maruti_cars": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "all_maruti_cars");
            });
    }
    else if (eventAction == "back_Arena") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_Arena": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Arena");
            });
    }
    else if (eventAction == "Ertiga") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Ertiga": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Ertiga");
                setTimeout(() => {
                    sendItems(senderID, "Ertiga_btn");
                }, 500);
            });
    }
    else if (eventAction == "S_presso") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "S_presso": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "S_presso");
                setTimeout(() => {
                    sendItems(senderID, "S_presso_btn");
                }, 500);
            });
    }
    else if (eventAction == "WagonR") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "WagonR": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "WagonR");
                setTimeout(() => {
                    sendItems(senderID, "WagonR_btn");
                }, 500);
            });
    }
    else if (eventAction == "Celerio_X") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Celerio_X": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Celerio_X");
                setTimeout(() => {
                    sendItems(senderID, "Celerio_X_btn");
                }, 500);
            });
    }
    else if (eventAction == "Vitara_Brezza") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Vitara_Brezza": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Vitara_Brezza");
                setTimeout(() => {
                    sendItems(senderID, "Vitara_Brezza_btn");
                }, 500);
            });
    }
    else if (eventAction == "EECO") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "EECO": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "EECO");
                setTimeout(() => {
                    sendItems(senderID, "EECO_btn");
                }, 500);
            });
    }
    else if (eventAction == "Celerio") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Celerio": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Celerio");
                setTimeout(() => {
                    sendItems(senderID, "Celerio_btn");
                }, 500);
            });
    }
    else if (eventAction == "Alto") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Alto": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Alto");
                setTimeout(() => {
                    sendItems(senderID, "Alto_btn");
                }, 500);
            });
    }
    else if (eventAction == "Swift") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Swift": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Swift");
                setTimeout(() => {
                    sendItems(senderID, "Swift_btn");
                }, 500);
            });
    }
    else if (eventAction == "DZire") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "DZire": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "DZire");
                setTimeout(() => {
                    sendItems(senderID, "DZire_btn");
                }, 500);
            });
    }
    else if (eventAction == "Nexa") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Nexa": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Nexa");
            });
    }
    else if (eventAction == "back_Nexa_all_maruti_cars") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_Nexa_all_maruti_cars": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "all_maruti_cars");
            });
    }
    else if (eventAction == "back_Nexa") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_Nexa": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Nexa");
            });
    }
    else if (eventAction == "Ignis_Nexa") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Ignis_Nexa": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Ignis_Nexa");
                setTimeout(() => {
                    sendItems(senderID, "Ignis_Nexa_btn");
                }, 500);
            });
    }
    else if (eventAction == "XL6_Nexa") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "XL6_Nexa": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "XL6_Nexa");
                setTimeout(() => {
                    sendItems(senderID, "XL6_Nexa_btn");
                }, 500);
            });
    }
    else if (eventAction == "S_Cross_Nexa") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "S_Cross_Nexa": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "S_Cross_Nexa");
                setTimeout(() => {
                    sendItems(senderID, "S_Cross_Nexa_btn");
                }, 500);
            });
    }
    else if (eventAction == "Baleno_Nexa") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Baleno_Nexa": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Baleno_Nexa");
                setTimeout(() => {
                    sendItems(senderID, "Baleno_Nexa_btn");
                }, 500);
            });
    }
    else if (eventAction == "Ciaz_Nexa") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Ciaz_Nexa": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Ciaz_Nexa");
                setTimeout(() => {
                    sendItems(senderID, "Ciaz_Nexa_btn");
                }, 500);
            });
    }
    else if (eventAction == "Help_Centre") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Help_Centre": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Help_Centre");
            });
    }
    else if (eventAction == "back_Help_Centre") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_Help_Centre": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Help_Centre");
            });
    }
    else if (eventAction == "Maruti_Suzuki_Arena") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_Arena": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_Arena");
                setTimeout(() => {
                    sendItems(senderID, "Maruti_Suzuki_Arena_btn");
                }, 500);
            });
    }
    else if (eventAction == "Maruti_Suzuki_Nexa") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_Nexa": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_Nexa");
                setTimeout(() => {
                    sendItems(senderID, "Maruti_Suzuki_Nexa_btn");
                }, 500);
            });
    }
    else if (eventAction == "Maruti_Suzuki_True_Value") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_True_Value": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_True_Value");
                setTimeout(() => {
                    sendItems(senderID, "Maruti_Suzuki_True_Value_btn");
                }, 500);
            });
    }
    else if (eventAction == "Maruti_Suzuki_Commercial") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_Commercial": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_Commercial");
                setTimeout(() => {
                    sendItems(senderID, "Maruti_Suzuki_Commercial_btn");
                }, 500);
            });
    }
    else if (eventAction == "Outlet_Locator") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Outlet_Locator": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Outlet_Locator");
            });
    }
    else if (eventAction == "back_Outlet_Locator") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "back_Outlet_Locator": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Outlet_Locator");
            });
    }
    else if (eventAction == "Maruti_Suzuki_Arena_loc") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_Arena_loc": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_Arena_loc");
                setTimeout(() => {
                    sendItems(senderID, "Maruti_Suzuki_Arena_loc_btn");
                }, 500);
            });
    }
    else if (eventAction == "Maruti_Suzuki_Nexa_loc") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_Nexa_loc": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_Nexa_loc");
                setTimeout(() => {
                    sendItems(senderID, "Maruti_Suzuki_Nexa_loc_btn");
                }, 500);
            });
    }
    else if (eventAction == "Maruti_Suzuki_True_Value_loc") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_True_Value_loc": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_True_Value_loc");
                setTimeout(() => {
                    sendItems(senderID, "Maruti_Suzuki_True_Value_loc_btn");
                }, 500);
            });
    }
    else if (eventAction == "Maruti_Suzuki_Commercial_loc") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_Commercial_loc": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_Commercial_loc");
                setTimeout(() => {
                    sendItems(senderID, "Maruti_Suzuki_Commercial_loc_btn");
                }, 500);
            });
    }
    else if (eventAction == "About_Maruti_Suzuki") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "About_Maruti_Suzuki": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "About_Maruti_Suzuki");
                setTimeout(() => {
                    sendItems(senderID, "About_Maruti_Suzuki_btn");
                }, 500);
            });
    }
    else if (eventAction == "Maruti_Suzuki_Arena_about") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_Arena_about": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_Arena_about");
                setTimeout(() => {
                    sendItems(senderID, "Maruti_Suzuki_Arena_about_btn");
                }, 500);
            });
    }
    else if (eventAction == "Maruti_Suzuki_Nexa_about") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_Nexa_about": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_Nexa_about");
                setTimeout(() => {
                    sendItems(senderID, "Maruti_Suzuki_Nexa_about_btn");
                }, 500);
            });
    }
    else if (eventAction == "Maruti_Suzuki_True_Value_about") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_True_Value_about": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_True_Value_about");
                setTimeout(() => {
                    sendItems(senderID, "Maruti_Suzuki_True_Value_about_btn");
                }, 500);
            });
    }
    else if (eventAction == "Maruti_Suzuki_Commercial_about") {
        User.findOneAndUpdate(
            { fbid: senderID },
            { $inc: { "Maruti_Suzuki_Commercial_about": 1 } },
            { upsert: false },
            (err, user) => {
                sendItems(senderID, "Maruti_Suzuki_Commercial_about");
                setTimeout(() => {
                    sendItems(senderID, "Maruti_Suzuki_Commercial_about_btn");
                }, 500);
            });
    }
    // else {
    //     defaultMessage(senderID);
    // }
}

function defaultMessage(senderID) {
    sendItems(senderID, "level_1Obj");
}

function sendTextMessage(recipientId, messageText) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };
    callSendAPI(messageData);
}

function sendGenericMessage(recipientId, messageObj) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: messageObj
    };
    callSendAPI(messageData);
}

function callSendAPI(messageData) {
    rp({
        uri: 'https://graph.facebook.com/v4.0/me/messages',
        qs: {
            access_token: access_token
        },
        method: 'POST',
        json: messageData
    })
        .then(response => {
            console.log("XXXXXXXXXXXXXXXXXXX response XXXXXXXXXXXXXXX");
            console.log(response);
            console.log("XXXXXXXXXXXXXXXXXXX response XXXXXXXXXXXXXXX");
        })
        .catch(error => {
            console.log("XXXXXXXXXXXXXXXXXXX error XXXXXXXXXXXXXXX");
            console.log(error);
            console.log("XXXXXXXXXXXXXXXXXXX error XXXXXXXXXXXXXXX");
        });
}

function sendItems(senderID, Obj) {
    let data = {};

    /* Level 1 */
    data.level_1Obj = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "What's happening at Auto Expo 2020",
                        "image_url": imageURL + "/1.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "whats_happening"
                            }
                        ]
                    },
                    //Eralier All Maruti Suzuki Cars
                    {
                        "title": "Browse Car Models",
                        "image_url": imageURL + "/9.jpg?v=1",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "all_maruti_suzuki_cars"
                            }
                        ]
                    },

                    {
                        "title": "Enquiries & Other Details",
                        "image_url": imageURL + "/10.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "enquiries"
                            }
                        ]
                    },

                    {
                        "title": "Know more About Us",
                        "image_url": imageURL + "/11.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "know_more_about_us"
                            }
                        ],

                    }
                ]
            }
        }
    };

    /* Level 2 */
    data.whats_happening = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Mission Green Million",
                        "image_url": imageURL + "/2.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Mission_Green_Million"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ]
                    },

                    {
                        "title": "Venue of Auto Expo",
                        "image_url": imageURL + "/3.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Venue_of_Auto_Expo"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ]
                    },

                    {
                        "title": "Dates & Timings",
                        "image_url": imageURL + "/4.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Dates_Timings"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ]
                    },

                    {
                        "title": "Book My Tickets",
                        "image_url": imageURL + "/5.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Book_My_Tickets"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ],

                    },

                    {
                        "title": "New Launches",
                        "image_url": imageURL + "/6.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "New_Launches"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ],

                    },
                    //Earlier Cars at Display
                    {
                        "title": "Exclusive Array",
                        "image_url": imageURL + "/7.jpg?v=1",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Cars_at_Display"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ],

                    },

                    {
                        "title": "Maruti Suzuki Studio",
                        "image_url": imageURL + "/8.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_Studio"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ],

                    }
                ]
            }
        }
    };

    /* Browse car models */
    data.all_maruti_cars = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    /* "title": "Arena", */
                    {
                        "title": "Maruti Suzuki Arena",
                        "image_url": imageURL + "/18.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Arena"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ]
                    },

                    {
                        "title": "Nexa",
                        "image_url": imageURL + "/19.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Nexa"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ]
                    }
                ]
            }
        }
    };

    data.enquiries = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Help Centre",
                        "image_url": imageURL + "/12.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Help_Centre"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ]
                    },

                    {
                        "title": "Outlet Locator",
                        "image_url": imageURL + "/13.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Outlet_Locator"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ]
                    }
                ]
            }
        }
    };

    data.know_more_about_us = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "About Maruti Suzuki India Limited",
                        "image_url": imageURL + "/about_maruti.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "About_Maruti_Suzuki"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ]
                    },
                    {
                        "title": "Maruti Suzuki Arena",
                        "image_url": imageURL + "/Arena.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_Arena_about"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ]
                    },
                    //"title": "Maruti Suzuki Nexa"
                    {
                        "title": "Nexa",
                        "image_url": imageURL + "/Img.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_Nexa_about"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ]
                    },
                    {
                        "title": "Maruti Suzuki True Value",
                        "image_url": imageURL + "/TV---Showroom.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_True_Value_about"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ]
                    },
                    {
                        "title": "Maruti Suzuki Commercial",
                        "image_url": imageURL + "/Commercial.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_Commercial_about"
                            },
                            {
                                "type": "postback",
                                "title": "Home",
                                "payload": "level_1"
                            }
                        ]
                    }
                ]
            }
        }
    };

    /**********   Whats Happening     **********/


    data.Mission_Green_Million = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Maruti Suzuki has initiated ‘Mission Green Million’, in line with its commitment of introducing newer & greener technologies for the customers. An ode to our commitment to a cleaner future for India, Maruti Suzuki aims to sell one million green vehicles in the next couple of years. Know More about our Initiative.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Mission_Green_Million_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_whats_happening"
                    }
                ]
            }
        }
    };

    data.Venue_of_Auto_Expo = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "India Expo Mart is located in Greater Noida, near the JP Golf Course and within easy reach of central Delhi and the international airport on the new 8-lane Greater Noida Expressway. It is also easily accessible via metro, personal and public transport. You can find the way to Auto Expo here.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Venue_of_Auto_Expo_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_whats_happening"
                    }
                ]
            }
        }
    };

    data.Dates_Timings = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Auto Expo 2020 begins on February 7, 2020 and will go on till February 12, 2020. Plan your visit by checking out the complete schedule.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Dates_Timings_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_whats_happening"
                    }
                ]
            }
        }
    };

    data.Book_My_Tickets = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "The  Auto Expo 2020 is a ticketed event. You may book the tickets in just a few clicks at BookMyShow.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Book Now",
                        "url": URL + senderID + "/Book_My_Tickets_lnk/",
                        "webview_height_ratio": "full"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_whats_happening"
                    }
                ]
            }
        }
    };

    data.New_Launches = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    // "title": "Ignis",
                    {
                        "title": "All-new Ignis",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Ignis.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Ignis"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_whats_happening"
                            }
                        ]
                    },

                    //"title": "Brezza",
                    {
                        "title": "All-new Vitara Brezza",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Vitara-Brezza.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Brezza"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_whats_happening"
                            }
                        ]
                    }
                ]
            }
        }
    };

    data.Ignis = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "771112573374479"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Ignis.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Brezza = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "198071828035868"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Vitara-Brezza.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Ignis_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Here's a sneak peek into the All New Ignis.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Ignis_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_New_Launches"
                    }
                ]
            }
        }
    };

    data.Brezza_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Here's a sneak peek into the All New Vitara Brezza with 1.5L Petrol Engine.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Brezza_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_New_Launches"
                    }
                ]
            }
        }
    };

    //Exclusive Array
    data.Cars_at_Display = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Swift Hybrid",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Swift.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Swift_Hybrid"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_whats_happening"
                            }
                        ]
                    },

                    {
                        "title": "Jimny",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Jimny.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Jimny"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_whats_happening"
                            }
                        ]
                    },

                    {
                        "title": "Concept FUTURO-e",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/ConceptFUTURO-e.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Concept_FUTURO_e"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_whats_happening"
                            }
                        ]
                    }
                ]
            }
        }
    };

    data.Swift_Hybrid = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "560201674561582"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Swift.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Swift_Hybrid_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "High on efficiency and low on emissions, with capability of pure electric drive, this strong Swift Hybrid offers superior driving performance and acceleration. Check out the innovative technology of Swift Hybrid.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Swift_Hybrid_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Cars_at_Display"
                    }
                ]
            }
        }
    };

    data.Jimny = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "2444142865840086"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Jimny.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Jimny_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "There are places in the world only the Jimny can go.\nOvercome muddy pits, manoeuvre through dense woods and conquer massive rocks with this small off- roader that knows what true toughness is.Check out the exciting Jimny.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Jimny_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Cars_at_Display"
                    }
                ]
            }
        }
    };

    data.Concept_FUTURO_e = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "822191921564206"
                /* "url": "https://maruti-auto-expo.herokuapp.com/ConceptFUTURO-e.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Concept_FUTURO_e_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Conceptualized and designed in India for the aspirational youth who seek bold expressions, #ConceptFUTURO-e is a design study for next generation mobility solutions.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Concept_FUTURO_e_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Cars_at_Display"
                    }
                ]
            }
        }
    };

    data.Maruti_Suzuki_Studio = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "About Maruti Suzuki Studio",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/14.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "About_Maruti_Suzuki_Studio"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_whats_happening"
                            }
                        ]
                    },

                    {
                        "title": "Studio Spotlight",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/15.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Studio_Spotlight"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_whats_happening"
                            }
                        ]
                    },
                    //"title": "Twitter Green Room",
                    {
                        "title": "Twitter Green Zone",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/16.jpg?v=1",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Twitter_Green_Room"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_whats_happening"
                            }
                        ]
                    },

                    {
                        "title": "Studio Schedule",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/17.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Studio_Schedule"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_whats_happening"
                            }
                        ]
                    }
                ]
            }
        }
    };

    data.About_Maruti_Suzuki_Studio = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Our Studio is the nerve centre at the Auto Expo 2020 which brings together one-of a-kind live broadcasting, brewed with conversations on the future of auto-industry. Know all about the action straight from the studio.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/About_Maruti_Suzuki_Studio_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Maruti_Suzuki_Studio"
                    }
                ]
            }
        }
    };

    data.Studio_Spotlight = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "This year at the Auto Expo, we bring together Key Opinion Leaders from different walks of life. People who resonate with Arena attributes of being young & dynamic along with the NEXA philosophy to create & inspire. Know more.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Studio_Spotlight_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Maruti_Suzuki_Studio"
                    }
                ]
            }
        }
    };

    data.Twitter_Green_Room = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Maruti Suzuki  in partnership with Twitter, will have an exclusive 'Green Zone'  at Auto Expo. It's a  special spot to host interviews of Auto Journalists and a lot more! See all the buzz here.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Twitter_Green_Room_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Maruti_Suzuki_Studio"
                    }
                ]
            }
        }
    };

    data.Studio_Schedule = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Want to know what's happening at Maruti Suzuki Pavillion? Visit here to plan your Expo days with us",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Studio_Schedule_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Maruti_Suzuki_Studio"
                    }
                ]
            }
        }
    };
    /***************   End Whats Happening *****************/

    /***************   All Maruti Cars *********************/
    data.Arena = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Ertiga",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Ertiga.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Ertiga"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Arena_all_maruti_cars"
                            }
                        ]
                    },

                    {
                        "title": "S-presso",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/S-Presso.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "S_presso"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Arena_all_maruti_cars"
                            }
                        ]
                    },

                    {
                        "title": "WagonR",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/WagonR.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "WagonR"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Arena_all_maruti_cars"
                            }
                        ]
                    },

                    {
                        "title": "Celerio X",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Celerio-X.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Celerio_X"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Arena_all_maruti_cars"
                            }
                        ]
                    },
                    /* "title": "Vitara Brezza", */
                    {
                        "title": "All-new Vitara Brezza",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Vitara-Brezza.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Vitara_Brezza"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Arena_all_maruti_cars"
                            }
                        ]
                    },

                    {
                        "title": "EECO",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/EECO.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "EECO"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Arena_all_maruti_cars"
                            }
                        ]
                    },

                    {
                        "title": "Celerio",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Celerio.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Celerio"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Arena_all_maruti_cars"
                            }
                        ]
                    },

                    {
                        "title": "Alto",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Alto.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Alto"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Arena_all_maruti_cars"
                            }
                        ]
                    },

                    {
                        "title": "Swift",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Swift.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Swift"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Arena_all_maruti_cars"
                            }
                        ]
                    },

                    {
                        "title": "DZire",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Dzire.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "DZire"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Arena_all_maruti_cars"
                            }
                        ]
                    }
                ]
            }
        }
    };

    data.Ertiga = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "496551551046075"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Ertiga.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Ertiga_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Designed for Style Driven by Togetherness.Know more about Maruti Suzuki Ertiga.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Ertiga_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Arena"
                    }
                ]
            }
        }
    };

    data.S_presso = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "1267771530084186"
                /* "url": "https://maruti-auto-expo.herokuapp.com/S-Presso.jpg",
                "is_reusable": true */
            }
        }
    };

    data.S_presso_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Live It Up. Know more about Maruti Suzuki S-presso.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/S_presso_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Arena"
                    }
                ]
            }
        }
    };

    data.WagonR = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "196602285074965"
                /* "url": "https://maruti-auto-expo.herokuapp.com/WagonR.jpg",
                "is_reusable": true */
            }
        }
    };

    data.WagonR_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Strong on Looks. Strong on Character. Know more about Maruti Suzuki WagonR.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/WagonR_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Arena"
                    }
                ]
            }
        }
    };

    data.Celerio_X = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "170976660782314"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Celerio-X.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Celerio_X_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "There is an X in All of Us. Know more about Maruti Suzuki Celerio X.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Celerio_X_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Arena"
                    }
                ]
            }
        }
    };

    data.Vitara_Brezza = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "1423880804457592"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Vitara-Brezza.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Vitara_Brezza_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "All New Vitara Brezza with 1.5L Petrol Engine. Know more.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Vitara_Brezza_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Arena"
                    }
                ]
            }
        }
    };

    data.EECO = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "749554295538842"
                /* "url": "https://maruti-auto-expo.herokuapp.com/EECO.jpg",
                "is_reusable": true */
            }
        }
    };

    data.EECO_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Happiness Family Size. Know more about Maruti Suzuki EECO.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/EECO_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Arena"
                    }
                ]
            }
        }
    };

    data.Celerio = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "174486020426217"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Celerio.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Celerio_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Easy to Drive. Easy to Love. Know more about Maruti Suzuki Celerio.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Celerio_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Arena"
                    }
                ]
            }
        }
    };

    data.Alto = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "481770149428058"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Alto.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Alto_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Chalte Rahien Shaan Se. Know more about Maruti Suzuki Alto.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Alto_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Arena"
                    }
                ]
            }
        }
    };

    data.Swift = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "528906851060839"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Swift.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Swift_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Excitement, Like Never Before. Know more about Maruti Suzuki Swift.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Swift_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Arena"
                    }
                ]
            }
        }
    };

    data.DZire = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "584943535397055"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Dzire.jpg",
                "is_reusable": true */
            }
        }
    };

    data.DZire_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "A whole new world AWAITS. Know more about Maruti Suzuki DZire.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/DZire_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Arena"
                    }
                ]
            }
        }
    };

    data.Nexa = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    /* "title": "Ignis", */
                    {
                        "title": "All-new Ignis",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Ignis.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Ignis_Nexa"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Nexa_all_maruti_cars"
                            }
                        ]
                    },

                    {
                        "title": "XL6",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/XL6.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "XL6_Nexa"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Nexa_all_maruti_cars"
                            }
                        ]
                    },

                    {
                        "title": "S-Cross",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/S-Cross.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "S_Cross_Nexa"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Nexa_all_maruti_cars"
                            }
                        ]
                    },

                    {
                        "title": "Baleno",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/baleno.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Baleno_Nexa"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Nexa_all_maruti_cars"
                            }
                        ]
                    },

                    {
                        "title": "Ciaz",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Ciaz.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Ciaz_Nexa"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_Nexa_all_maruti_cars"
                            }
                        ]
                    }

                ]
            }
        }
    };

    data.Ignis_Nexa = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "771112573374479"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Ignis.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Ignis_Nexa_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Created to Inspire Urban Drive. Know more about Maruti Suzuki Ignis.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Ignis_Nexa_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Nexa"
                    }
                ]
            }
        }
    };

    data.XL6_Nexa = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "473658103328849"
                /* "url": "https://maruti-auto-expo.herokuapp.com/XL6.jpg",
                "is_reusable": true */
            }
        }
    };

    data.XL6_Nexa_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Created to Inspire Style and Comfort. Know more about Maruti Suzuki XL6.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/XL6_Nexa_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Nexa"
                    }
                ]
            }
        }
    };

    data.S_Cross_Nexa = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "2439391982994209"
                /*  "url": "https://maruti-auto-expo.herokuapp.com/S-Cross.jpg",
                 "is_reusable": true */
            }
        }
    };

    data.S_Cross_Nexa_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Created to Inspire Adventure. Know more about Maruti Suzuki S-Cross.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/S_Cross_Nexa_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Nexa"
                    }
                ]
            }
        }
    };

    data.Baleno_Nexa = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "119357835962819"
                /* "url": "https://maruti-auto-expo.herokuapp.com/baleno.jpg",
                 "is_reusable": true */
            }
        }
    };

    data.Baleno_Nexa_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Created to Inspire The Bold.Know more about Maruti Suzuki Baleno.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Baleno_Nexa_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Nexa"
                    }
                ]
            }
        }
    };

    data.Ciaz_Nexa = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "107737880643913"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Ciaz.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Ciaz_Nexa_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Created to Inspire Elegance. Know more about Maruti Suzuki Ciaz.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Ciaz_Nexa_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Nexa"
                    }
                ]
            }
        }
    };

    /************** End All Maruti Cars ***************/

    /************** Help Centre ***************/

    data.Help_Centre = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Maruti Suzuki Arena",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Arena.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_Arena"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_enquiries"
                            }
                        ]
                    },
                    //"title": "Maruti Suzuki Nexa",
                    {
                        "title": "Nexa",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Img.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_Nexa"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_enquiries"
                            }
                        ]
                    },
                    {
                        "title": "Maruti Suzuki True Value",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/TV---Showroom.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_True_Value"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_enquiries"
                            }
                        ]
                    },
                    {
                        "title": "Maruti Suzuki Commercial",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Commercial.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_Commercial"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_enquiries"
                            }
                        ]
                    }

                ]
            }
        }
    };

    data.Maruti_Suzuki_Arena = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "550623935798754"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Arena.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Maruti_Suzuki_Arena_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Need our help with service request or have a query? For any kind of request, get in touch with us. Call 1800 102 1800, or visit our website.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Maruti_Suzuki_Arena_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Help_Centre"
                    }
                ]
            }
        }
    };

    data.Maruti_Suzuki_Nexa = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "1276652252528515"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Img.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Maruti_Suzuki_Nexa_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Need our help with service request or have a query? For any kind of request, get in touch with us. Call 1800-102-6392, or visit our website.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Maruti_Suzuki_Nexa_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Help_Centre"
                    }
                ]
            }
        }
    };

    data.Maruti_Suzuki_True_Value = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "168297671085860"
                /* "url": "https://maruti-auto-expo.herokuapp.com/TV---Showroom.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Maruti_Suzuki_True_Value_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Need our help with service request or have a query? For any kind of request, get in touch with us. Call 1800 102 1800, or visit our website.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Maruti_Suzuki_True_Value_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Help_Centre"
                    }
                ]
            }
        }
    };

    data.Maruti_Suzuki_Commercial = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "145279596916794"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Commercial.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Maruti_Suzuki_Commercial_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Need our help with service request or have a query? For any kind of request, get in touch with us. Call 1800 102 1800, or visit our website.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Maruti_Suzuki_Commercial_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Help_Centre"
                    }
                ]
            }
        }
    };
    /********************* End Help Centre ******************/

    /********************* Outlet Locator ******************/
    data.Outlet_Locator = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Maruti Suzuki Arena",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Arena.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_Arena_loc"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_enquiries"
                            }
                        ]
                    },
                    //"title": "Maruti Suzuki Nexa"
                    {
                        "title": "Nexa",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Img.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_Nexa_loc"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_enquiries"
                            }
                        ]
                    },
                    {
                        "title": "Maruti Suzuki True Value",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/TV---Showroom.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_True_Value_loc"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_enquiries"
                            }
                        ]
                    },
                    {
                        "title": "Maruti Suzuki Commercial",
                        "image_url": "https://maruti-auto-expo.herokuapp.com/Commercial.jpg",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Explore",
                                "payload": "Maruti_Suzuki_Commercial_loc"
                            },
                            {
                                "type": "postback",
                                "title": "Go Back",
                                "payload": "back_enquiries"
                            }
                        ]
                    }
                ]
            }
        }
    };

    data.Maruti_Suzuki_Arena_loc = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "550623935798754"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Arena.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Maruti_Suzuki_Arena_loc_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "To locate your nearest Outlet, visit our website.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Maruti_Suzuki_Arena_loc_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Outlet_Locator"
                    }
                ]
            }
        }
    };

    data.Maruti_Suzuki_Nexa_loc = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "1276652252528515"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Img.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Maruti_Suzuki_Nexa_loc_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "To locate your nearest Outlet, visit our website.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Maruti_Suzuki_Nexa_loc_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Outlet_Locator"
                    }
                ]
            }
        }
    };

    data.Maruti_Suzuki_True_Value_loc = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "168297671085860"
                /* "url": "https://maruti-auto-expo.herokuapp.com/TV---Showroom.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Maruti_Suzuki_True_Value_loc_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "To locate your nearest Outlet, visit our website.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Maruti_Suzuki_True_Value_loc_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Outlet_Locator"
                    }
                ]
            }
        }
    };

    data.Maruti_Suzuki_Commercial_loc = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "145279596916794"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Commercial.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Maruti_Suzuki_Commercial_loc_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "To locate your nearest Outlet, visit our website.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Maruti_Suzuki_Commercial_loc_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_Outlet_Locator"
                    }
                ]
            }
        }
    };
    /********************* End Outlet Locator ******************/

    /********************* About Us  ******************/
    data.About_Maruti_Suzuki = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "2267491580216652"
                /* "url": "https://maruti-auto-expo.herokuapp.com/about_maruti.jpg",
                "is_reusable": true */
            }
        }
    };

    data.About_Maruti_Suzuki_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "India’s tryst with personal four-wheelers began in 1983, and it was the Maruti 800 which started it all. Today, Maruti Suzuki has its eyes set firmly on the possibilities of tomorrow. Experience the Maruti Suzuki World here.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/About_Maruti_Suzuki_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_know_more_about_us"
                    }
                ]
            }
        }
    };

    data.Maruti_Suzuki_Arena_about = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "550623935798754"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Arena.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Maruti_Suzuki_Arena_about_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "New-age designs, advanced technologies and thoughtfully designed experiences. Know more about the feeling called Maruti Suzuki Arena.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Maruti_Suzuki_Arena_about_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_know_more_about_us"
                    }
                ]
            }
        }
    };

    data.Maruti_Suzuki_Nexa_about = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "1276652252528515"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Img.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Maruti_Suzuki_Nexa_about_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Innovation at NEXA goes beyond automotive excellence. Dive into the Nexa World.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Maruti_Suzuki_Nexa_about_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_know_more_about_us"
                    }
                ]
            }
        }
    };

    data.Maruti_Suzuki_True_Value_about = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "168297671085860"
                /* "url": "https://maruti-auto-expo.herokuapp.com/TV---Showroom.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Maruti_Suzuki_True_Value_about_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Your one-stop destination for quality pre-owned cars. Begin your journey of trust with us.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Maruti_Suzuki_True_Value_about_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_know_more_about_us"
                    }
                ]
            }
        }
    };

    data.Maruti_Suzuki_Commercial_about = {
        "attachment": {
            "type": "image",
            "payload": {
                "attachment_id": "145279596916794"
                /* "url": "https://maruti-auto-expo.herokuapp.com/Commercial.jpg",
                "is_reusable": true */
            }
        }
    };

    data.Maruti_Suzuki_Commercial_about_btn = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "With reputable experience and a leadership stance in the taxi and van commercial segment, we are now all set to take care of all your load carrying capacity. Know all about Maruti Suzuki Commercial.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Know more",
                        "url": URL + senderID + "/Maruti_Suzuki_Commercial_about_btn_lnk/",
                        "webview_height_ratio": "tall"
                    },
                    {
                        "type": "postback",
                        "title": "Go Back",
                        "payload": "back_know_more_about_us"
                    }
                ]
            }
        }
    };
    /********************* End About Us  ******************/
    sendGenericMessage(senderID, data[Obj]);
}

module.exports = app;