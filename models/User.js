const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    personalSummary: {
        type: String,
        required: false
    },
    skills: {
        type: String,
        required: false
    },
    experience: {
        type: String,
        required: false
    },
    profilePhoto: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    lastModified: {
        type: Date,
        required: true
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;