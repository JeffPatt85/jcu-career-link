const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: true
    },
    isCurrentResume: {
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
});

const Resume = mongoose.model('Resume', ResumeSchema);

module.exports = Resume;