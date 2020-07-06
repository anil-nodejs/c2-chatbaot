var mongoose=require('mongoose');
var Schema=mongoose.Schema;
var userSchema=new Schema({
    fbid: { type: Number, index: true, unique: true },
    first_name: { type: String, "default": "" },
    last_name: { type: String, "default": "" },
    lastAction: { type: String, "default": "" },
    createdDate: { type: Date, default: Date.now },
});

module.exports=mongoose.model("User",userSchema)