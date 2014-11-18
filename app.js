var express = require('express');
var playsApp = require('radio-plays');
var streamManager = require('stream-data');
var logfmt = require("logfmt");
var app = express();
var http = require('http');
var moment = require('moment');
var googleapis = require('googleapis');

var plays = playsApp({
	source: 'Spinitron',
	spinitron: {
		station: process.env.SPIN_STATION,
		userid: process.env.SPIN_USERID,
		secret: process.env.SPIN_SECRET
	},
	maxAge: Number(process.env.CACHE_TIME || 15000)
});

var OAuth2 = googleapis.auth.OAuth2;
var auth = new OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URL
);
googleapis.options({ auth: auth });
var calendar = googleapis.calendar('v3');

var schedule = {
	timestamp: 0,
	events: {},
	current: {},
	v3: {}
};

var google_tokens = null;

var isStale = function(timestamp) {
	diff = new Date() - timestamp;
	if (diff > 15000) {
		return true;
	}
	return false;
}

var processGCalV3 = function (response) {
	var events = response.items;
	var newEvents = [];
	var now = moment();
	for (i in events) {
		var e = {
			title: events[i].summary,
			content: '',
			startTime: events[i].start.dateTime,
			endTime: events[i].end.dateTime
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
		calendar.events.list({
			'calendarId': process.env.SCHEDULE_ID,
			'singleEvents': true,
			'orderBy': 'startTime'
			//'timeMin': schedule.timestamp
		}, function (err, response) {
			if (!err) {
				console.log(response);
				processGCalV3(response);
			} else {
				console.log("Got calendar error: ", err);
			}
		});
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

app.get('/api_auth', function(req, res){
	var url = auth.generateAuthUrl({
	  access_type: 'offline',
	  scope: process.env.GOOGLE_SCOPE
	});
	res.redirect(url);
});

app.get(process.env.GOOGLE_REDIRECT_PATH, function(req, res){
	auth.getToken(req.query.code, function(err, tokens) {
  		// Now tokens contains an access_token and an optional refresh_token. Save them.
		if(!err) {
			auth.setCredentials(tokens);
			google_tokens = tokens;
			res.redirect('/schedule');
		} else {
			// handle error
		}
	});
});

var port = Number(process.env.PORT || 3000);
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
    //get_schedule();
});
