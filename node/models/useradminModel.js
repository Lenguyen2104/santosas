const mongoose = require('mongoose');

const useradminSchema = new mongoose.Schema({
    phone:{
        type: String,
        required: true
    },
    username:{
        type: String,
        required: true
    },
    image:{
        type: String,
        required: false
    },
    password:{
        type: String,
        required: true
    },
    avatar:{
        type: String,
        required: true
    },
    level:{
        type: Number,
        default: 1,
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
    is_online:{
        type: Boolean,
        required: false
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Useradmin', useradminSchema);
