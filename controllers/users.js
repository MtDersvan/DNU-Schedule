'use strict';

const bcrypt = require('bcrypt');
const passport = require('passport');
const passwordSplitter = /[\s]/;

let regMockup = {
  title: 'Реєстрація',
  email: 'v@zhuk.com',
  password: '111111',
  passConf: '111111',
  firstname: 'Vladislav',
  lastname: 'Zhuk',
  fathersname: 'Urievich',
  position: 'dotsent',
  phone: '+38(000)000-00-00'
};

module.exports.getLogin = (req, res) => {
  return res.render('authorization/login', {
    title: 'Вхід'
  });
};

module.exports.getRegister = (req, res) => {
  // res.render('authorization/register', {
  //   title: 'Реєстрація',
  // });
  return res.render('authorization/register', regMockup);
};

module.exports.postLogin = (req, res) => {
  console.log('Successful login');
  console.log(res.user);

  req.flash('success', 'Ви увійшли як ' + res.user.fullName());
  return res.redirect('/');
};

module.exports.postRegister = (req, res) => {
  let body = req.body;
  let firstname = body.firstname.trim();
  let fathersname = body.fathersname.trim();
  let lastname = body.lastname.trim();
  let position = body.position.trim();
  let email = body.email.trim();
  let username = email;
  let phone = body.phone.trim();
  body.password = body.password.trim().split(passwordSplitter).join('');
  let password = body.password;
  let passConf = body.passConf;
  let isTeacher = (body.isTeacher === 'on') ? true : false;

  req.checkBody('firstname', 'Необхідно ввести ім’я.')
    .notEmpty()
    .notBlank();

  req.checkBody('fathersname', 'Необхідно ввести ім’я по-батькові.')
    .notEmpty()
    .notBlank();

  req.checkBody('lastname', 'Необхідно ввести прізвище.')
    .notEmpty()
    .notBlank();

  req.checkBody('position', 'Необхідно ввести посаду.')
    .notEmpty()
    .notBlank();

  req.checkBody('email', 'Необхідно ввести електронну адресу.')
    .notEmpty()
    .notBlank()
    .isEmail()
    .withMessage('Електронна адреса записана невірно.');

  req.checkBody('password', 'Необхідно ввести пароль.')
    .notEmpty()
    .len(6, 12)
    .withMessage('Довжина паролю повинна бути від 6 до 12 символів(виключаючи пробіли).');

  req.checkBody('passConf', 'Паролі не співпадають.')
    .equals(password);

  if (phone) {
    req.checkBody('phone', 'Телефон записано у неправильному форматі.')
      .isPhone();
  }

  let errors = req.validationErrors() || [];
  req.app.db.models.User.findOne({
    username: username
  }, (err, user) => {
    if (err) {
      return res.status(500).send(err);
    }

    if (user) {
      errors.unshift({
        params: 'username',
        msg: 'Користвувача з таким ім’ям - ' + username + ' - уже зареєстровано у системі.',
        value: username
      });
    }

    if (errors && errors.length) {
      res.render('authorization/register', {
        errors: errors,
        firstname: firstname,
        fathersname: fathersname,
        lastname: lastname,
        position: position,
        email: email,
        phone: phone
      });
    } else {
      req.app.db.models.User.create({
        email: email,
        username: username,
        password: _createHash(password),
        firstname: firstname,
        lastname: lastname,
        fathersname: fathersname,
        position: position,
        phone: phone,
        teacher: null,
        role: 0
      }, (err, user) => {
        if (err) {
          return res.status(500).send(err);
        }

        req.app.db.models.Teacher.create({
          firstName: user.firstname,
          lastName: user.lastname,
          fathersName: user.fathersname,
          position: user.position,
          telephone: user.phone,
          user: user,
          reglaments: []
        }, (err, teacher) => {
          if (err) {
            return res.status(500).send(err);
          }

          user.teacher = teacher._id;
          user.save(function(err, user) {
            if (err) {
              return res.status(500).send(err);
            }

            passport.authenticate('local')(req, res, () => {
              res.redirect('/');
            });
          });

        });
      });
    }
  });
};

module.exports.logout = (req, res) => {
  console.log('logged out');

  req.logout();
  req.flash('success', 'До побачення!');
  res.redirect('/auth/login');
};

function _createHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
}

module.exports.setAdmin = function(req, res) {
  let user = req.body.user;
  let admin = (req.body.admin === 'true') ? 1 : 0;

  req.app.db.models.User.findOneAndUpdate({
    _id: user
  }, {
    $set: {
      role: admin
    }
  }, (err, user) => {
    if (err) {return res.status(500).send(err);}

    let teacher = user.teacher.toString();
    req.app.db.models.Teacher.update({
      _id: teacher
    }, {
      $set: {
        'user.role': admin
      }
    }, (err, result) => {
      if (err) {return res.status(500).send(err);}

      return res.sendStatus(200);
    });
  });
};

module.exports.resetPassword = function(req, res) {
  const body = req.body;
  const user = body.user;
  const password = body.password.trim().split(passwordSplitter).join('');
  const confirmation = body.passconf;

  req.app.db.models.User.findOne({
    _id: user
  }, (err, user) => {
    if (err) {return res.status(500).send(err);}

    req.checkBody('password', 'Необхідно ввести пароль.')
      .notEmpty()
      .len(6, 12)
      .withMessage('Довжина паролю повинна бути від 6 до 12 символів(виключаючи пробіли).');
    req.checkBody('passconf', 'Паролі не співпадають.')
      .equals(password);

    let errors = req.validationErrors();
    if (errors) {
      return res.render('teachers/fail_reset', {
        errors: errors
      });
    }

    user.password = req.app.db.models.User.encryptPassword(password);
    user.save((err, user) => {
      if (err) {return res.status(500).send(err);}

      return res.redirect('/teachers');
    });
  });
};