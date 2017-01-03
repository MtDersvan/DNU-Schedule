'use strict';

//dependencies
var config = require('./config'),
  express = require('express'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  session = require('express-session'),
  mongoStore = require('connect-mongo')(session),
  http = require('http'),
  path = require('path'),
  passport = require('passport'),
  mongoose = require('mongoose'),
  helmet = require('helmet'),
  csrf = require('csurf'),
  flash = require('connect-flash'),
  expressValidator = require('express-validator'),
  reglamentSettings = require('./regsettings');

//create express app
let app = express();

exports = module.exports = app;

app.env = {
  NODE_ENV: 'development'
};

//keep reference to config
app.config = config;
app.regSettings = reglamentSettings;

//setup the web server
app.server = http.createServer(app);

//setup mongoose
let connection = mongoose.createConnection(config.mongodb.uri);
app.db = connection;
app.db.on('error', function(err) {
  console.log('Mongoose connection error: ' + err);
});
app.db.once('open', function() {
  //and... we have a data store
});

var models = require('./schema')(connection, mongoose);

//settings
app.disable('x-powered-by');
app.set('port', config.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
app.use(require('morgan')('dev'));
app.use(require('compression')());
// app.use(require('serve-static')(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use(require('method-override')());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieParser(config.cryptoKey));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.cryptoKey,
  store: new mongoStore({
    url: config.mongodb.uri
  })
}));
app.use(flash());
app.use(function(req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
    var namespace = param.split('.'),
      root = namespace.shift(),
      formParam = root;

    while (namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }

    return {
      param: formParam,
      msg: msg,
      value: value
    };
  },
  customValidators: {
    isPhone: function(value) {
      return true;
    },
    notBlank: function(value) {
      return (value.trim().length > 0);
    }
  }
}));

// app.use(csrf({ cookie: { signed: true } }));
helmet(app);

//response locals
// app.use(function(req, res, next) {
//   res.cookie('_csrfToken', req.csrfToken());
//   res.locals.user = {};
//   res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
//   res.locals.user.username = req.user && req.user.username;
//   next();
// });

//global locals
app.locals.projectName = app.config.projectName;
app.locals.copyrightYear = new Date().getFullYear();
app.locals.copyrightName = app.config.companyName;
app.locals.cacheBreaker = 'br34k-01';

require('./passport')(app, passport);

app.get('*', (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.startYear = app.regSettings.startYear;
  res.locals.currentYear = app.regSettings.getCurrentYear();
  res.locals.basePath = __dirname;

  next();
});

//setup routes
require('./routes')(app, passport);

//custom (friendly) error handler
app.use(require('./controllers/common').http500);

//setup utilities
app.utility = {};

//listen up
const port = app.config.port || process.env.PORT || 3000;
app.server.listen(port, () => {
  //and... we're live
  console.log(`Server is listening on port: ${port}`);
});

process.on('uncaughtException', (param) => {
  console.log(param);
  app.server.close();
});

process.on('SIGTERM', (param) => {
  console.log(param);
  app.server.close();
});