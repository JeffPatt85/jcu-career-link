const express = require('express');
const router = express.Router();
const ObjectID= require('mongodb').ObjectID;
const session = require('express-session');
const notifier = require('node-notifier');
const {
    ensureAuthenticated,
    forwardAuthenticated
} = require('../config/auth');

const User = require('../models/user');
const Message = require('../models/message');

global.currentUser = undefined;


router.post('/sendMessage', ensureAuthenticated, (req, res) => {
    console.log('Send message button pressed');
    const sender = req.user.email;
    const {
        recipient,
        content
    } = req.body;

    let errors = [];

    if (!recipient || !content) {
        req.flash('error_msg', "Please fill in all fields");
        res.redirect('/messageManager/messages')

    } else {
        console.log("No form errors");

        User.findOne({
            email: recipient
        })
            .then(user => {
                if (!user) {
                    console.log("User doesn't exist");
                    req.flash('error_msg', "That user doesn't exist");
                    res.redirect('/messageManager/messages')


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
                            console.log('Sending message to ' + recipient);
                            console.log('The message is ' + content);
                            req.flash(
                                'success_msg',
                                'You have sent ' + recipient + " a message"
                            );
                            res.redirect('/messageManager/messages')
                        });
                }
            })


    }});

// Messages page
    router.get('/messages', ensureAuthenticated, (req, res) => {
        console.log('Request made to open messages page');
        console.log(req.user.email);
        currentUser = req.user.email;
        Message.find({ recipient : req.user.email}, (err,results) => {
            if (err){
                return console.log('Error has occurred: $(err)');
            } else {
                // console.log(results);
                res.render('messages'
                    , {user: req.user , userMessages : results}
                )
            }
        })
    });

    router.post('/markMessageRead', ensureAuthenticated, (req, res)=> {
        console.log("Request made to mark message as read");
        const messageID = req.body.messageId;
        // console.log(messageID);
        Message.findByIdAndUpdate(new ObjectID(messageID), {isRead : true}, (err, result) =>{
            if (err){
                return console.log('Database error has occurred: '+ err);
            }else {
                // console.log("Result +" + result);
                console.log("Success");
                res.redirect('/messageManager/messages')
            }
        })
    });

// Code to check for unread messages
const notificationCheck = setInterval(function(){
        Message.find({ recipient : currentUser, isRead : false}, (err,results) => {
            if (err){
                return console.log('Error has occurred: $(err)');
            } else {
                if(results.length){
                    // console.log(results);
                    console.log("you have unread messages");
                    notifier.notify({
                        title : 'JCU Career Link' ,
                        message: 'You have received a new message' ,
                        wait : true
                    });

                }else{
                    console.log("You have no new messages");
                }

            }
        })
    },60000
);
module.exports = router ;

