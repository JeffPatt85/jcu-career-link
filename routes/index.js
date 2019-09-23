const express = require('express');
const formidable = require('formidable');
const router = express.Router();
const {
    ensureAuthenticated,
    forwardAuthenticated
} = require('../config/auth');





// Welcome page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard page
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    console.log('Request made to open profile page');
    res.render('dashboard', {
        user: req.user
    })
});

// Profile page
router.get('/profile', ensureAuthenticated, (req, res) => {
    console.log('Request made to open profile page');
    res.render('profile', {
        user: req.user
    })
});

// Job advertisement creation page
router.get('/createJob', ensureAuthenticated, (req, res) => {
    console.log('Request made to open job ad creation page');
    res.render('createJob', {
        user: req.user
    })
});

// Job advertisement creation page
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
    if (password !== password2) {
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

// Job page - single job view
router.get('/job', ensureAuthenticated, (req, res) => {
    console.log('Request made to open job page');
    res.render('job', {
        user: req.user
    })
});

// Jobs page - all jobs view
router.get('/jobs', ensureAuthenticated, (req, res) => {
    console.log('Request made to open jobs page');
    res.render('jobs', {
        user: req.user
    })
});

// Help page
router.get('/help', ensureAuthenticated, (req, res) => {
    console.log('Request made to open help page');
    res.render('help', {
        user: req.user
    })
});



// Resume upload page
router.get('/resume', ensureAuthenticated, (req, res) => {
    console.log('Request made to open resume page');
    res.render('resume', {
        user: req.user
    })
});

// Resume upload request handle
router.post('/resume', (req, res, next) => {
    console.log('Request made to handle a resume POST');
    let form = new formidable.IncomingForm();

    form.parse(req);

    form.on('fileBegin', function (name, file) {
        file.path = 'data/uploads/resumes/' + file.name;
    });

    form.on('file', function (name, file) {
        console.log('Uploaded ' + file.name);
    });

    req.flash(
        'success_msg',
        'Resume uploaded successfully'
    );

    res.redirect('/resume');

});

// Test page
router.get('/test', ensureAuthenticated, (req, res) => {
    console.log('Request made to open test page');
    res.render('test', {
        user: req.user
    })
});

// router.use(function(err, req, res, next) {
//     console.error(err.message);
//     if (!err.statusCode) err.statusCode = 500; // Sets a generic server error status code if none is part of the err
//
//     if (err.shouldRedirect) {
//         res.render('404') // Renders a myErrorPage.html for the user
//     } else {
//         res.status(err.statusCode).send(err.message); // If shouldRedirect is not defined in our error, sends our original err data
//     }
// });
//
// // Handle request for undeclared pages.
// router.get('*', function(req, res, next) {
//     let err = new Error(`${req.ip} tried to reach ${req.originalUrl}`); // Tells us which IP tried to reach a particular URL
//     err.statusCode = 404;
//     err.shouldRedirect = true; //New property on err so that our middleware will redirect
//     next(err);
// });



module.exports = router;
