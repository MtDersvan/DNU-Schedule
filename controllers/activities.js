'use strict';

const path = require('path');
const fs = require('fs');
const regSettings = require('../regsettings');
const models = require('../app').db.models;
const ObjectId = require('mongodb').ObjectId;
const excelbuilder = require('msexcel-builder');
const myUtils = require('../utils');

const {
  timeOrders,
  extendedOrders,
  jobTypes,
  weekDays
} = regSettings;

module.exports.edit = (req, res) => {
  let data = req.body;

  if (data) {
    let lessonId = data.lesson;
    let editedLesson = _createActivityFromData(data);

    models.Activity.update({
        _id: lessonId
      }, {
        $set: editedLesson
      })
      .then((result) => {
        let reglamentId = data.reglament;

        models.Reglament.findOne({
            _id: reglamentId,
          })
          .then((reglament) => {
            const activities = reglament.activity;
            const activity = activities.find((lesson) => (lesson.getId() === lessonId));

            for (let option in editedLesson) {
              if (editedLesson.hasOwnProperty(option)) {
                activity[option] = editedLesson[option];
              }
            }

            reglament.save().then((reglament) => {
                console.log('result', reglament);

                return res.sendStatus(res.statusCode);
              })
              .catch((err) => {
                return errorHandler(res, err);
              });
          })
          .catch((err) => {
            return errorHandler(res, err);
          });
      })
      .catch((err) => {
        return errorHandler(res, err);
      });
  }
};

module.exports.create = (req, res) => {
  let data = req.body;

  let teacherId = data.teacher;
  models.Teacher.findOne({
      _id: teacherId
    })
    .then((teacher) => {
      let reglamentId = data.reglament;
      models.Reglament.findOne({
          _id: reglamentId
        })
        .then((reglament) => {
          let newActivity = _createActivityFromData(data);
          newActivity.teacher = teacher._id;
          newActivity.reglament = reglament._id;


          models.Activity.create(newActivity)
            .then((lesson) => {
              reglament.activity.push(lesson);
              reglament.save()
                .then((reglament) => {
                  return res.sendStatus(res.statusCode);
                })
                .catch((err) => {
                  return errorHandler(res, err);
                });
            })
            .catch((err) => {
              return errorHandler(res, err);
            });
        });
    })
    .catch((err) => {
      return errorHandler(res, err);
    });
};

module.exports.remove = (req, res) => {
  let body = req.body;
  let lessonId = body.lesson;

  models.Activity.findByIdAndRemove(lessonId)
    .then((lesson) => {
      let reglamentId = body.reglament;
      models.Reglament.findOne({
          _id: reglamentId
        })
        .then((reglament) => {
          let reglamentActivity = reglament.activity;
          let lessonIndex = reglamentActivity.findIndex((item, index) => (item.getId() === lessonId));

          console.log(`lesson index: ${lessonIndex}`);
          reglamentActivity.splice(lessonIndex, 1);

          let _raLength = reglamentActivity.length;
          if (_raLength > 0) {
            return reglament.save()
              .then((reglament) => res.sendStatus(200));
          } else {
            return reglament.remove()
              .then((reglament) => res.sendStatus(200));
          }
        });
    })
    .catch((err) => {
      return errorHandler(res, err);
    });
};

function _createActivityFromData(data) {
  let type = data.type;
  let day = parseInt(data.day);
  let order = parseInt(data.order);
  let timeStart = parseInt(data.timeStart);
  let timeEnd = parseInt(data.timeEnd);
  let numerator = parseInt(data.numerator);
  let rate = (numerator === -1) ? 1 : 0.5;
  let duration = (timeEnd - timeStart) * rate;
  let _discipline = data.discipline;
  let discipline = _discipline.length > 0 ? _discipline : undefined;
  let place = data.place;
  let groups = data.groups;

  let activity = {
    day: day,
    order: order,
    timeStart: timeStart,
    timeEnd: timeEnd,
    duration: duration,
    numerator: numerator,
    type: type,
    groups: groups,
    place: place,
    discipline: discipline,
    rate: rate,
  };

  return activity;
}