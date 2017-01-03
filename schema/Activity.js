'use strict';

exports = module.exports = function(connection, mongoose) {
  var ObjectId = mongoose.Schema.ObjectId;

  var activitySchema = new mongoose.Schema({
    day: Number, //+
    order: Number, //+
    timeStart: Number, //+
    timeEnd: Number, //+
    numerator: Number, // +
    type: String, // +
    groups: [String], // +
    place: String, // +
    discipline: String, //+ 
    duration: Number, // +
    rate: Number, // +
    teacher: ObjectId,
    reglament: ObjectId
  });

  activitySchema.virtual('getDuration').get(function() {
    return (this.timeEnd - this.timeStart) * this.rate * 10;
  });

  activitySchema.methods.getGroups = function() {
    var len = this.groups.length,
      result = '';
    for (var i = 0; i < len; i++) {
      result += this.groups[i];
      if (i < len - 1) {
        result += ',\n';
      }
    }

    return result.trim();
  };

  activitySchema.methods.getId = function() {
    return this._id.toString();
  };

  activitySchema.methods.copy = function() {
    return {
      id: this.getId(),
      day: this.day,
      order: this.order,
      timeStart: this.timeStart,
      timeEnd: this.timeEnd,
      duration: this.duration, 
      numerator: this.numerator, 
      type: this.type, 
      groups: this.groups.concat(), 
      place: this.place, 
      rate: this.rate, 
      discipline: this.discipline 
    };
  };

  return connection.model('Activity', activitySchema);
};