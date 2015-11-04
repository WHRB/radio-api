var express = require('express');
var compress = require('compression');
var logfmt = require("logfmt");
var http = require('http');
var moment = require('moment');
var RadioPlays = require('radio-plays');
var ScheduleManager = require('schedule-data-fetch');
var streamManager = require('stream-data');

var createServer = function(port, callback) {

  var app = express();
  app.use(compress());

  RadioPlays.setSource("Spinitron", {
      station: process.env.SPIN_STATION,
      userid: process.env.SPIN_USERID,
      secret: process.env.SPIN_SECRET,
      cacheTime: Number(process.env.CACHE_TIME || 15)
  });

  // If module is cached with a source, clear it out.
  if (ScheduleManager.hasSource("show_schedule")) {
    ScheduleManager.removeSource("show_schedule");
  }

  ScheduleManager.addSource("Google", {
    calendarID: process.env.SCHEDULE_ID,
    apiKey: process.env.SCHEDULE_API_KEY,
    cacheTime: 60
  }, "show_schedule");

  var streams = streamManager({});

  app.use(logfmt.requestLogger());

  app.get('/nowplaying', function(req, res){

    RadioPlays.getCurrent(function (err, result) {
      if (err) {
        console.error(err);
        return res.jsonp([]);
      }

      return res.jsonp(result);
    });

  });

  app.get('/recentplays/:num', function(req, res){

    RadioPlays.recentPlays(Number(req.params.num), function (err, result) {
      if (err) {
        console.error(err);
        return res.jsonp([]);
      }

      return res.jsonp(result);
    });

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
