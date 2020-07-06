var mongoose=require('mongoose');
var Schema=mongoose.Schema;
var userSchema=new Schema({
    fbid: { type: Number, index: true, unique: true },
    first_name: { type: String, "default": "" },
    last_name: { type: String, "default": "" },
    lastAction: { type: String, "default": "" },
    createdDate: { type: Date, default: Date.now },
    Mission_Green_Million: { type: Number, default: 0 },
    whats_happening: { type: Number, default: 0 },
    restart: { type: Number, default: 0 },


});

module.exports=mongoose.model("User",userSchema)