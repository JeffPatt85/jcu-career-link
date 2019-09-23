const express = require('express');
const router = express.Router();
const notifier = require('node-notifier');
const {
    ensureAuthenticated,
    forwardAuthenticated
} = require('../config/auth');
router.get('/trigger', ensureAuthenticated, (req , res) => {
    notifier.notify({
        title : 'JCU Career Link' ,
        message: 'You have received a new message' ,
        wait : true
    });


    res.redirect('/messages')
});
module.exports = router ;