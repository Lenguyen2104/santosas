const mongoose = require('mongoose');
const moment = require('moment-timezone');

const BetSchema = new mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    phien_id: {
        type: Number,
        required: false
    },
    type:{
        type: String,
        required: true
    },
    contenttype:{
        type: String,
        required: true
    },
    contenta:{
        type:Number,
        required: false
    },
    contentb:{
        type:Number,
        required: false
    },
    contentc:{
        type:Number,
        required: false
    },
    total:{
        type:String,
        required: false
    },
    tyle:{
        type:Number,
        required: false
    },
    money:{
        type:Number,
        required: false
    },
    result:{
        type:Number,
        required: false
    },
    status:{
        type:String,
        required: false
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
},{
    timestamps: true
});
BetSchema.methods.getLocalTime = function() {
    return moment(this.created_at).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
};

module.exports = mongoose.model('Bet', BetSchema);
