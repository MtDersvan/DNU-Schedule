'use strict';

exports.port = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV;

let dbURI;
if (NODE_ENV === 'dev') {
  dbURI = 'mongodb://localhost:27017/reglament';
} else if (NODE_ENV === 'prod') {
  dbURI = 'mongodb://malcolm:123456@ds047682.mlab.com:47682/reglament';
}

exports.mongodb = {
  uri: dbURI
};

exports.companyName = 'Develops';
exports.projectName = 'Reglament';
exports.systemEmail = 'fhtcom@gmail.com';
exports.cryptoKey = 'k3yb0ardc4t';
exports.loginAttempts = {
  forIp: 50,
  forIpAndUser: 7,
  logExpiration: '20m'
};
exports.requireAccountVerification = false;
exports.smtp = {
  from: {
    name: process.env.SMTP_FROM_NAME || exports.projectName + ' Website',
    address: process.env.SMTP_FROM_ADDRESS || 'fhtcom@gmail.com'
  },
  credentials: {
    user: process.env.SMTP_USERNAME || 'fhtcom@gmail.com',
    password: process.env.SMTP_PASSWORD || 'bl4rg!',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    ssl: true
  }
};