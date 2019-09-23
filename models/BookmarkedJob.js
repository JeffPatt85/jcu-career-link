const mongoose = require('mongoose');

const BookmarkedJobSchema = new mongoose.Schema({
    jobAdvertisementId: {
        type: String,
        required: true
    },
    bookmarkedByUserID: {
        type: String,
        required: true
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

const BookmarkedJob = mongoose.model('BookmarkedJob', BookmarkedJobSchema);

module.exports = BookmarkedJob;