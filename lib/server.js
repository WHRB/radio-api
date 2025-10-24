import express from 'express';
import compression from 'compression';
import cors from 'cors';
import logfmt from 'logfmt';
import SpinitronData from './radio-plays/spinitron-data';
import * as ScheduleManager from './schedule/schedule-manager.js';
import sse from './sse.js';

function validateIntParam(param, res) {
  const number = Number.parseInt(param, 10);
  if (Number.isNaN(number) || number <= 0) {
    res.status(400).json({ message: 'invalid param' });
    return null;
  }

  return number;
}

function createServer(port, callback) {
  const app = express();
  app.use(cors());
  app.use(compression());
  app.use(express.urlencoded());

  const spinitron = new SpinitronData(process.env.SPIN_V2_API_TOKEN);

  const refreshToken = process.env.REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error('REFRESH_TOKEN is required');
  }

  // If module is cached with a source, clear it out.
  if (ScheduleManager.hasSource('show_schedule')) {
    ScheduleManager.removeSource('show_schedule');
  }

  ScheduleManager.addSource(
    'Google',
    {
      calendarID: process.env.SCHEDULE_ID,
      apiKey: process.env.SCHEDULE_API_KEY,
      cacheTime: 60,
    },
    'show_schedule',
  );

  app.use(logfmt.requestLogger());

  app.get('/', (_, res) => {
    res.json({ healthy: true });
  });

  app.get('/nowplaying', async (_, res) => {
    const currentPlay = await spinitron.getLegacyPlays(1);
    res.json(currentPlay[0]);
  });

  app.get('/recentplays/:num', async (req, res) => {
    let num = validateIntParam(req.params.num, res);
    if (num === null) {
      return;
    }
    num = Math.min(num, 200);
    const plays = await spinitron.getLegacyPlays(num);
    res.json(plays);
  });

  app.get('/v2/plays/:num', async (req, res) => {
    let num = validateIntParam(req.params.num, res);
    if (num === null) {
      return;
    }
    num = Math.min(num, 200);
    const plays = await spinitron.getPlays(num);
    res.json(plays);
  });

  app.post('/v2/plays/refresh', async (req, res) => {
    // Need to pull token from body
    const token = req.body?.token ?? '';
    if (token !== refreshToken) {
      return res.status(403).json({ message: 'unauthorized' });
    }

    await spinitron.updatePlaysData();
    return res.json({ message: 'ok' });
  });

  app.get('/v2/shows/:showId', async (req, res) => {
    const show = await spinitron.getShow(Number(req.params.showId));
    res.json(show);
  });

  app.get('/v2/playlists/:playlistId', async (req, res) => {
    const playlist = await spinitron.getPlaylist(Number(req.params.playlistId));
    res.json(playlist);
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
      },
    );
  });

  const { router: sseRouter, cleanUp: sseCleanUp } = sse(spinitron);

  app.use('/sse', sseRouter);
  const server = app.listen(port, callback);

  const closeApp = () => {
    spinitron.haltWatch();
    sseCleanUp();
    server.close();
  };

  return closeApp;
}

export default createServer;
