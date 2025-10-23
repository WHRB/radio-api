import { expect } from 'chai';
import * as ScheduleManager from '../lib/schedule/scheduleManager.js';
import moment from 'moment';

if (
  !process.env.hasOwnProperty('SCHEDULE_ID') ||
  !process.env.hasOwnProperty('SCHEDULE_API_KEY')
) {
  await import('../testenv.js');
}

const googleCalendarID = process.env.SCHEDULE_ID;
const googleAPIKey = process.env.SCHEDULE_API_KEY;

// TODO: Test bad inputs

describe('ScheduleManager', function () {
  describe('#getSourceTypes()', function () {
    it('should return an array with available source types', function () {
      const results = ScheduleManager.getSourceTypes();
      expect(Array.isArray(results)).to.equal(true);
      expect(results.length).to.be.above(0);
    });
  });

  describe('#addSource()', function () {
    it('should throw an error if source type is not defined', function () {
      expect(
        ScheduleManager.addSource.bind(
          ScheduleManager.addSource,
          'foo',
          {},
          'bar'
        )
      ).to.throw('SourceType not defined.');
    });

    it('should successfully add available source to sources', function () {
      expect(
        ScheduleManager.addSource.bind(
          ScheduleManager.addSource,
          'Google',
          {
            calendarID: googleCalendarID,
            apiKey: googleAPIKey,
          },
          'testSource'
        )
      ).to.not.throw(Error);
    });

    it('should throw an error if calendar key already exists', function () {
      ScheduleManager.addSource(
        'Google',
        {
          calendarID: googleCalendarID,
          apiKey: googleAPIKey,
        },
        'testDupe'
      );

      expect(
        ScheduleManager.addSource.bind(
          ScheduleManager.addSource,
          'Google',
          {
            calendarID: googleCalendarID,
            apiKey: googleAPIKey,
          },
          'testDupe'
        )
      ).to.throw('Key already exists.');
    });

    it('should successfully add a source with the same key as a previously deleted source', function () {
      ScheduleManager.addSource(
        'Google',
        {
          calendarID: googleCalendarID,
          apiKey: googleAPIKey,
        },
        'testSource2'
      );

      ScheduleManager.removeSource('testSource2');

      expect(
        ScheduleManager.addSource.bind(
          ScheduleManager.addSource,
          'Google',
          {
            calendarID: googleCalendarID,
            apiKey: googleAPIKey,
          },
          'testSource2'
        )
      ).to.not.throw(Error);
    });

    after(function () {
      ScheduleManager.removeSource('testSource');
      ScheduleManager.removeSource('testDupe');
    });
  });

  describe('#removeSource()', function () {
    it('should throw an error if key does not exist', function () {
      expect(
        ScheduleManager.removeSource.bind(
          ScheduleManager.removeSource,
          'badKey'
        )
      ).to.throw('Key does not exist.');
    });
  });

  describe('#hasSource()', function () {
    it('should return whether or not a source exists', function () {
      expect(ScheduleManager.hasSource('non-existent-source')).to.be.false;

      ScheduleManager.addSource(
        'Google',
        {
          calendarID: googleCalendarID,
          apiKey: googleAPIKey,
        },
        'non-existent-source'
      );

      expect(ScheduleManager.hasSource('non-existent-source')).to.be.true;
    });

    after(function () {
      ScheduleManager.removeSource('non-existent-source');
    });
  });

  ScheduleManager.addSource(
    'Google',
    {
      calendarID: googleCalendarID,
      apiKey: googleAPIKey,
      cacheTime: 10,
    },
    'shows'
  );

  describe('#getSchedule()', function () {
    it('should throw an error if key does not exist', function () {
      expect(
        ScheduleManager.getSchedule.bind(
          ScheduleManager.getSchedule,
          'badKey',
          {},
          null
        )
      ).to.throw('Key does not exist.');
    });

    it('should return the specified number of upcoming schedule events (inclusive)', function (done) {
      ScheduleManager.getSchedule(
        'shows',
        {
          maxResults: 10,
        },
        function (err, results) {
          const first = results[0];
          const endMoment = moment(first.endTime);
          const now = moment();

          expect(results.length).to.equal(10);
          expect(now.isBefore(endMoment)).to.be.true;
          done();
        }
      );
    });
  });

  describe('#getCurrentEvent()', function () {
    it('should throw an error if key does not exist', function () {
      expect(
        ScheduleManager.getCurrentEvent.bind(
          ScheduleManager.getCurrentEvent,
          'badKey',
          null
        )
      ).to.throw('Key does not exist.');
    });

    it('should return the closest item to the current time', function (done) {
      ScheduleManager.getCurrentEvent('shows', function (err, result) {
        const endMoment = moment(result.endTime);
        const now = moment();
        expect(now.isBefore(endMoment)).to.be.true;
        done();
      });
    });
  });
});
