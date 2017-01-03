'use strict';

module.exports.get = (req, res) => {
  const data = {
    title: 'Викладачі'
  };

  req.app.db.models.Teacher.find({}, (err, teachers) => {
    if (err) {return res.status(500).send(err);}

    data.teachers = teachers;

    if (res.locals.user.isAdmin()) {
      req.app.db.models.User.find({}, (err, users) => {
        if (err) {return res.status(500).send(err);}

        data.users = users;

        res.render('teachers', data);
      });
    } else {
      res.render('teachers', data);
    }
  });
};

module.exports.create = (req, res) => {
  const body = req.body;

  if (body) {
    const fieldsToSet = {
      firstName: body.firstName,
      lastName: body.lastName,
      fathersName: body.fathersName,
      position: body.position,
      telephone: body.telephone,
      reglaments: []
    };

    req.app.db.models.Teacher.create(fieldsToSet, (err, category) => {
      if (err) {return res.status(500).send(err);}

      res.redirect('/reglaments');
    });
  }
};

module.exports.edit = (req, res) => {
  const body = req.body;

  if (body) {
    req.app.db.models.Teacher.update({
      _id: body.teacher
    }, {
      $set: {
        firstName: body.firstName,
        lastName: body.lastName,
        fathersName: body.fathersName,
        position: body.position,
        telephone: body.telephone
      }
    }, (err, result) => {
      if (err) {return res.status(500).send(err);}

      res.sendStatus(200);
    });
  }
};

module.exports.remove = (req, res) => {
  const body = req.body;

  if (body) {
    req.app.db.models.Teacher.remove({
      _id: body.teacher
    }, (err, result) => {
      if (err) {return res.status(500).send(err);}

      req.app.db.models.Reglament.remove({
        teacherId: body.teacher
      }, (err) => {
        if (err) {return res.status(500).send(err);}

        res.sendSatus(200);
      });
    });
  }
};