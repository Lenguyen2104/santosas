const mongoose = require('mongoose');

const logweb = new mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ipaddress:{
        type: String,
        required: false
    },
    agent:{
        type: Object,
        required: false
    },
    os:{
        type: Object,
        required: false
    },
    device:{
        type: Object,
        required: false
    },
    content:{
        type: String,
        required: false
    },
},{
    timestamps: true
});

module.exports = mongoose.model('Logweb', logweb);
