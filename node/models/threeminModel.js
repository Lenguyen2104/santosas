const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);


const ThreeMinSchema = new mongoose.Schema({
    three_phien_id: {
        type: Number,
        unique: true,
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
ThreeMinSchema.plugin(AutoIncrement, { inc_field: 'three_phien_id' });
ThreeMinSchema.methods.getLocalTime = function() {
    return moment(this.created_at).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
};

module.exports = mongoose.model('ThreeMin', ThreeMinSchema);