const mongoose = require('mongoose');

const settingchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    value:{
        type: String,
        required: false
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Setting', settingchema);