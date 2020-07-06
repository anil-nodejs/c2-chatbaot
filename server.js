const express=require('express');
const bodyParser=require('body-parser');
const path=require('path');
const app=express();
const port =9000;


//route set path
const chatRoute=require('./routes/chatroute');
app.use('/',chatRoute);

const marutiRoute=require('./routes/maruti');
app.use('/maruti',marutiRoute);
// end path


app.use(express.static(path.join(__dirname , 'public')));
app.use(bodyParser.json());
app.listen(process.env.PORT || port,()=>
{
    console.log("chatbot server is runnig... at",port);
})

module.exports=app;