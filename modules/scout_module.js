const mongoose  = require('mongoose');
const ScoutsSchema = new mongoose.Schema({
    name:{
        type: String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
        minlength:8,
    },
    cp:{
        type:Boolean,
        required:true,
    },patrol:{
        type:mongoose.Types.ObjectId,
        ref : "Patrol",
    }
});

module.exports = mongoose.model('Scout',ScoutsSchema,'scouts');