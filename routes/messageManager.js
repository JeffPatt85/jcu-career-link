const express = require('express');
const router = express.Router();


const {
    ensureAuthenticated,
    forwardAuthenticated
} = require('../config/auth');

const User = require('../models/user');
const Message = require('../models/message');

router.post('/sendMessage', ensureAuthenticated, (req, res) => {
    console.log('Send message button pressed');
    const sender = req.user.email;
    const {
        recipient,
        content
    } = req.body;

    let errors = [];

    if (!recipient || !content) {
        errors.push({
            msg: 'Please fill in all fields'
        })
    }

    if (errors.length > 0) {
        console.log("Caught an error");
        res.render('messages', {
            errors,
            recipient,
            content
        });
    } else {
        console.log("No form errors");
        User.findOne({
            email: recipient
        })
            .then(user => {
                if (!user) {
                    errors.push({
                        msg: "That user doesn't exist"
                    });
                    console.log("User doesn't exist");
                    res.render('messages', {errors});
                } else {
                    const newMessage = new Message({
                        sender,
                        recipient,
                        content
                    });
                    newMessage.recipient = newMessage.recipient.toLowerCase();
                    newMessage
                        .save()
                        .then(user => {
                            req.flash(
                                'success_msg',
                                'You have sent ' + recipient + " a message"
                            );
                        });
                    console.log('Sending message to ' + recipient);
                    console.log('The message is ' + content);
                    res.redirect('/messages')
                }
            })


    }});

// Messages page
    router.get('/messages', ensureAuthenticated, (req, res) => {
        console.log('Request made to open messages page');
        console.log(req.user.email);
        Message.find({ recipient : req.user.email}, (err,results) => {
            if (err){
                return console.log('Error has occurred: $(err)');
            } else {
                res.render('messages'
                    , {user: req.user , userMessages : results}
                )
            }
        })


    });
module.exports = router ;

