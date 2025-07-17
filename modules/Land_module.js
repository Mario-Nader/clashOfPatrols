const mongoose = require('mongoose');

const landSchema = new mongoose.Schema({
  land_no: {
    type: Number,
    required: true
  },
  patrol_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patrol',
    required: true
  },
  soils: {
    wheat: {
      type: Number,
       required: true
    },
    watermelon: {
      type: Number,
       required: true
    },
    apple: {
      type: Number,
      required: true
    },
    empty: {
      type: Number,
      required: true
    }
  },
  houses: {
    type: Number,
     required: true
  },
  soldiers: {
    type: Number,
    required: true
  },
  workshop: {
    type: Boolean,
    required: true
  },
  inventory:{
    wheat:{
      type:Number,
      required:true,
    },watermelon:{
      type:Number,
      required:true
    },apple:{
      type:Number,
      required:true,
    }
  },
  adjacent:{
    type:[Number],
    required:true
  },
  soil_no: {
    type:Number,
    required: true
  },
  conditions:{
    "soldiers":{
      type:Number,
      required:true
    },
    "houses":{
      type:Number,
      required:true
    },
    "lands":{
      type:Number,
      required:true
    },
    "coins":{
      type:Number,
      required:true
    },
    "inLandSoldiers":{
      type:Number,
      required:true
    }
  },fed:{
    type:Number,
    required : true
  }
});

module.exports = mongoose.model('Land', landSchema);