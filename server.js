const express=require('express');
const app=express();
const port =9000;

const chatRoute=require('./routes/chatroute');
app.use('/',chatRoute);

app.listen(process.env.PORT || port,()=>
{
    console.log("chatbot server is runnig... at",port);
})

module.exports=app;