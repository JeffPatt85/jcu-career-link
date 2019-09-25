const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender : {
        type : String,
        required : true
    },
    recipient : {
        type : String ,
        required : true
    },
    content : {
        type : String ,
        required : true
    },
    sentDate : {
        type: Date,
        default : Date.now
    },
    isRead : {
        type: Boolean,
        default : false
    }
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;