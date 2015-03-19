var express = require('express');
var playsApp = require('radio-plays');
var streamManager = require('stream-data');
var logfmt = require("logfmt");
var app = express();
var http = require('http');
var moment = require('moment');
var googleapis = require('googleapis');
var pg = require('pg');
var google_tokens = null;

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
    current: {}
};

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

var saveTokens = function (tokens) {
	// Save tokens to database
	pg.connect(process.env.DATABASE_URL, function(err, client) {
		if(err) {
			return console.error('could not connect to postgres', err);
		}

		client.query('TRUNCATE TABLE tokens', function(err, result) {
			if(err) {
				return console.error('error truncating token table', err);
			}
			client.query('INSERT INTO tokens (ACCESS, REFRESH) VALUES($1, $2)',
			[tokens.access_token, tokens.refresh_token], function(err, result) {
				if(err) {
					return console.error('error saving tokens', err);
				}
				client.end();
			});
		});

	});
}

var getSchedule = function() {
    if (isStale(schedule.timestamp)) {
        console.log('Fetching new calendar');
        schedule.timestamp = new Date();
        // make call to api
        calendar.events.list({
            'calendarId': process.env.SCHEDULE_ID,
            'singleEvents': true,
            'orderBy': 'startTime',
            'timeMin': schedule.timestamp.toISOString()
        }, function (err, response) {
            if (err) {
            	auth.refreshAccessToken(function(err, tokens) {
				    // your access_token is now refreshed and stored in oauth2Client
				    if (err) {
				  	  console.log("Error refreshing tokens: ", err);
				  	  return;
				    }
				    saveTokens(tokens);
				});
                console.log("Got calendar error: ", err);
                return;
            }
            processGCalV3(response);
        });
    }
}

var streams = streamManager({});

app.use(logfmt.requestLogger());

pg.connect(process.env.DATABASE_URL, function(err, client) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  client.query('CREATE TABLE IF NOT EXISTS tokens (\
      ID SERIAL PRIMARY KEY,\
      REFRESH TEXT NOT NULL,\
      ACCESS TEXT NOT NULL)', function(err, result) {
      if(err) {
          return console.error('error running query', err);
      }
      client.query('SELECT * FROM tokens', function(err, result) {
          if(err) {
            return console.error('error running token query', err);
          }
          if (result.rows.length > 0) {
              google_tokens = {
                  access_token: result.rows[0].access,
                  refresh_token: result.rows[0].refresh
              }
              auth.setCredentials(google_tokens);
              getSchedule();
          }
          client.end();
      });
  });
});


app.get('/nowplaying', function(req, res){

    res.jsonp(plays.recentPlays(1));
});

app.get('/recentplays/:num', function(req, res){

    res.jsonp(plays.recentPlays(Number(req.params.num)));

});

app.get('/streams', function(req, res){
    res.jsonp(streams.streams());
});

app.get('/schedule', function(req, res){
    getSchedule();
    res.jsonp(schedule);
});

// Authenticate with google.
app.get('/api_auth', function(req, res){
    if (google_tokens == null) {
        var url = auth.generateAuthUrl({
          access_type: 'offline',
          approval_prompt: 'force',
          scope: process.env.GOOGLE_SCOPE
        });
        res.redirect(url);
    } else {
        // We've already authenticated.
        res.redirect('/schedule');
    }
});

app.get(process.env.GOOGLE_REDIRECT_PATH, function(req, res){
    auth.getToken(req.query.code, function(err, tokens) {

        if(!err) {
            auth.setCredentials(tokens);
            google_tokens = tokens;
			saveTokens(tokens);
            res.redirect('/schedule');
        } else {
            console.error('error getting auth tokens', err);
        }
    });
});

var port = Number(process.env.PORT || 3000);
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});
