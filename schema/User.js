'use strict';

var bcrypt = require('bcrypt');

exports = module.exports = function(connection, mongoose) {
  var ObjectId = mongoose.Schema.ObjectId;

  var userSchema = new mongoose.Schema({
    email: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    username: {
      type: String,
      required: true,
      index: true
    },
    password: {
      type: String,
      required: true
    },
    firstname: {
      type: String,
      required: true
    },
    lastname: {
      type: String,
      required: true,
    },
    fathersname: {
      type: String,
      required: true
    },
    position: {
      type: String,
      required: true
    },
    phone: String,
    role: {
      type: Number,
      required: true
    },
    teacher: ObjectId
  });

  userSchema.statics.encryptPassword = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  };

  userSchema.statics.isValidPassword = function(password, user) {
    return bcrypt.compareSync(password, user.password);
  };
  
  userSchema.methods.fullName = function() {
    return (this.firstname + ' ' + this.fathersname + ' ' + this.lastname);
  };

  userSchema.methods.isAdmin = function() {
    return (this.role === 1);
  };

  userSchema.methods.isTeacher = function(teacher) {
    var id = (typeof teacher === 'string') ? teacher : teacher._id.toString();

    return (this.teacher.toString() === id);
  };

  userSchema.methods.isCurrentUser = function(user) {
    return (this._id.toString() === user._id.toString());
  };

  return connection.model('User', userSchema);
};