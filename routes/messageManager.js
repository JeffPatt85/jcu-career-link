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

//Code to delete messages
router.post('/deleteMessage', ensureAuthenticated, (req, res)=> {
    const messageID = req.body.messageId;
    console.log("Request made to delete the message with the ID:" + messageID);

    // console.log(messageID);
    Message.findByIdAndDelete(new ObjectID(messageID),(err, result) =>{
        if (err){
            return console.log('Database error has occurred: '+ err);
        }else {
            // console.log("Result +" + result);
            console.log("Success");
            req.flash('success_msg', "Message deleted");
            res.redirect('/messageManager/messages')
        }
    })
});

// Sending messages to the database
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
        res.render('newMessage', {messageRecipient : recipient})

    } else {
        console.log("No form errors");

        User.findOne({
            email: recipient
        })
            .then(user => {
                if (!user) {
                    console.log("User doesn't exist");
                    req.flash('error_msg', "That user doesn't exist");
                    res.render('newMessage', {messageRecipient : recipient})


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
                            // res.redirect(req.getHeader());
                            console.log(req.url);
                            res.redirect('/messageManager/messages')
                        });
                }
            })


    }});

//Loading the new message page with
    router.post('/sendNewMessage', ensureAuthenticated, (req,res)=>{
        console.log('Request made to open a new message page');
        let messageRecipient;
        if(!req.body.recipient){
            // console.log("reply button not pressed");
            messageRecipient = "";
        }else{
            // console.log("reply button pressed");
            messageRecipient = req.body.recipient;
            // console.log(messageRecipient);
        }
        res.render('newMessage', {user: req.user, messageRecipient: messageRecipient})
    });

// Loading the messages page
    router.get('/messages', ensureAuthenticated, (req, res) => {
        console.log('Request made to open messages page');
        // console.log(req.user.email);
        let currentUser = req.user.email;
        Message.find( { $or: [{ recipient: currentUser}, {sender : currentUser}]}, (err,results) => {
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

    //Marking messages as read
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
    //Timer for message checking to generate notifications in milliseconds
    },600000
);
module.exports = router ;

