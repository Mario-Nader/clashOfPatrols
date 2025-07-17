const mongoose = require('mongoose');

patrolSchema = mongoose.Schema({
    tot_sol:{
        type:Number,
        required:true,
    },
    coins:{
        type:Number,
        required:true,
    },
    tot_soil:{
        type:Number,
        required:true
    },
    soils:{
        apple:{
            type:Number,
            required:true
        },
        wheat:{
            type:Number,
            required:true
        },
        watermelon:{
            type:Number,
            required:true
        },
        empty:{
            type:Number,
            required:true
        },
    },
    tot_houses:{
        type:Number,
        required:true,
    },tot_horses:{
        type:Number,
        required:true,
    },tot_carts:{
        type:Number,
        required:true,
    },tot_workshops:{
        type:Number,
        required:true,
    },tot_lands:{
        type:Number,
        required:true,
    },name:{
        type:String,
        required:true,
    },
    rentHorse:{
        type:Number,
        required:true
    },
    rentCart:{
        type:Number,
        required:true
    },
    wheatSeeds:{
        type:Number,
        required:true
    },
    appleSeeds:{
        type:Number,
        required:true
    },
    watermelonSeeds:{
        type:Number,
        required:true
    },
    watermelon:{
        type:Number,
        required: true
    },
    apple:{
        type:Number,
        required: true
    },
    wheat:{
        type:Number,
        required: true
    },
    farming:{
        type:Boolean,
        required: true
    },
    currentGDP:{
        type:Number,
        require:true
    },fed:{
        type:Number,
        required : true
    }
});

module.exports = mongoose.model('Patrol',patrolSchema);