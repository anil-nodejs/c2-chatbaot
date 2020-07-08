
const express=require('express');
const mongoose=require('mongoose')
var router=express.Router();
// mongoose.Promise = global.Promise;

mongoose.connect("mongodb://aa_chatbot2020:7n!mT5e5dceAs_5@ds041432.mlab.com:41432/heroku_kx5wjtrh", {useNewUrlParser: true, useCreateIndex: true,useUnifiedTopology:true}, (ignore, connection) => {
    connection.onOpen();
console.log("mongo is connected");

});
//main route
router.get('/',(req,res)=>
{
res.send("Working");
});

// 

module.exports=router;