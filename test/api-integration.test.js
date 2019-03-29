'use strict';

const { expect } = require('chai');
const makeServer = require('../lib/server');
const request = require('superagent');

if (
  !process.env.SPIN_V2_API_TOKEN ||
  !process.env.SCHEDULE_ID ||
  !process.env.SCHEDULE_API_KEY
) {
  require('../testenv.js'); // eslint-disable-line
}

describe('Integration Tests', function() {
  let app;
  beforeEach(function() {
    app = makeServer(3000);
  });

  afterEach(function() {
    app.close();
  });

  describe('/schedule', function() {
    it('should return valid schedule events', async function() {
      const res = await request('http://localhost:3000/schedule');

      expect(res.status).to.equal(200);

      const scheduleData = res.body;

      const first = scheduleData[0];

      expect(scheduleData.length).to.be.above(0);
      expect(first).to.have.property('title');
      expect(first).to.have.property('startTime');
      expect(first).to.have.property('endTime');
    });
  });

  describe('/nowplaying', function() {
    it('should return current playing song data', async function() {
      const res = await request('http://localhost:3000/nowplaying');

      expect(res.status).to.equal(200);
      const songData = res.body;

      expect(songData).to.be.an('object');
      expect(songData).to.have.property('SongName');
      expect(songData).to.have.property('ShowInfo');
    });
  });

  describe('/recentplays', function() {
    it('should return the specified number of recently played songs', async function() {
      const res = await request('http://localhost:3000/recentplays/3');

      expect(res.status).to.equal(200);
      const songData = res.body;

      expect(songData.length).to.equal(3);
      expect(songData[0]).to.have.property('SongName');
      expect(songData[0]).to.have.property('ShowInfo');
    });
  });

  describe('/streams', function() {
    it('should return a list of available audio streams');
  });
});
