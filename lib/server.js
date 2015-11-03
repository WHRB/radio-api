var express = require('express');
var compress = require('compression');
var logfmt = require("logfmt");
var http = require('http');
var moment = require('moment');
var playsApp = require('radio-plays');
var ScheduleManager = require('schedule-data-fetch');
var streamManager = require('stream-data');

var createServer = function(port, callback) {

  var app = express();
  app.use(compress());

  var plays = playsApp({
      source: 'Spinitron',
      spinitron: {
          station: process.env.SPIN_STATION,
          userid: process.env.SPIN_USERID,
          secret: process.env.SPIN_SECRET
      },
      maxAge: Number(process.env.CACHE_TIME || 15000)
  });

  ScheduleManager.addSource("Google", {
    calendarID: process.env.SCHEDULE_ID,
    apiKey: process.env.SCHEDULE_API_KEY,
    cacheTime: 60
  }, "show_schedule");

  var streams = streamManager({});

  app.use(logfmt.requestLogger());

  app.get('/nowplaying', function(req, res){

      var playData = plays.recentPlays(1);
      if (Array.isArray(playData) === true) {
        playData = playData[0];
      }
      res.jsonp(playData);
  });

  app.get('/recentplays/:num', function(req, res){
      res.jsonp(plays.recentPlays(Number(req.params.num)));
  });

  app.get('/streams', function(req, res){
      res.jsonp(streams.streams());
  });

  app.get('/schedule', function(req, res){
      ScheduleManager.getSchedule("show_schedule", { maxResults: 50 }, function (err, results) {
        if (err) {
          console.error(err);
          res.jsonp([]);
          return;
        }

        res.jsonp(results);
      });
  });

  return app.listen(port, callback);
};

module.exports = createServer;
