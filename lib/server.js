'use strict';

const express = require('express');
const compress = require('compression');
const logfmt = require('logfmt');
const RadioPlays = require('radio-plays');
const ScheduleManager = require('schedule-data-fetch');
const streamManager = require('stream-data');
const cors = require('cors');
require('./db');
const statsMiddleware = require('./streamStats');

const createServer = (port, callback) => {
  const app = express();
  app.use(cors());
  app.use(compress());

  RadioPlays.setSource('Spinitron', {
    station: process.env.SPIN_STATION,
    userid: process.env.SPIN_USERID,
    secret: process.env.SPIN_SECRET,
    cacheTime: Number(process.env.CACHE_TIME || 15),
  });

  // If module is cached with a source, clear it out.
  if (ScheduleManager.hasSource('show_schedule')) {
    ScheduleManager.removeSource('show_schedule');
  }

  ScheduleManager.addSource('Google', {
    calendarID: process.env.SCHEDULE_ID,
    apiKey: process.env.SCHEDULE_API_KEY,
    cacheTime: 60,
  }, 'show_schedule');

  const streams = streamManager({});

  app.use(logfmt.requestLogger());

  app.get('/nowplaying', (req, res) => {
    RadioPlays.getCurrent()
    .then(result => res.jsonp(result))
    .catch(err => {
      console.error(err);
      res.status(503).jsonp([]);
    });
  });

  app.get('/recentplays/:num', (req, res) => {
    RadioPlays.recentPlays(Number(req.params.num))
    .then(result => res.jsonp(result))
    .catch(err => {
      console.error(err);
      res.status(503).jsonp([]);
    });
  });

  app.get('/streams', (req, res) => {
    res.jsonp(streams.streams());
  });

  app.get('/schedule', (req, res) => {
    ScheduleManager.getSchedule('show_schedule', { maxResults: 50 }, (err, results) => {
      if (err) {
        console.error(err);
        res.jsonp([]);
        return;
      }

      res.jsonp(results);
    });
  });

  app.get('/stream-stats', statsMiddleware);

  return app.listen(port, callback);
};

module.exports = createServer;
