const express = require('express');
const formidable = require('formidable');
const router = express.Router();
const {
    ensureAuthenticated,
    forwardAuthenticated
} = require('../config/auth');

const User = require('../models/user');
const JobAdvertisement = require('../models/jobAdvertisement');
const BookmarkedJob = require('../models/BookmarkedJob');
const Endorsement = require('../models/Endorsement');

// Bookmark Job - handle bookmark request
router.get('/bookmarkJob', ensureAuthenticated, function (req, res) {
    let jobId = req.query.jobId;
    let userId = req.user._id.toString();

    console.log('Request made to by user ' + userId + ' to bookmark job ad ' + jobId);

    // Do a mongo check for an existing bookmark matching the user id and job id. If there is no match, make an entry.
    BookmarkedJob.findOne({bookmarkedByUserID: userId, jobAdvertisementId: jobId}, function (err, bookmarkedJobs) {
        if (err) {
            return console.log(`Error has occurred: ${err}`);
        }

        // If a value is returned, the user has bookmarked the job before. We need to check if it's disabled.
        if (bookmarkedJobs !== null || bookmarkedJobs) {

            // If we reach this point, an entry already exists, and we just need to flag it as current
            console.log(`An existing bookmark for job has been found stored against the user.`);

            // Check the current state of the isCurrent value.
            if (bookmarkedJobs.isCurrent === true) {
                bookmarkedJobs.isCurrent = false;
                bookmarkedJobs.save();

                console.log('Existing bookmark isCurrent value changed from true to false.');

                // Send the user back to the jobs page with a message that removal of the bookmark was successful.
                req.flash(
                    'success_msg',
                    'Bookmark removed successfully'
                );
                res.redirect('jobs');
            } else {
                bookmarkedJobs.isCurrent = true;
                bookmarkedJobs.save();

                console.log('Existing bookmark isCurrent value changed from false to true.');

                // Send the user back to the jobs page with a message that the addition of the bookmark was successful.
                req.flash(
                    'success_msg',
                    'Bookmark added successfully'
                );
                res.redirect('jobs');
            }
        } else {
            // If we reach this point there is no entries that match, and it's time to make one.
            console.log('Creating new database entry for the bookmark request.');

            // Generate new JobAdvertisement object to be stored in the database
            const newBookmarkedJob = new BookmarkedJob({
                jobAdvertisementId: jobId,
                bookmarkedByUserID: userId,
                postDate: Date.now(),
                isCurrent: true,
                lastModified: Date.now()
            });
            // Force the email address to lower case before saving, set some other default values.
            newBookmarkedJob.save()
                .then(user => {
                    // Stores a message in Session that will be displayed after the redirect
                    req.flash(
                        'success_msg',
                        'Advertisement bookmarked successfully'
                    );
                    res.redirect('jobs');
                })
                .catch(err => console.log(err));
        }
    });
});

// Create Job - serve page
router.get('/createJob', ensureAuthenticated, (req, res) => {
    console.log('Request made to open job ad creation page');
    res.render('createJob', {
        user: req.user
    })
});

// Create Job - handle job creation request
router.post('/createJob', ensureAuthenticated, (req, res) => {
    console.log(`Request to create new job ad initiated.`);

    const {
        businessName,
        businessPhone,
        businessEmail,
        jobTitle,
        jobDescription,
        jobType,
        jobAddress,
        jobCity,
        jobState,
        jobCountry,
        remuneration,
        isCurrent,
        postedByUserID,
        postDate
    } = req.body;

    let errors = [];

    // Check required fields
    if (!businessName || !businessPhone || !businessEmail || !jobTitle || !jobDescription || !jobType || !jobAddress
        || !jobCity || !jobState || !jobCountry) {
        errors.push({
            msg: 'Please fill in all fields'
        });
    }

    // If any errors are present we re-render the screen with the user inputs in place, otherwise
    // begin database procedure
    if (errors.length > 0) {
        res.render('createJob', {
            errors,
            businessName,
            businessPhone,
            businessEmail,
            jobTitle,
            jobDescription,
            jobType,
            jobAddress,
            jobCity,
            jobState,
            jobCountry,
            remuneration,
            isCurrent,
            postedByUserID,
            postDate
        });
    } else {
        // Validation passed
        console.log(`No errors found, time to save the new ad to db`);
        User.findOne({
            _id: req.user._id
        })
            .then(user => {
                if (!user) {
                    errors.push({
                        msg: "You don't seem ot have a valid account"
                    });
                    console.log("Attempt made to create job ad by user with no matching user id in db");
                    res.render('createJob', {errors});
                } else {
                    // Generate new JobAdvertisement object to be stored in the database
                    const newJobAdvertisement = new JobAdvertisement({
                        businessName,
                        businessPhone,
                        businessEmail,
                        jobTitle,
                        jobDescription,
                        jobType,
                        jobAddress,
                        jobCity,
                        jobState,
                        jobCountry,
                        remuneration,
                        isCurrent,
                        postedByUserID,
                        postDate,
                    });
                    // Force the email address to lower case before saving, set some other default values.
                    newJobAdvertisement.businessEmail = newJobAdvertisement.businessEmail.toLowerCase();
                    newJobAdvertisement.isCurrent = true;
                    newJobAdvertisement.postedByUserID = req.user._id;
                    newJobAdvertisement.save()
                        .then(user => {
                            // Stores a message in Session that will be displayed after the redirect
                            req.flash(
                                'success_msg',
                                'New job advertisement saved successfully'
                            );
                            res.redirect('createJob');
                        })
                        .catch(err => console.log(err));
                }
            })
    }
});

// Dashboard - serve page
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    console.log('Request made to open dashboard page');
    res.render('dashboard', {
        user: req.user
    })
});

// Edit Job - serve page
router.get('/editJob', ensureAuthenticated, (req, res) => {
    let jobId = req.query.jobId;

    console.log('Request made to view job ad with id: ' + jobId);

    // Retrieve the values for the job using another mongo call.

    // Render the edit page with the current values for the advertisement in place.

    res.render('editJob', {
        businessName,
        businessPhone,
        businessEmail,
        jobTitle,
        jobDescription,
        jobType,
        jobAddress,
        jobCity,
        jobState,
        jobCountry,
        remuneration,
        isCurrent,
        postedByUserID,
        postDate
    });

});

// Edit Job - handle job edit request
router.post('/editJob', ensureAuthenticated, (req, res) => {
    console.log(`Request to edit job ad initiated.`);

    const {
        businessName,
        businessPhone,
        businessEmail,
        jobTitle,
        jobDescription,
        jobType,
        jobAddress,
        jobCity,
        jobState,
        jobCountry,
        remuneration,
        isCurrent,
        postedByUserID,
        postDate,
    } = req.body;

    let errors = [];

    // Check required fields
    if (!businessName || !businessPhone || !businessEmail || !jobTitle || !jobDescription || !jobType || !jobAddress
        || !jobCity || !jobState || !jobCountry) {
        errors.push({
            msg: 'Please fill in all fields'
        });
    }

    // If any errors are present we re-render the screen with the user inputs in place, otherwise
    // begin database procedure
    if (errors.length > 0) {
        res.render('editJob', {
            errors,
            businessName,
            businessPhone,
            businessEmail,
            jobTitle,
            jobDescription,
            jobType,
            jobAddress,
            jobCity,
            jobState,
            jobCountry,
            remuneration,
            isCurrent,
            postedByUserID,
            postDate,
        });
    } else {
        // Validation passed
        console.log(`No errors found, time to update the existing ad`);
        User.findOne({
            _id: req.user._id
        })
            .then(user => {
                if (!user) {
                    errors.push({
                        msg: "You don't seem to have a valid account"
                    });
                    console.log("Attempt made to edit job ad by user with no matching user id in db");
                    res.render('editJob', {errors});
                } else {
                    // Generate new JobAdvertisement object to be stored in the database
                    const newJobAdvertisement = new JobAdvertisement({
                        businessName,
                        businessPhone,
                        businessEmail,
                        jobTitle,
                        jobDescription,
                        jobType,
                        jobAddress,
                        jobCity,
                        jobState,
                        jobCountry,
                        remuneration,
                        isCurrent,
                        postedByUserID,
                        postDate
                    });
                    // Force the email address to lower case before saving
                    newJobAdvertisement.businessEmail = newJobAdvertisement.businessEmail.toLowerCase();
                    newJobAdvertisement.isCurrent = true;
                    newJobAdvertisement.postedByUserID = req.user._id;
                    newJobAdvertisement.save()
                        .then(user => {
                            // Stores a message in Session that will be displayed after the redirect
                            req.flash(
                                'success_msg',
                                'Job advertisement modified successfully'
                            );
                            res.redirect('jobs');
                        })
                        .catch(err => console.log(err));
                }
            })
    }
});

// Job - serve job page (single listing with more details)
router.get('/job', ensureAuthenticated, function (req, res) {
    let jobId = req.query.jobId;

    console.log('Request made to view job ad with id: ' + jobId);

    JobAdvertisement.findById(jobId, (err, result) => {
        if (err) {
            return console.log(`Error has occurred: ${err}`);
        } else {
            res.render('job', {
                user: req.user,
                jobAd: result
            });
        }
    });
});

// Jobs - serve jobs page (all listings)
router.get('/jobs', ensureAuthenticated, (req, res) => {
    console.log('Request made to open jobs page');
    JobAdvertisement.find({"isCurrent": "true"}, (err, result) => {
        if (err) {
            return console.log(`Error has occurred: ${err}`);
        } else {
            // console.log(result);
            res.render('jobs', {
                user: req.user,
                jobAds: result
            });
        }
    });
});

// Help - serve page
router.get('/help', ensureAuthenticated, (req, res) => {
    console.log('Request made to open help page');
    res.render('help', {
        user: req.user
    })
});

// Messages - serve page
router.get('/messages', ensureAuthenticated, (req, res) => {
    console.log('Request made to open messages page');
    res.render('messages', {
        user: req.user
    })
});

// Profile - serve page
router.get('/profile', ensureAuthenticated, (req, res) => {
    console.log('Request made to open profile page');
    res.render('profile', {
        user: req.user
    })
});

// Create Job - serve page
router.get('/peers', ensureAuthenticated, (req, res) => {
    console.log('Request made to open peers page');
    res.render('peers', {
        user: req.user
    })
});

// Resume - serve page
router.get('/resume', ensureAuthenticated, (req, res) => {
    console.log('Request made to open resume page');
    res.render('resume', {
        user: req.user
    })
});

// Resume - handle resume upload request
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

    res.redirect('/profile');

});

// Test - serve page
router.get('/test', ensureAuthenticated, (req, res) => {
    console.log('Request made to open test page');
    res.render('test', {
        user: req.user
    })
});

// Welcome - serve page
router.get('/', forwardAuthenticated, (req, res) =>
    res.render('welcome'));

// Error handling for routing. Can't be applied unless we fold the multiple route file together.
// //A Route for Creating a 500 Error (Useful to keep around)
// router.get('/500', function(req, res){
//     throw new Error('This is a 500 Error');
// });
//
// //The 404 Route (ALWAYS Keep this as the last route)
// router.get('/*', function(req, res){
//     res.render('404');
//     throw new NotFound;
// });
//
// function NotFound(msg){
//     this.name = 'NotFound';
//     Error.call(this, msg);
//     Error.captureStackTrace(this, arguments.callee);
// }

module.exports = router;
