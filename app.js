var express = require('express');
//var config = require('./config');
var playsApp = require('radio-plays');
var logfmt = require("logfmt");
var app = express();

var plays = playsApp({
	source: 'Spinitron',
	spinitron: {
		station: process.env.SPIN_STATION,
		userid: process.env.SPIN_USERID,
		secret: process.env.SPIN_SECRET
	}
});

app.use(logfmt.requestLogger());

app.get('/nowplaying', function(req, res){
	res.send(plays.recentPlays(1)[0]);
});

app.get('/recentplays/:num', function(req, res){
	res.send(plays.recentPlays(Number(req.params.num)));
});

var port = Number(process.env.PORT || 3000);
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});
