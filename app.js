var express = require('express');
//var config = require('./config');
var playsApp = require('radio-plays');
var app = express();

var plays = playsApp({
	source: 'Spinitron',
	spinitron: {
		station: process.env.SPIN_STATION,
		userid: process.env.SPIN_USERID,
		secret: process.env.SPIN_SECRET
	}
});

app.get('/nowplaying', function(req, res){
	res.send(plays.nowPlaying());
});

app.get('/tenmostrecent', function(req, res){
	res.send(plays.tenMostRecent());
});

var port = Number(process.env.PORT || 3000);
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
	plays.nowPlaying();
	plays.tenMostRecent();
});
