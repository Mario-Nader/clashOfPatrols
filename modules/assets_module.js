const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
asset:{
    type:String,
    required:true,
},
cost:{
    type:Number,
    required:true,
}
}
)

module.exports = mongoose.model('Asset',assetSchema);