var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var indexController = require('./controllers/index.js');

mongoose.connect('mongodb://localhost/feed');

var app = express();
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}));


indexController.serverStartTest();


app.get('/', indexController.index);

var server = app.listen(7162, function() {
	console.log('Express server listening on port ' + server.address().port);
});
