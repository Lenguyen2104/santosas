const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    password_show:{
        type: String,
        required: false
    },
    phone:{
        type: String,
        required: false
    },
    password_withdraw:{
        type: String,
        required: false
    },
    balance:{
        type: Number,
        required: false,
        default: 0
    },
    bank_id:{
        type: String,
        default: null,
        required: false
    },
    bank_number:{
        type: String,
        default: null,
        required: false
    },
    bank_user:{
        type: String,
        default: null,
        required: false
    },
    email:{
        type: String,
        required: false,
        default: null
    },
    address:{
        type: String,
        required: false,
        default: null
    },
    info:{
        type: String,
        required: false,
        default: null
    },
    gender:{
        type: String,
        required: false,
        default: null
    },
    birthday:{
        type: String,
        required: false,
        default: null
    },
    vip:{
        type: Number,
        required: false,
        default: 1
    },
    avatar:{
        type: String,
        required: false
    },
    ref:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    coderef:{
        type: String,
        default: null,
        required: false
    },
    banned:{
        type: Number,
        default: 0,
        required: false
    },
    roles:{
        type: String,
        default: 'member',
        required: false
    },
    cmndmt:{
        type: String,
        default: null,
        required: false
    },
    cmndms:{
        type: String,
        default: null,
        required: false
    },
    ipaddress:{
        type: String,
        default: null,
        required: false
    },
    enable_bet:{
        type: Boolean,
        default: true,
        required: false
    },
    total_desposit:{
        type: Number,
        default: 0,
        required: false
    },
    total_withdraw:{
        type: Number,
        default: 0,
        required: false
    },
    total_bet:{
        type: Number,
        default: 0,
        required: false
    },
    total_win:{
        type: Number,
        default: 0,
        required: false
    }
},{
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
