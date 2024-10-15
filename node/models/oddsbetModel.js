const mongoose = require('mongoose');
const moment = require('moment-timezone');

const OddsBetSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false
    },
    value:{
        type: Number,
        required: true
    },
    type:{
        type: String,
        required: true
    },
    official:{
        type: String,
        required: true
    },
},{
    timestamps: true
});

module.exports = mongoose.model('OddsBet', OddsBetSchema);
