'use strict';

const regSettings = require('./regsettings');
const controllers = require('./controllers');
const activities = controllers.activities;
const groups = controllers.groups;
const reglaments = controllers.reglaments;
const teachers = controllers.teachers;
const users = controllers.users;
const common = controllers.common;

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.set('X-Auth-Required', 'true');
    req.session.returnUrl = req.originalUrl;
    return res.redirect('/auth/login');
}

function ensureUnauthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

exports = module.exports = function(app, passport) {
    app.all('/reglaments*', ensureAuthenticated);
    app.all('/teachers*', ensureAuthenticated);
    app.all('/groups*', ensureAuthenticated);
    app.all('/auth*', ensureUnauthenticated);
    app.use('/logout', ensureAuthenticated);

    app.get('/', reglaments.get);

    app.get('/auth/login', users.getLogin);
    app.post('/auth/login', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/auth/login',
    }), users.postLogin)
    app.get('/auth/register', users.getRegister);
    app.post('/auth/register', users.postRegister);
    app.get('/logout', users.logout);

    app.get('/teachers', teachers.get);
    app.post('/teachers/new', teachers.create);
    app.put('/teachers/edit', teachers.edit);
    app.delete('/teachers', teachers.remove);

    app.get('/reglaments*', (req, res, next) => {
        res.locals.timeOrders = regSettings.timeOrders;
        res.locals.extendedOrders = regSettings.extendedOrders;
        res.locals.jobTypes = regSettings.jobTypes;
        res.locals.weekDays = regSettings.weekDays;
        next();
    });
    app.get('/reglaments', reglaments.get);
    app.get('/reglaments/:year/:semester', reglaments.get);
    app.get('/reglaments/new', reglaments.getNew);
    app.post('/reglaments/new', reglaments.create);
    app.delete('/reglaments', reglaments.remove);
    app.get('/reglaments/savetable/:year/:semester', reglaments.saveAsXLSL);

    app.get('/groups', groups.get);
    app.post('/groups/new', groups.create);
    app.put('/groups/edit', groups.update);
    app.delete('/groups/remove', groups.remove);

    app.put('/reglaments/editopentopic', reglaments.editOpenTopic);
    app.put('/activity/edit', activities.edit);
    app.post('/activity/new', activities.create);
    app.delete('/activity/delete', activities.remove);

    app.put('/users/setadmin', users.setAdmin);
    app.post('/users/resetpassword', users.resetPassword);

    app.all('*', common.http404);
};
