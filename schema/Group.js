'use strict';

var uniqueValidator = require('mongoose-unique-validator');

exports = module.exports = function(connection, mongoose) {
	var groupSchema = new mongoose.Schema({
		name: {
			type: String,
			unique: true,
			index: true,
			trim: true,
			validate: {
				validator: function(value) {
					return (value !== '');
				},
				message: 'Group name couldn\'t be empty!'
			}
		}
	});
	groupSchema.plugin(uniqueValidator);

	return connection.model('Group', groupSchema);
};