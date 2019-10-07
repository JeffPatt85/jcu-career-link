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
const Endorsement = require('../models/Recommendation');

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
                bookmarkedJobs.lastModified = Date.now();
                bookmarkedJobs.save();

                console.log('Existing bookmark isCurrent value changed from true to false.');

                // Send the user back to the jobs page with a message that removal of the bookmark was successful.
                req.flash(
                    'success_msg',
                    'Bookmark removed successfully'
                );
                res.redirect('jobs/1');
            } else {
                bookmarkedJobs.isCurrent = true;
                bookmarkedJobs.lastModified = Date.now();
                bookmarkedJobs.save();

                console.log('Existing bookmark isCurrent value changed from false to true.');

                // Send the user back to the jobs page with a message that the addition of the bookmark was successful.
                req.flash(
                    'success_msg',
                    'Bookmark added successfully'
                );
                res.redirect('jobs/1');
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
                    res.redirect('jobs/1');
                })
                .catch(err => console.log(err));
        }
    });
});


// BookmarkedJobs - serve page
router.get('/bookmarkedJobs/:page', ensureAuthenticated, function (req, res, next) {
    let currentPage = parseInt(req.params.page) || 1;

    // Attempt to retrieve all JobAAdvertisements that are flagged as current, then pass to page and render.
    JobAdvertisement.find({"isCurrent": true}, (err, result) => {
        if (err) {
            return console.log(`Error has occurred: ${err}`);
        }
        BookmarkedJob.find({
            "bookmarkedByUserID": req.user._id,
            "isCurrent": true,
        }, (err, bookmarkedJobs) => {
            if (err) {
                return console.log(`Error has occurred: ${err}`);
            }
            // Check for bookmarks. If none are present we set activeBookmarks to false to save time rendering
            // results on the client side.
            if (!bookmarkedJobs.length) {
                console.log('No bookmarks for current jobs found for this user.');
                let activeBookmarks = false;
                res.render('bookmarkedJobs', {
                    user: req.user,
                    jobAds: result,
                    activeBookmarks: activeBookmarks
                });
            } else {
                if (bookmarkedJobs) {

                    let bookmarkedJobAds = [];

                    console.log(`Meow`);
                    for (let i = 0; i < bookmarkedJobs.length; i++) {
                        let bookmarkedJobId = bookmarkedJobs[i].jobAdvertisementId.toString();
                        let matchingJobAdPosition = result.findIndex(x => x.id === bookmarkedJobId);

                        if (matchingJobAdPosition !== -1) {
                            console.log(`Matching valid ad found for bookmark`);
                            result[matchingJobAdPosition][`activeBookmark`] = true;
                            bookmarkedJobAds.push(result[matchingJobAdPosition]);
                        }
                    }
                    //set default variables
                    let numBookmarkedJobAds = bookmarkedJobAds.length,
                        perPage = 5,
                        pageCount = Math.ceil(numBookmarkedJobAds / perPage),
                        bookmarkedJobAdsArrays = [],
                        bookmarkedJobAdsList;

                    //split list into groups
                    while (bookmarkedJobAds.length > 0) {
                        bookmarkedJobAdsArrays.push(bookmarkedJobAds.splice(0, perPage));
                    }
                    //show list of bookmarkedJobAds from group
                    bookmarkedJobAdsList = bookmarkedJobAdsArrays[+currentPage - 1];

                    //render index.ejs view file
                    res.render(`bookmarkedJobs`, {
                        user: req.user,
                        jobAds: bookmarkedJobAdsList,
                        perPage: perPage,
                        numJobAds: numBookmarkedJobAds,
                        pageCount: pageCount,
                        currentPage: currentPage
                    });
                }
            }
        });
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
                        msg: "You don't seem to have a valid account"
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

// Delete Job - handle job delete request
router.get('/deleteJob', ensureAuthenticated, (req, res) => {
    let jobId = req.query.jobId;

    console.log('Request to delete job ' + jobId + ' ad initiated.');

    User.findOne({
        _id: req.user._id
    })
        .then(user => {
            if (!user) {
                errors.push({
                    msg: "You don't seem to have a valid account"
                });
                console.log("Attempt made to delete job ad by user with no matching user id in db");
                res.render('Job', {errors});
            } else {
                // Generate new JobAdvertisement object to be stored in the database
                JobAdvertisement.findById(jobId, (err, result) => {
                    if (err) {
                        return console.log(`Error has occurred: ${err}`);
                    }
                    console.log(result.postedByUserID);
                    console.log(req.user._id.toString());

                    // Double checking the editor is the owner, just in case
                    if (result.postedByUserID === req.user._id.toString()) {

                        // Good to go. Set the values in the doc to match the new ones from the POST.
                        // I would LOVE to know why I need the toString()!!
                        result.isCurrent = false;

                        // Change the last modified for tracking.
                        result.lastModified = Date.now();

                        // Save the updated document and send the user back to the main jobs page.
                        result.save()
                            .then(user => {
                                // Stores a message in Session that will be displayed after the redirect
                                req.flash(
                                    'success_msg',
                                    'Job archived/deleted successfully'
                                );
                                res.redirect('jobs/1');
                            })
                            .catch(err => console.log(err));
                    } else {
                        req.flash(
                            'success_msg',
                            'You attempted to delete an advertisement that is not yours!'
                        );
                        res.redirect('jobs/1');
                    }
                });
            }
        })
});

// Edit Job - serve page
router.get('/editJob', ensureAuthenticated, (req, res) => {
    let jobId = req.query.jobId;

    console.log('Request made to view job ad with id: ' + jobId);

    // Retrieve the values for the job using another mongo call.
    JobAdvertisement.findOne({_id: jobId}, function (err, advertisement) {
        if (err) {
            return console.log(`Error has occurred: ${err}`);
        }
        // Render the edit page with the current values for the advertisement in place.
        res.render('editJob', {
            jobAdvertisementId: advertisement._id,
            businessName: advertisement.businessName,
            businessPhone: advertisement.businessPhone,
            businessEmail: advertisement.businessEmail,
            jobTitle: advertisement.jobTitle,
            jobDescription: advertisement.jobDescription,
            jobType: advertisement.jobType,
            jobAddress: advertisement.jobAddress,
            jobCity: advertisement.jobCity,
            jobState: advertisement.jobState,
            jobCountry: advertisement.jobCountry,
            remuneration: advertisement.remuneration,
        });
    });
});

// Edit Job - handle job edit request
router.post('/editJob', ensureAuthenticated, (req, res) => {
    let jobId = req.query.jobId;

    console.log('Request to edit job ' + jobId + ' ad initiated.');

    const {
        jobAdvertisementId,
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
            jobAdvertisementId,
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
                    JobAdvertisement.findById(jobId, (err, result) => {
                        if (err) {
                            return console.log(`Error has occurred: ${err}`);
                        }
                        console.log(result.postedByUserID);
                        console.log(req.user._id.toString());

                        // Double checking the editor is the owner, just in case
                        if (result.postedByUserID === req.user._id.toString()) {

                            // Good to go. Set the values in the doc to match the new ones from the POST.
                            // I would LOVE to know why I need the toString()!!
                            result.businessName = req.body.businessName.toString();
                            result.businessPhone = req.body.businessPhone.toString();
                            result.businessEmail = req.body.businessEmail.toString();
                            result.jobTitle = req.body.jobTitle.toString();
                            result.jobDescription = req.body.jobDescription.toString();
                            result.jobType = req.body.jobType.toString();
                            result.jobAddress = req.body.jobAddress.toString();
                            result.jobCity = req.body.jobCity.toString();
                            result.jobState = req.body.jobState.toString();
                            result.jobCountry = req.body.jobCountry.toString();
                            result.remuneration = req.body.remuneration.toString();
                            result.isCurrent = true;
                            result.businessEmail = result.businessEmail.toLowerCase();

                            // Change the last modified for tracking.
                            result.lastModified = Date.now();

                            // Save the updated document and send the user back to the main jobs page.
                            result.save()
                                .then(user => {
                                    // Stores a message in Session that will be displayed after the redirect
                                    req.flash(
                                        'success_msg',
                                        'Job advertisement modified successfully'
                                    );
                                    res.redirect('jobs/1');
                                })
                                .catch(err => console.log(err));
                        } else {
                            req.flash(
                                'success_msg',
                                'You attempted to edit an advertisement that is not yours!'
                            );
                            res.redirect('jobs/1');
                        }
                    });
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
        }
        BookmarkedJob.find({
            "bookmarkedByUserID": req.user._id,
            "isCurrent": true,
            "jobAdvertisementId": jobId
        }, (err, bookmarkedJobs) => {
            if (err) {
                return console.log(`Error has occurred: ${err}`);
            }
            // If there's current bookmarks we want to add a new value to each of the matching ads so rendering on
            // user end is faster, and cleaner with less data transferred.
            if (!bookmarkedJobs.length) {
                result['activeBookmark'] = false;
                res.render('job', {
                    user: req.user,
                    jobAd: result,
                });
            } else {
                if (result._id.toString() === bookmarkedJobs[0].jobAdvertisementId.toString()) {
                    result['activeBookmark'] = true;
                    res.render('job', {
                        user: req.user,
                        jobAd: result,
                    });
                }
            }
        });
    });
});

// Jobs - serve jobs page (all listings)
router.get('/jobs/:page', ensureAuthenticated, (req, res) => {
    let currentPage = parseInt(req.params.page) || 1;

    console.log('Request made to open jobs page');

    // Attempt to retrieve all JobAAdvertisements that are flagged as current, then pass to page and render.
    JobAdvertisement.find({"isCurrent": true}, (err, result) => {
        if (err) {
            return console.log(`Error has occurred: ${err}`);
        }
        BookmarkedJob.find({
            "bookmarkedByUserID": req.user._id,
            "isCurrent": true,
        }, (err, bookmarkedJobs) => {
            if (err) {
                return console.log(`Error has occurred: ${err}`);
            }
            // Check for bookmarks. If none are present we set activeBookmarks to false to save time rendering
            // results on the client side.
            if (!bookmarkedJobs.length) {
                console.log('No bookmarks found when checking for jobs display.');
                //set default variables
                let activeBookmarks = false;
                let numJobAds = result.length,
                    perPage = 5,
                    pageCount = Math.ceil(numJobAds / perPage),
                    resultArrays = [],
                    resultList;

                //split list into groups
                while (result.length > 0) {
                    resultArrays.push(result.splice(0, perPage));
                }
                //show list of result from group
                resultList = resultArrays[+currentPage - 1];

                //render index.ejs view file
                res.render(`jobs`, {
                    user: req.user,
                    jobAds: resultList,
                    perPage: perPage,
                    numJobAds: numJobAds,
                    pageCount: pageCount,
                    currentPage: currentPage,
                    activeBookmarks: activeBookmarks,
                });
            } else {
                if (bookmarkedJobs) {
                    console.log(`Meow`);
                    for (let i = 0; i < bookmarkedJobs.length; i++) {
                        let bookmarkedJobId = bookmarkedJobs[i].jobAdvertisementId.toString();
                        let matchingJobAdPosition = result.findIndex(x => x.id === bookmarkedJobId);

                        if (matchingJobAdPosition !== -1) {
                            console.log(`Matching valid ad found for bookmark`);
                            result[matchingJobAdPosition]["activeBookmark"] = true;
                        } else {
                            console.log(`Matching ad not found for bookmark. Likely deleted ad with id: ` + bookmarkedJobId);
                        }
                    }
                    //set default variables
                    let activeBookmarks = true;
                    let numJobAds = result.length,
                        perPage = 5,
                        pageCount = Math.ceil(numJobAds / perPage),
                        resultArrays = [],
                        resultList;

                    //split list into groups
                    while (result.length > 0) {
                        resultArrays.push(result.splice(0, perPage));
                    }
                    //show list of result from group
                    resultList = resultArrays[+currentPage - 1];

                    //render index.ejs view file
                    res.render(`jobs`, {
                        user: req.user,
                        jobAds: resultList,
                        perPage: perPage,
                        numJobAds: numJobAds,
                        pageCount: pageCount,
                        currentPage: currentPage,
                        activeBookmarks: activeBookmarks,
                    });
                }
            }
        });
    });
});

// Help - serve page
router.get('/help', ensureAuthenticated, (req, res) => {
    console.log('Request made to open help page');
    res.render('help', {
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

module.exports = router;
