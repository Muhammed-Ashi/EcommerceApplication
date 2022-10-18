var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser=require("body-parser")
const MongoStore = require('connect-mongo');
//var Fileupload=require()
const passport = require('passport')

//const cookieParser = require("cookie-parser");
const sessions = require('express-session');
//const {engine} = require('express-handlebars');
const Razorpay = require('razorpay');

var db=require('./mongodb/configuration');
db.connect((err)=>{
  if (err){
    console.log("not connected"+err)
    
  }
  else {
    console.log(" worked ")
    console.log(__dirname);
  }
})


 const {engine} =require('express-handlebars');
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs',engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+
'/views/',partialsDir:__dirname+'/views/partials/'}))

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

// Database name present in the connection string will be used
app.use(sessions({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",

  store: MongoStore.create({ mongoUrl: 'mongodb://localhost/test-app' })
}));



app.use(express.static(__dirname+'/public')),
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

 app.use('/', usersRouter);
app.use('/admin', adminRouter); 


app.use(passport.initialize())
app.use(passport.session())



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
