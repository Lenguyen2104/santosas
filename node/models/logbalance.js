const mongoose = require('mongoose');

const logbalanceSchema = new mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    frommoney:{
        type: Number,
        required: true
    },
    money:{
        type: Number,
        required: true
    },
    tomoney:{
        type: Number,
        required: true
    },
    content:{
        type: String,
        required: false
    },
    status:{
        type: String,
        required: true
    },
    type:{
        type: String,
        required: true
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Logbalance', logbalanceSchema);
