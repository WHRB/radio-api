/* eslint-env mocha */

'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised').default;
const nock = require('nock');

chai.use(chaiAsPromised);
const expect = chai.expect;
const spinitronSource = require('../lib/radio-plays/spinitronSource');

const userid = 'this';
const secret = 'is a';
const station = 'test';

const testSongs = [
  { SongName: 'testSong', ShowID: '123' },
  { SongName: 'testSong2', ShowID: '123' },
  { SongName: 'testSong3', ShowID: '123' },
  { SongName: 'testSong4', ShowID: '123' },
  { SongName: 'testSong5', ShowID: '456' },
];
const testShow = { ShowName: 'testShow', ShowID: '123' };

beforeEach(() => {
  nock('http://spinitron.com')
    .get('/public/spinpapi.php')
    .query(true)
    .reply(200, {
      success: true,
      results: testSongs,
    });

  nock('http://spinitron.com')
    .get('/public/spinpapi.php')
    .query(true)
    .reply(200, {
      success: true,
      results: testShow,
    });
});

afterEach(() => {
  nock.cleanAll();
});

describe('spinitronSource', () => {
  it('should throw an error if userid, secret, and station are not specified', () => {
    expect(spinitronSource.bind(spinitronSource, {})).to.throw(
      'Credentials must be supplied'
    );
    expect(spinitronSource.bind(spinitronSource, { userid: 'foo' })).to.throw(
      'Credentials must be supplied'
    );
    expect(spinitronSource.bind(spinitronSource, { secret: 'bar' })).to.throw(
      'Credentials must be supplied'
    );
    expect(spinitronSource.bind(spinitronSource, { station: 'baz' })).to.throw(
      'Credentials must be supplied'
    );
    expect(
      spinitronSource.bind(spinitronSource, {
        userid: '',
        secret: '',
        station: '',
      })
    ).to.throw('Credentials must be supplied');
  });

  describe('#getMostCurrentPlay()', () => {
    let source;

    before(() => {
      source = spinitronSource({
        // Get keys from environment
        userid,
        secret,
        station,
      });
    });

    afterEach(() => {
      source.flushCache();
    });

    it('should return an object with play data', () =>
      expect(source.getMostCurrentPlay()).to.eventually.have.property(
        'SongName',
        'testSong'
      ));

    it('should return an object with show info', () =>
      expect(source.getMostCurrentPlay()).to.eventually.have.property(
        'ShowInfo'
      ));

    it('should reject with an error if Spinitron API is unavailable', () => {
      nock.cleanAll();
      nock('http://spinitron.com').get('/public/spinpapi.php').reply(500);
      return expect(source.getMostCurrentPlay()).to.eventually.be.rejected;
    });
  });

  describe('#getMostCurrentShowInfo()', () => {
    let source;

    before(() => {
      source = spinitronSource({
        userid,
        secret,
        station,
      });
    });

    afterEach(() => {
      source.flushCache();
    });

    it('should return an object with current show data', () =>
      expect(source.getMostCurrentShowInfo()).to.eventually.deep.equal(
        testShow
      ));
  });

  describe('#getRecent()', () => {
    let source;

    before(() => {
      source = spinitronSource({
        userid,
        secret,
        station,
      });
    });

    afterEach(() => {
      source.flushCache();
    });

    it('should return an array', () =>
      expect(source.getRecent(5)).to.eventually.be.instanceof(Array));
  });
});
