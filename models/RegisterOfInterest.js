const mongoose = require('mongoose');

const RegisterOfInterestSchema = new mongoose.Schema({
    studentUserID: {
        type: String,
        required: true
    },
    jobAdvertisementID: {
        type: String,
        required: true
    },
    studentComments: {
        type: String,
        required: false
    },
    postDate: {
        type: Date,
        default: Date.now
    },
    isCurrent: {
        type: Boolean,
        required: true
    },
    lastModified: {
        type: Date,
        required: true
    }
});

const RegisterOfInterest = mongoose.model('RegisterOfInterest', RegisterOfInterestSchema);

module.exports = RegisterOfInterest;