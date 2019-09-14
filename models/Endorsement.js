const mongoose = require('mongoose');

const EndorsementSchema = new mongoose.Schema({
    studentUserID: {
        type: String,
        required: true
    },
    lecturerUserID: {
        type: String,
        required: true
    },
    jobAdvertisementID: {
      type: String,
      required: true
    },
    postDate: {
        type: Date,
        default: Date.now
    },
});

const Endorsement = mongoose.model('Endorsement', EndorsementSchema);

module.exports = Endorsement;