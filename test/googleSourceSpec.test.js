import { expect } from 'chai';
import googleSource from '../lib/schedule/googleSource.js';
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

describe('GoogleSource', function () {
  it('should throw an error if calendar ID is not specified', function () {
    expect(googleSource.bind(googleSource, {})).to.throw(
      'Calendar ID must be supplied'
    );
    expect(
      googleSource.bind(googleSource, {
        calendarID: '',
      })
    ).to.throw('Calendar ID must be supplied');
  });

  it('should throw an error if an API key is not specified', function () {
    expect(
      googleSource.bind(googleSource, {
        calendarID: 1,
      })
    ).to.throw('API key must be supplied');
    expect(
      googleSource.bind(googleSource, {
        calendarID: 1,
        apiKey: '',
      })
    ).to.throw('API key must be supplied');
  });

  const source = googleSource({
    // Get keys from environment
    calendarID: googleCalendarID,
    apiKey: googleAPIKey,
  });

  describe('#getCurrentEvent()', function () {
    it('should return closest event to current time', function (done) {
      source.getCurrentEvent(function (err, result) {
        var endMoment = moment(result.endTime);
        var now = moment();
        expect(now.isBefore(endMoment)).to.be.true;

        done();
      });
    });
  });

  describe('#getEvents()', function () {
    it('should return an array of events', function (done) {
      source.getEvents({ maxResults: 25 }, function (err, results) {
        if (err) {
          throw err;
        }

        expect(Array.isArray(results)).to.be.true;
        expect(results.length).to.be.above(0);
        done();
      });
    });

    it('should return an array of events of the specified length', function (done) {
      source.getEvents(
        {
          maxResults: 1,
        },
        function (err, results) {
          if (err) {
            throw err;
          }
          expect(results.length).to.equal(1);
          done();
        }
      );
    });

    it('should return an array of events of the specified length', function (done) {
      source.getEvents(
        {
          maxResults: 10,
        },
        function (err, results) {
          if (err) {
            throw err;
          }
          expect(results.length).to.equal(10);
          done();
        }
      );
    });

    it('should return an array of event objects with the properties: title, content, startTime, and endTime', function (done) {
      source.getEvents(
        {
          maxResults: 10,
        },
        function (err, results) {
          if (err) {
            throw err;
          }

          for (let i = 0; i < results.length; i++) {
            expect(results[i]).to.have.property('title');
            expect(results[i]).to.have.property('content');
            expect(results[i]).to.have.property('startTime');
            expect(results[i]).to.have.property('endTime');
          }

          done();
        }
      );
    });
  });
});
