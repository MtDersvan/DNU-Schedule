'use strict';

const path = require('path');
const fs = require('fs');
const regSettings = require('../regsettings');
const models = require('../app').db.models;
const ObjectId = require('mongodb').ObjectId;
const buildXLSXWorkbook = require('./xlsxReglamentBuilder');
const myUtils = require('../utils');

const {
  timeOrders,
  extendedOrders,
  jobTypes,
  weekDays
} = regSettings;

module.exports.remove = (req, res) => {
  let body = req.body;
  let reglamentId = body.reglament;

  models.Reglament.findOne({
      _id: reglamentId
    })
    .then((reglament) => reglament.removeReglament()
      .then(reglament => res.sendStatus(res.statusCode)))
    .catch((err) => {
      return errorHandler(res, err);
    });
};

function valueToArray(value, numberOfLessons) {
  if (numberOfLessons === 1) {
    return [value];
  }

  return value;
}

module.exports.create = (req, res) => {
  let body = req.body;

  let newActivities = [];
  let teacher, semester, year, openLesson;
  let numberOfLessons = parseInt(body.numberOfLessons);
  let days = valueToArray(body.days, numberOfLessons);
  let orders = valueToArray(body.orders, numberOfLessons);
  let timesStart = valueToArray(body.timeStart, numberOfLessons);
  let timesEnd = valueToArray(body.timeEnd, numberOfLessons);
  let numerators = valueToArray(body.numerator, numberOfLessons);
  let types = valueToArray(body.type, numberOfLessons);
  let groupsNumbers = valueToArray(body['groups-number'], numberOfLessons);
  let disciplines = valueToArray(body.discipline, numberOfLessons);
  let places = valueToArray(body.place, numberOfLessons);
  let groups = body.groups;
  if (groups) {
    if ('string' === typeof groups) {
      groups = [groups];
    }
  } else {
    groups = [];
  }

  teacher = body.teacher;
  semester = parseInt(body.semester);
  year = parseInt(body.year);
  openLesson = body.openlesson;

  for (let i = 0; i < numberOfLessons; i++) {
    let numerator = parseInt(numerators[i]);
    let timeStart = parseInt(timesStart[i]);
    let timeEnd = parseInt(timesEnd[i]);
    let day = parseInt(days[i]);
    let order = parseInt(orders[i]);
    let rate = (numerator === -1) ? 1 : 0.5;
    let duration = (timeEnd - timeStart) * rate;
    let groupsNumber = parseInt(groupsNumbers[i]);
    let discipline = (disciplines[i] !== '') ? disciplines[i] : undefined;
    let localGroups = groups.splice(0, groupsNumber);
    let type = types[i];

    let newActivity = {
      day: day,
      order: order,
      timeStart: timeStart,
      timeEnd: timeEnd,
      numerator: numerator,
      duration: duration,
      type: type,
      groups: localGroups.length ? localGroups : undefined,
      place: places[i],
      rate: rate,
      discipline: discipline,
      teacher: teacher
    };

    newActivities.push(newActivity);
  }

  models.Activity.create(newActivities)
    .then(activities => {
      models.Teacher.findOne({
          _id: teacher
        })
        .then(teacher => {
          let teacherId = teacher._id.toString();
          let reglament = {
            teacherId,
            semester,
            year,
            openLesson,
            activity: activities
          };

          models.Reglament.create(reglament)
            .then(reglament => {
              teacher.reglaments.push(reglament);
              teacher.save()
                .then(teacher => res.redirect('/reglaments/' + year + '/' + semester));
            });
        });
    });
};

function errorHandler(res, err) {
  console.error('ERROR:', err);

  return res.status(res.statusCode || 500).send(err);
}

module.exports.addTeacher = (req, res) => {
  let body = req.body;

  let newTeacher = {
    firstName: body.firstName,
    lastName: body.lastName,
    fathersName: body.fathersName,
    position: body.position,
    telephone: body.telephone
  };

  models.Teacher.create(newTeacher)
    .then((teacher) => res.redirect('/teachers'))
    .catch(err => errorHandler(res, err));
};

function blockActivity(initial, total) {
  for (let i = 0, len = total.length; i < len; i++) {
    let lesson = total[i];
    let aId = lesson.id;
    lesson.isBlocked = false;
    let inInitial = false;
    for (let j = 0, ilen = initial.length; j < ilen; j++) {
      let iaId = initial[j].getId();
      if (aId === iaId) {
        inInitial = true;
      }
    }

    if (!inInitial) {
      total[i].isBlocked = true;
    }
  }

  return total;
}

function parseTeacherReglaments(initialReglaments) {
  // console.log(initialReglaments);
  let reglaments = [];
  let totalActivity = [];
  let reglamentsLength = initialReglaments.length;

  for (let i = 0; i < reglamentsLength; i++) {
    totalActivity = totalActivity.concat(initialReglaments[i].activity);
  }

  totalActivity.sort((a, b) => a.day - b.day);

  for (let i = 0; i < reglamentsLength; i++) {
    reglaments.push({});
    let activity = reglaments[i].activity = [];
    for (let j = 0, taLen = totalActivity.length; j < taLen; j++) {
      activity.push(totalActivity[j].copy());
    }
  }

  for (let i = 0; i < reglamentsLength; i++) {
    let initialReglament = initialReglaments[i];
    let initialActivities = initialReglament.activity;
    let reglament = reglaments[i];
    let activity = reglament.activity;
    reglament.openLesson = initialReglament.openLesson;
    reglament.id = initialReglament.getId();

    reglament.activity = blockActivity(initialActivities, activity);

    let filteredActivity = filterReglamentActivity(reglaments[i].activity);
    // console.log(filteredActivity);
    reglament.days = filteredActivity;
    delete reglament.activity;
  }

  // console.log(reglaments);
  return reglaments;
}

function filterReglamentActivity(_activities) {
  let numberOfLessons = timeOrders.length;
  let activities = _activities.concat();
  let activity = [];

  // console.log(activities);
  for (let i = 0, len = weekDays.length; i < len; i++) {
    activity.push({});
    let dayState = activity[i];
    let dayInfo = dayState.info = {};
    let lessons = dayState.lessons = [];
    dayInfo.day = i;
    dayInfo.duration = 0;
    dayInfo.rate = 0;

    for (let j = 0; j < numberOfLessons; j++) {
      lessons.push([]);
    }
  }

  // console.log(activities.length);

  for (let i = 0, len = activities.length; i < len; i++) {
    let lesson = activities[i];
    let day = lesson.day;
    let order = lesson.order;
    let lessons = activity[day].lessons[order];
    let info = activity[day].info;

    if (!lesson.isBlocked) {
      let duration = lesson.duration;
      let rate = lesson.rate;
      info.duration += duration;
      info.rate += Math.round(duration * 10 / 60 / 36 * 100) / 100;
    }

    if (!lessons.length) {
      lessons.push(lesson);
    } else {
      let existedLessonNumerator = lessons[0].numerator;
      if (existedLessonNumerator === 0) {
        lessons.push(lesson);
      } else {
        lessons.unshift(lesson);
      }
    }

    // console.log(lesson.isBlocked);
  }
  // console.log(activity);

  return activity;
}


exports.get = function(req, res, next) {
  let query = setQuery(req, res, next);

  if (!query) {
    return;
  }

  const {
    year,
    semester
  } = query;

  req.app.db.models.Reglament.find(query)
    .then((reglaments) => {
      let teachersWorkplan = {};
      for (let i = 0, len = reglaments.length; i < len; i++) {
        let reglament = reglaments[i];
        let teacher = reglament.teacherId;
        let teacherWorkplan = teachersWorkplan[teacher];

        if (!teacherWorkplan) {
          teachersWorkplan[teacher] = {
            reglaments: [reglament]
          };
        } else {
          teacherWorkplan.reglaments.push(reglament);
        }
      }

      return teachersWorkplan;
    })
    .then(function(teachersWorkplan) {
      let reglamentsData = [];
      let teachers = [];
      for (let teacherId in teachersWorkplan) {
        if (teacherId) {
          let teacher = teachersWorkplan[teacherId];
          if (teacher) {
            let teacherReglaments = parseTeacherReglaments(teacher.reglaments);
            teachers.push(teacherId);
            reglamentsData.push({
              teacher: teacherId,
              reglaments: teacherReglaments
            });
          }
        }
      }
      // console.log(teachers);
      req.app.db.models.Teacher.find({
          _id: {
            $in: teachers
          }
        })
        .then((teachers) => {
          // console.log(teachers);
          for (let i = 0, len = reglamentsData.length; i < len; i++) {
            let _rg = reglamentsData[i];
            let _tId = _rg.teacher;
            for (let j = 0, tLen = teachers.length; j < tLen; j++) {
              let tId = teachers[j].getId();
              if (_tId === tId) {
                _rg.teacher = teachers[i];
              }
            }

            let reglaments = _rg.reglaments;
            for (let j = 0, rLen = reglaments.length; j < rLen; j++) {
              let reglament = reglaments[j];
              let info = reglament.info = {};
              info.id = reglament.id;
              delete reglament.id;
              let days = reglament.days;
              let rate = 0;
              let workDayDuration = [];
              let totalDuration = 0;
              for (let k = 0, aLen = days.length; k < aLen; k++) {
                let dayInfo = days[k].info;
                let duration = dayInfo.duration;

                rate += dayInfo.rate;
                totalDuration += duration;
                workDayDuration.push(myUtils.convertTime(duration * 10));
              }

              // console.log('rate', rate);
              info.rate = rate.toFixed(2);
              info.duration = workDayDuration;
              info.totalDuration = myUtils.convertTime(totalDuration * 10);
            }
          }

          reglamentsData.sort((a, b) => {
            let aName = a.teacher.lastName;
            let bName = b.teacher.lastName;

            if (aName > bName) {
              return 1;
            } else if (aName < bName) {
              return -1;
            }

            return 0;
          });

          return reglamentsData;
        })
        .then((reglamentsData) => {
          return res.render('reglament', {
            year: year,
            semester: semester,
            data: reglamentsData
          });
        })
        .catch((err) => {
          return errorHandler(res, err);
        });
    })
    .catch((err) => {
      return errorHandler(res, err);
    });
};

function setQuery(req, res) {
  let query = {
    year: res.locals.currentYear,
    semester: 1
  };
  let params = req.params;
  let locals = res.locals;
  let year = parseInt(params.year);
  let semester = parseInt(params.semester);


  let month = new Date(Date.now()).getMonth();
  if (month <= 6) {
    query.year = query.year - 1;
    query.semester = 2;
  }

  if (!year || !params.semester ||
    (year < locals.startYear) ||
    (year > locals.currentYear)) {
    res.redirect('/reglaments/' + query.year + '/' + query.semester);
  } else {
    query.year = year;
    query.semester = semester;

    return query;
  }

  return false;
}

function setFullNames(teachers) {
  teachers.forEach(function(teacher) {
    teacher.fullName = teacher.lastName + ' ' + teacher.firstName + ' ' + teacher.fathersName;
  });
}

exports.getNew = (req, res) => {
  const {
    locals
  } = res;
  let query = {};
  let {
    currentYear,
    startYear,
    user
  } = locals;

  if (user && !user.isAdmin()) {
    query._id = user.teacher.toString();
  }

  if (req.query.teacher) {
    query._id = req.query.teacher;
  }

  req.app.db.models.Teacher.find(query)
    .then((teachers) => {
      setFullNames(teachers);

      let positions = {};
      for (let i = 0, tCount = teachers.length; i < tCount; i++) {
        positions[teachers[i]._id] = teachers[i].position;
      }

      let teacher = teachers[0],
        daysActivity = [],
        reglamentsId = [];

      if (!user.isAdmin()) {
        user.teacherInfo = teacher;
      }

      daysActivity.openLesson = '';
      for (let dayIndex = 0; dayIndex < weekDays.length; dayIndex++) {
        daysActivity.push([]);
        for (let orderIndex = 0; orderIndex < timeOrders.length; orderIndex++) {
          daysActivity[dayIndex].push({
            dayOfWeek: weekDays[dayIndex],
            order: orderIndex,
            lessons: []
          });
        }
      }

      if (teacher) {
        let reglaments = teacher.reglaments;

        for (let i = 0, rl = reglaments.length; i < rl; i++) {
          reglamentsId.push(reglaments[i].toString());
        }
      }

      let k = 0,
        reglamentQuery = {
          _id: {
            $in: reglamentsId
          },
          semester: 1,
          year: currentYear
        };

      if (req.query.year) {
        reglamentQuery.year = req.query.year;
      }

      if (req.query.semester) {
        reglamentQuery.semester = req.query.semester;
      }

      req.app.db.models.Reglament.find(reglamentQuery)
        .then((reglaments) => {

          if (reglaments) {
            for (let i = 0; i < reglaments.length; i++) {
              let reglament = reglaments[i];
              let activity = reglament.activity;
              for (let activityIndex = 0, len = activity.length; activityIndex < len; activityIndex++) {
                let lesson = activity[activityIndex];
                for (let day = 0, wLen = weekDays.length; day < wLen; day++) {

                  for (let order = 0; order < timeOrders.length; order++) {
                    let dayLessons = daysActivity[day][order].lessons;
                    if (lesson.day === day && lesson.order == order) {
                      dayLessons.push(lesson);
                    }

                    if (dayLessons.length == 2) {
                      dayLessons.sort((a, b) => (a.numerator - b.numerator));
                    }
                  }
                }
              }
            }

            if (!req.xhr) {
              res.render('reglament/new', {
                title: 'Новий регламент',
                teachers: teachers,
                positions: positions,
                daysActivity: daysActivity,
              });
            } else {
              res.json({
                activity: daysActivity
              });
            }
          } else {
            res.redirect('/');
          }
        });
    });
};

module.exports.saveAsXLSL = function(req, res) {
  const {
    params
  } = req;
  const year = parseInt(params.year);
  const semester = parseInt(params.semester);
  const {
    basePath
  } = res.locals;
  const filepath = path.resolve(basePath, 'public', 'files');
  const filename = `reglament${year}y${semester}s.xlsx`;
  const data = {
    year,
    semester,
    filepath,
    filename
  };


  models.Reglament.find({
    year: year,
    semester: semester
  }, function(err, reglaments) {
    if (err) {
      return res.status(500).send(err);
    }

    const teachersIds = reglaments.map(reglament => reglament.teacherId.toString()).filter((id, index, ids) => (ids.indexOf(id) === index));

    req.app.db.models.Teacher.find({
      _id: {
        $in: teachersIds
      }
    }, function(err, teachers) {
      if (err) {
        return res.status(500).send(err);
      }

      const workplans = data.workplans = [];

      reglaments.forEach(reglament => {
        const teacherId = reglament.teacherId.toString();
        const teacher = teachers.find(teacher => teacher._id.toString() === teacherId);
        const newWorkPlan = {
          teacher,
          reglament
        };

        workplans.push(newWorkPlan);
      });

      const workbook = buildXLSXWorkbook(data);

      fs.stat(filepath, (err, stats) => {
        if (err) {
          fs.mkdirSync(PATH);
        }

        workbook.save((err) => {
          if (err) {
            return errorHandler(res, err);
          }
          const fileLocation = `/files/${filename}`;

          return res.redirect(fileLocation);
        });
      });
    });
  });
};

module.exports.editOpenTopic = function(req, res) {
  const {
    body
  } = req;
  const {
    reglament,
    openLesson
  } = body;

  req.app.db.models.Reglament.update({
    _id: reglament
  }, {
    $set: {
      openLesson
    }
  }, function(err, result) {
    if (err) {
      return res.send(err);
    }

    res.sendStatus(res.statusCode);
  });
};