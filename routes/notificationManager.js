const express = require('express');
const router = express.Router();

const {
    ensureAuthenticated,
    forwardAuthenticated
} = require('../config/auth');

const Message = require('../models/message');
const User = require('../models/user');

router.get('/trigger', ensureAuthenticated, (req , res) => {
    notifier.notify({
        title : 'JCU Career Link' ,
        message: 'You have received a new message' ,
        wait : true
    });


    res.redirect('/messages')
});


module.exports = router ;