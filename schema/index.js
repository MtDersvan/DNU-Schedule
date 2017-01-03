'use strict';

exports = module.exports = function(connection, mongoose) {
  let models = {};

  models.User = require('./User')(connection, mongoose);
  models.Teacher = require('./Teacher')(connection, mongoose, models.User.schema);
  models.Activity = require('./Activity')(connection, mongoose);
  models.Reglament = require('./Reglament')(connection, mongoose, models.Activity.schema);
  models.Group = require('./Group')(connection, mongoose);

  return models;
};