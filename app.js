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

var schedule = {
	timestamp: 0,
	events: {},
	current: {}
};

var isStale = function(timestamp) {
	diff = new Date() - timestamp;
	if (diff > 15000) {
		return true;
	}
	return false;
}

var processGCalV2 = function (response) {
	var events = response.feed.entry;
	var newEvents = [];
	var now = moment();
	for (i in events) {
		var e = {
			title: events[i].title.$t,
			content: events[i].content.$t,
			startTime: events[i].gd$when[0].startTime,
			endTime: events[i].gd$when[0].endTime
		}

		var startMoment = moment(e.startTime);
		var endMoment = moment(e.endTime);

		if (startMoment.isBefore(now) && now.isBefore(endMoment)) {
			schedule.current = e;
		}
		newEvents.push(e);
	}
	schedule.events = newEvents;
	schedule.timestamp = new Date();
}

var get_schedule = function() {
	if (isStale(schedule.timestamp)) {
		console.log('Fetching new calendar');

		schedule.events = [];
		schedule.timestamp = new Date();
		// TODO implement google calendar api v3
		/*
		var url = 'http://www.google.com/calendar/feeds/'
				  + process.env.SCHEDULE_ID
				  + '/public/full?orderby=starttime&sortorder=ascending'
				  + '&singleevents=true&futureevents=true&alt=json';
				  //+ encodeURI('&start-min='+moment().format("YYYY-MM-DDTHH:mm:ssZ"));
				  //console.log(url);
		http.get(url, function(res) {
			var body = '';

			res.on('data', function(chunk) {
				body += chunk;
			});

			res.on('end', function() {
				processGCalV2(JSON.parse(body));

			});
		}).on('error', function(e) {
			  console.log("Got error: ", e);
		});
		*/
	}
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
