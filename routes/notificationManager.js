const express = require('express');
const router = express.Router();
const notifier = require('node-notifier');
const {
    ensureAuthenticated,
    forwardAuthenticated
} = require('../config/auth');
console.log("You reached the notification manager");
router.get('/trigger', ensureAuthenticated, (req , res) => {
    notifier.notify('You have a new message');
    console.log("You reached the notification manager trigger");
    res.redirect('/messages')
});
module.exports = router ;