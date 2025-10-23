import { expect } from 'chai';
import * as RadioPlays from '../lib/radio-plays/plays.js';

const token = 'this';

describe('RadioPlays', () => {
  describe('#setSource()', () => {
    it('should throw an error if source type is not defined', () => {
      expect(
        RadioPlays.setSource.bind(RadioPlays.setSource, 'foo', {})
      ).to.throw('SourceType not defined.');
    });

    it('should successfully set an available source', () => {
      expect(
        RadioPlays.setSource.bind(RadioPlays.setSource, 'SpinitronV2', {
          token,
        })
      ).to.be.ok;
    });
  });

  describe('#getCurrent()', () => {
    beforeEach(() => {
      RadioPlays.removeSource();
    });

    it("should throw an error if source hasn't been set", () => {
      expect(
        RadioPlays.getCurrent.bind(RadioPlays.getCurrent, () => {})
      ).to.throw('No source has been set.');
    });

    it('should delegate call to specified source');
  });

  describe('#recentPlays()', () => {
    beforeEach(() => {
      RadioPlays.removeSource();
    });

    it("should throw an error if source hasn't been set", () => {
      expect(
        RadioPlays.recentPlays.bind(RadioPlays.recentPlays, 5, () => {})
      ).to.throw('No source has been set.');
    });

    it('should delegate call to specified source');
  });
});
