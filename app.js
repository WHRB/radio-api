var express = require('express');
var config = require('./config');
var playsApp = require('../plays');
var app = express();
var plays = playsApp({
	source: 'Spinitron',
	spinitron: config.spinitron
});

app.get('/nowplaying', function(req, res){
	res.send(plays.nowPlaying());
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
	console.log(plays.nowPlaying());
});
