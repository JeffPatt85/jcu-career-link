const express = require('express');
const router = express.Router();
const {
    ensureAuthenticated,
    forwardAuthenticated
} = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard Page
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    console.log('Request made to open profile page');
    res.render('dashboard', {
        user: req.user
    })
});

// Profile Page
router.get('/profile', ensureAuthenticated, (req, res) => {
    console.log('Request made to open profile page');
    res.render('profile', {
        user: req.user
    })
});

// Listings Page
router.get('/listings', ensureAuthenticated, (req, res) => {
    console.log('Request made to open listings page');
    res.render('listings', {
        user: req.user
    })
});

// Help Page
router.get('/help', ensureAuthenticated, (req, res) => {
    console.log('Request made to open help page');
    res.render('help', {
        user: req.user
    })
});

// Test Page
router.get('/messages', ensureAuthenticated, (req, res) => {
    console.log('Request made to open messages page');
    res.render('messages', {
        user: req.user
    })
});

// Handle Resume POST
router.post('/resume', (req, res, next) => {
    console.log('Request made to handle a resume POST');
});

module.exports = router;
