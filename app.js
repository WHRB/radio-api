var express = require('express');
var playsApp = require('radio-plays');
var streamManager = require('stream-data');
var logfmt = require("logfmt");
var app = express();
var http = require('http');
var moment = require('moment');

var plays = playsApp({
	source: 'Spinitron',
	spinitron: {
		station: process.env.SPIN_STATION,
		userid: process.env.SPIN_USERID,
		secret: process.env.SPIN_SECRET
	},
	maxAge: Number(process.env.CACHE_TIME || 15000)
});

var schedule = {};

var get_schedule = function() {
	var url = 'http://www.google.com/calendar/feeds/'
			  + process.env.SCHEDULE_ID
			  + '/public/full?orderby=starttime&sortorder=ascending'
			  + '&singleevents=true&futureevents=true&alt=json';
			  //+ '&start-min='+moment().format("YYYY-MM-DDTHH:mm:ssZ");
			  //console.log(url);
			  http.get(url, function(res) {
				var body = '';

				res.on('data', function(chunk) {
					body += chunk;
				});

				res.on('end', function() {
					var response = JSON.parse(body);
					schedule = response;
				});
			}).on('error', function(e) {
				  console.log("Got error: ", e);
			});
}

var streams = streamManager({});

app.use(logfmt.requestLogger());

app.get('/nowplaying', function(req, res){
	res.jsonp(plays.recentPlays(1)[0]);
});

app.get('/recentplays/:num', function(req, res){
	res.jsonp(plays.recentPlays(Number(req.params.num)));
});

app.get('/streams', function(req, res){
	res.jsonp(streams.streams());
});

app.get('/schedule', function(req, res){
	get_schedule();
	res.jsonp(schedule);
});

var port = Number(process.env.PORT || 3000);
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
    get_schedule();
});
