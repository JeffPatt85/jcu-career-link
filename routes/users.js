const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const router = express.Router();

// User model
const User = require('../models/user');

// Set Auth path
const {
    forwardAuthenticated
} = require('../config/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register handle - process user registration attempt
router.post('/register', (req, res) => {
    const {
        firstName,
        lastName,
        email,
        userType,
        phone,
        password,
        password2
    } = req.body;

    let errors = [];

    function checkPassword(str) {
        // Password should contain at least eight characters long, 
        // contain at least one number, one lowercase and one uppercase letter
        var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;
        return re.test(str);
    }

    // Check required fields
    if (!firstName || !lastName || !email || !phone || !userType || !password || !password2) {
        errors.push({
            msg: 'Please fill in all fields'
        });
    }

    // Check passwords match
    if (password != password2) {
        errors.push({
            msg: 'Passwords entered do not match'
        });
    }

    // Check the password provided meets the standard needs
    if (!checkPassword(password)) {
        errors.push({
            msg: 'Password should be at least eight characters in length, contain at least one number, one lowercase and one uppercase letter'
        })
    }

    // If any errors are present we re-render the screen with the user inputs in place, otherwise
    // begin database procedure
    if (errors.length > 0) {
        res.render('register', {
            errors,
            firstName,
            lastName,
            email,
            phone,
            userType,
            password,
            password2
        });
    } else {
        // Validation passed

        User.findOne({
                email: email
            })
            .then(user => {
                if (user) {
                    // User with the provided email address already exists in database
                    errors.push({
                        msg: 'Email is already registered'
                    })
                    res.render('register', {
                        errors,
                        firstName,
                        lastName,
                        email,
                        phone,
                        userType,
                        password,
                        password2
                    });
                } else {
                    // Generate new User object to be stored in the database
                    const newUser = new User({
                        firstName,
                        lastName,
                        email,
                        phone,
                        userType,
                        password,
                    });

                    // Force the email address to lower case before saving
                    newUser.email = newUser.email.toLowerCase();

                    // Salt the password before saving new User object to database
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err;
                            newUser.password = hash;
                            newUser
                                .save()
                                .then(user => {
                                    // Stores a message in Session that will be displayed after the redirect
                                    req.flash(
                                        'success_msg',
                                        'You are now registered and can log in'
                                    );
                                    res.redirect('/users/login');
                                })
                                .catch(err => console.log(err));
                        });
                    });
                }
            });
    }
});

// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
});

module.exports = router;