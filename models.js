'use strict';

exports = module.exports = function(app, mongoose) {
  const activityScheme = require('./schema/Activity')(app, mongoose);
  require('./schema/Reglament')(app, mongoose, activityScheme);
  require('./schema/Group')(app, mongoose);
  require('./schema/Teacher')(app, mongoose);
  require('./schema/User')(app, mongoose);
};