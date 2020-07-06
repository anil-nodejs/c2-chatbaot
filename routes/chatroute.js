
const express=require('express');
var router=express.Router();

//main route
router.get('/',(req,res)=>
{
res.send("Working");
});
module.exports=router;