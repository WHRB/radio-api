"use strict";

delete require.cache[require.resolve("../lib/radio-plays/plays")];

const expect = require("chai").expect;
const RadioPlays = require("../lib/radio-plays/plays");

const userid = "this";
const secret = "is a";
const station = "test";

describe("RadioPlays", () => {
  describe("#setSource()", () => {
    it("should throw an error if source type is not defined", () => {
      expect(
        RadioPlays.setSource.bind(RadioPlays.setSource, "foo", {})
      ).to.throw("SourceType not defined.");
    });

    it("should successfully set an available source", () => {
      expect(
        RadioPlays.setSource.bind(RadioPlays.setSource, "Spinitron", {
          userid,
          secret,
          station
        })
      ).to.be.ok;
    });
  });

  describe("#getCurrent()", () => {
    it("should throw an error if source hasn't been set", () => {
      expect(
        RadioPlays.getCurrent.bind(RadioPlays.getCurrent, () => {})
      ).to.throw("No source has been set.");
    });

    it("should delegate call to specified source");
  });

  describe("#recentPlays()", () => {
    it("should throw an error if source hasn't been set", () => {
      expect(
        RadioPlays.recentPlays.bind(RadioPlays.recentPlays, 5, () => {})
      ).to.throw("No source has been set.");
    });

    it("should delegate call to specified source");
  });
});
