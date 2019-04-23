'use strict';

const express = require('express');
const compression = require('compression');
const logfmt = require('logfmt');
const RadioPlays = require('./radio-plays/plays');
const ScheduleManager = require('./schedule/scheduleManager');
const streamManager = require('./stream-data/stream-data');
const cors = require('cors');
const sse = require('./sse');

const createServer = (port, callback) => {
  const app = express();
  app.use(cors());
  app.use(compression());

  RadioPlays.setSource('SpinitronV2', {
    token: process.env.SPIN_V2_API_TOKEN,
    cacheTime: Number(process.env.CACHE_TIME || 10)
  });

  // If module is cached with a source, clear it out.
  if (ScheduleManager.hasSource('show_schedule')) {
    ScheduleManager.removeSource('show_schedule');
  }

  ScheduleManager.addSource(
    'Google',
    {
      calendarID: process.env.SCHEDULE_ID,
      apiKey: process.env.SCHEDULE_API_KEY,
      cacheTime: 60
    },
    'show_schedule'
  );

  const streams = streamManager({});

  app.use(logfmt.requestLogger());

  app.get('/', (req, res) => {
    res.json({ healthy: true });
  });

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
    ScheduleManager.getSchedule(
      'show_schedule',
      { maxResults: 50 },
      (err, results) => {
        if (err) {
          console.error(err);
          res.jsonp([]);
          return;
        }

        res.jsonp(results);
      }
    );
  });

  app.use('/sse', sse(RadioPlays));

  return app.listen(port, callback);
};

module.exports = createServer;
