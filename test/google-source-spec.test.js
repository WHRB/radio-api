import dotenv from 'dotenv';
import googleSource from '../lib/schedule/google-source.js';
import moment from 'moment';

dotenv.config();

const googleCalendarID = process.env.SCHEDULE_ID;
const googleAPIKey = process.env.SCHEDULE_API_KEY;

// TODO: Test bad inputs

describe('GoogleSource', function () {
  it('should throw an error if calendar ID is not specified', function () {
    expect(googleSource.bind(googleSource, {})).toThrow(
      'Calendar ID must be supplied',
    );
    expect(
      googleSource.bind(googleSource, {
        calendarID: '',
      }),
    ).toThrow('Calendar ID must be supplied');
  });

  it('should throw an error if an API key is not specified', function () {
    expect(
      googleSource.bind(googleSource, {
        calendarID: 1,
      }),
    ).toThrow('API key must be supplied');
    expect(
      googleSource.bind(googleSource, {
        calendarID: 1,
        apiKey: '',
      }),
    ).toThrow('API key must be supplied');
  });

  const source = googleSource({
    // Get keys from environment
    calendarID: googleCalendarID,
    apiKey: googleAPIKey,
  });

  describe('#getCurrentEvent()', function () {
    it('should return closest event to current time', function () {
      return new Promise((resolve, reject) => {
        source.getCurrentEvent(function (err, result) {
          if (err) {
            reject(err);
            return;
          }
          var endMoment = moment(result.endTime);
          var now = moment();
          expect(now.isBefore(endMoment)).toBe(true);
          resolve();
        });
      });
    });
  });

  describe('#getEvents()', function () {
    it('should return an array of events', function () {
      return new Promise((resolve, reject) => {
        source.getEvents({ maxResults: 25 }, function (err, results) {
          if (err) {
            reject(err);
            return;
          }

          expect(Array.isArray(results)).toBe(true);
          expect(results.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('should return an array of events of the specified length', function () {
      return new Promise((resolve, reject) => {
        source.getEvents(
          {
            maxResults: 1,
          },
          function (err, results) {
            if (err) {
              reject(err);
              return;
            }
            expect(results.length).toBe(1);
            resolve();
          },
        );
      });
    });

    it('should return an array of events with maxResults of 10', function () {
      return new Promise((resolve, reject) => {
        source.getEvents(
          {
            maxResults: 10,
          },
          function (err, results) {
            if (err) {
              reject(err);
              return;
            }
            expect(results.length).toBe(10);
            resolve();
          },
        );
      });
    });

    it('should return an array of event objects with the properties: title, content, startTime, and endTime', function () {
      return new Promise((resolve, reject) => {
        source.getEvents(
          {
            maxResults: 10,
          },
          function (err, results) {
            if (err) {
              reject(err);
              return;
            }

            for (const result of results) {
              expect(result).toHaveProperty('title');
              expect(result).toHaveProperty('content');
              expect(result).toHaveProperty('startTime');
              expect(result).toHaveProperty('endTime');
            }

            resolve();
          },
        );
      });
    });
  });
});
