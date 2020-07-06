
const express=require('express');
const mongoose=require('mongoose')
var router=express.Router();
// mongoose.Promise = global.Promise;

mongoose.connect("mongodb+srv://sbycc2020:' + encodeURIComponent('sbycc@anilyadav21') + '@mongodb01-z7hcd.mongodb.net/chatbot2020?retryWrites=true", {useNewUrlParser: true,useUnifiedTopology:true}, (ignore, connection) => {
    const db = mongoose.connection; 
console.log("mongo is connected"+db);
   
});
//main route
router.get('/',(req,res)=>
{
res.send("Working");
});

// 

module.exports=router;