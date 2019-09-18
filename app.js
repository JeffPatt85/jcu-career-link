const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const favicon = require('serve-favicon');

const app = express();

const path = require('path');

// Favicon for the sake of completeness
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// Set up access rights for public folder
app.use(express.static('public'));

// Set up access rights for data folder
app.use(express.static('data'));

// Database config
const db = require('./config/keys').MongoURI;

// Passport Config
require('./config/passport')(passport);

// Connect to Mongo using Mongoose
mongoose.connect(db, {
        useNewUrlParser: true
    })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// Declare port to be used
const PORT = process.env.PORT || 5000

// EJS (Templating engine)
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Set up Bodyparser for handling input
app.use(express.urlencoded({
    extended: false
}));

// Express session
app.use(
    session({
        secret: 'I-4m-th3-4lmighty-w4lrus!',
        resave: true,
        saveUninitialized: true
    }));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/notificationManager', require('./routes/notificationManager'));
app.use('onClickManager', require('./public/scripts/onClickManager'));
// Establish server and listener
app.listen(PORT, console.log(`Server started on port ${PORT}`));