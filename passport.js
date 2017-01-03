'use strict';

exports = module.exports = function(app, passport) {
  var LocalStrategy = require('passport-local').Strategy;

  passport.use(new LocalStrategy({
      usernameField: 'email'
    },
    function(username, password, done) {
      // console.log(username);
      var conditions = {};
      if (username.indexOf('@') === -1) {
        conditions.username = username;
      } else {
        conditions.email = username.toLowerCase();
      }

      app.db.models.User.findOne(conditions, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false, {
            message: 'Користувача з таким логіном ще не зареєстровано!'
          });
        }

        if (!app.db.models.User.isValidPassword(password, user)) {
          return done(null, false, {
            message: 'Неправильний пароль.'
          });
        }

        return done(null, user);
      });
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    app.db.models.User.findById(id, function(err, user) {
      if (err) {
        return done(err);
      }

      done(null, user);
    });
  });
};