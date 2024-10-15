const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    link:{
        type: String,
        required: false
    },
    content:{
        type: String,
        required: false
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);