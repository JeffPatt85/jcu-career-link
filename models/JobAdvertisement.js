const mongoose = require('mongoose');

const JobAdvertisementSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: true
    },
    businessPhone: {
        type: String,
        required: true
    },
    businessEmail: {
        type: String,
        required: true
    },
    jobTitle: {
        type: String,
        required: true
    },
    jobDescription: {
        type: String,
        required: true
    },
    jobType: {
        type: String,
        required: true
    },
    jobAddress: {
        type: String,
        required: true
    },
    jobCity: {
        type: String,
        required: true
    },
    jobState: {
        type: String,
        required: true
    },
    jobCountry: {
        type: String,
        required: true
    },
    remuneration: {
        type: String,
        required: false
    },
    isCurrent: {
        type: Boolean,
        required: true
    },
    postedByUserID: {
        type: String,
        required: true
    },
    postDate: {
        type: Date,
        default: Date.now
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
});

const JobAdvertisement = mongoose.model('JobAdvertisement', JobAdvertisementSchema);

module.exports = JobAdvertisement;