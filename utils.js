'use strict';

/**
 * @param {number} time - time in minutes
 */
const convertTime = (time) => {
    var hours = parseInt(time / 60),
        minutes = parseInt(time % 60),
        converted = '';

    if (hours > 0) {
        converted += (hours + 'год. ');
    }

    if (minutes > 0) {
        converted += (minutes + 'хв.');
    }

    return (converted === '') ? '0 год.' : converted;
};

module.exports.convertTime = convertTime;