import dotenv from 'dotenv';
import makeServer from '../lib/server.js';
import request from 'superagent';

dotenv.config();

describe('Integration Tests', function () {
  let closeApp;
  beforeEach(function () {
    closeApp = makeServer(3000);
  });

  afterEach(function () {
    closeApp();
  });

  describe('/schedule', function () {
    it('should return valid schedule events', async function () {
      const res = await request('http://localhost:3000/schedule');

      expect(res.status).toBe(200);

      const scheduleData = res.body;

      const first = scheduleData[0];

      expect(scheduleData.length).toBeGreaterThan(0);
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('startTime');
      expect(first).toHaveProperty('endTime');
    });
  });

  describe('/nowplaying', function () {
    it('should return current playing song data', async function () {
      const res = await request('http://localhost:3000/nowplaying');

      expect(res.status).toBe(200);
      const songData = res.body;

      expect(typeof songData).toBe('object');
      expect(songData).toHaveProperty('SongName');
      expect(songData).toHaveProperty('ShowInfo');
    });
  });

  describe('/recentplays', function () {
    it('should return the specified number of recently played songs', async function () {
      const res = await request('http://localhost:3000/recentplays/3');

      expect(res.status).toBe(200);
      const songData = res.body;

      expect(songData.length).toBe(3);
      expect(songData[0]).toHaveProperty('SongName');
      expect(songData[0]).toHaveProperty('ShowInfo');
    });
  });
});
