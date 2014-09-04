var express = require('express');
//var config = require('./config');
var playsApp = require('radio-plays');
var streamManager = require('stream-data');
var logfmt = require("logfmt");
var app = express();

var plays = playsApp({
	source: 'Spinitron',
	spinitron: {
		station: process.env.SPIN_STATION,
		userid: process.env.SPIN_USERID,
		secret: process.env.SPIN_SECRET
	},
	maxAge: Number(process.env.CACHE_TIME || 15000)
});

var streams = streamManager({});

app.use(logfmt.requestLogger());

app.get('/nowplaying', function(req, res){
	res.send(plays.recentPlays(1)[0]);
});

app.get('/recentplays/:num', function(req, res){
	res.send(plays.recentPlays(Number(req.params.num)));
});

app.get('/streams', function(req, res){
	res.send(streams.streams());
});

var port = Number(process.env.PORT || 3000);
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});
