'use strict';

exports = module.exports = function(connection, mongoose, activitySchema) {
  var reglamentSchema = new mongoose.Schema({
    teacherId: String,
    year: Number,
    semester: Number,
    activity: [activitySchema],
    openLesson: String
  });

  reglamentSchema.methods.getId = function() {
    return this._id.toString();
  };

  reglamentSchema.methods.removeReglament = function() {
    let models = connection.models;

    return new Promise((res, rej) => {
      this.remove()
        .then((reglament) => {
          let teacherId = reglament.teacherId;
          models.Teacher.findOne({
              _id: teacherId
            })
            .then((teacher) => {
              let reglaments = teacher.reglaments;
              let regOi = reglament._id;
              let regIndex = reglaments.findIndex((reglament) => (reglament.equals(regOi)));
              reglaments.splice(regIndex, 1);

              teacher.save()
                .then((teacher) => {
                  let activities = reglament.activity.map((lesson) => lesson.getId());

                  models.Activity.remove({
                      _id: {
                        $in: activities
                      }
                    })
                    .then((activities) => {
                      return res(reglament);
                    })
                    .catch((err) => {
                      return rej(err);
                    });
                })
                .catch((err) => {
                  return rej(err);
                });
            })
            .catch((err) => {
              return rej(err);
            });
        })
        .catch((err) => {
          return rej(err);
        });
    });
  };

  return connection.model('Reglament', reglamentSchema);
};