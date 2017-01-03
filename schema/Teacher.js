'use strict';

let util = require('util');

exports = module.exports = function(connection, mongoose, userSchema) {
	var Schema = mongoose.Schema,
		ObjectId = Schema.ObjectId;

  var teacherSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    fathersName: String,
    position: String,
    telephone: String,
    user: userSchema,
    reglaments: {
      type: [ObjectId]
    }
  });

  teacherSchema.methods.getFullName = function() {
    return (this.firstName + ' ' + this.fathersName + ' ' + this.lastName);
  };

  teacherSchema.methods.isUser = function(user) {
    return (user._id.toString() === this.user._id.toString());
  };

  teacherSchema.methods.getId = function() {
    return this._id.toString();
  };

  teacherSchema.methods.getInfo = function() {
    return util.format('%s %s %s, %s, %s', this.lastName, this.firstName, this.fathersName, this.position, this.telephone);
  };
  
  return connection.model('Teacher', teacherSchema);
};
