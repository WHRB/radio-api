"use strict";

const spinitronClientFactory = require("./spinpapi");
const NodeCache = require("node-cache");
const fetch = require("node-fetch");
const Promise = require("bluebird");
const md5 = require("md5");
const moment = require("moment-timezone");

const cache = new NodeCache();
fetch.Promise = Promise;

const checkResponse = res => {
  if (!res.ok) {
    throw new Error("API call failed");
  }
  return res.json().then(json => {
    if (!json.hasOwnProperty("success") || !json.success) {
      throw new Error("API call failed");
    }
    return json;
  });
};

module.exports = options => {
  if (
    !options.hasOwnProperty("userid") ||
    !options.userid ||
    (!options.hasOwnProperty("secret") || !options.secret) ||
    (!options.hasOwnProperty("station") || !options.station)
  ) {
    throw new Error("Credentials must be supplied");
  }

  const spinitron = spinitronClientFactory(
    options.userid,
    options.secret,
    options.station
  );
  const cacheTTL = options.hasOwnProperty("cacheTime") ? options.cacheTime : 10;

  const fetchShow = showID => {
    const url = spinitron.getQuery({
      method: "getShowInfo",
      ShowID: showID
    });

    return fetch(url)
      .then(res => checkResponse(res))
      .then(data => data.results);
  };

  const fetchPlays = num => {
    const url = spinitron.getQuery({
      method: "getSongs",
      Num: num
    });

    return fetch(url)
      .then(res => checkResponse(res))
      .then(data => data.results);
  };

  const getPlays = num => {
    let plays = cache.get("spinitronPlays");

    if (plays && num <= plays.length) {
      return Promise.resolve(plays.slice(0, num));
    }

    return fetchPlays(num).then(newPlays => {
      plays = newPlays.map(play => {
        const newPlay = play;
        newPlay.isoTime = moment
          .tz(`${play.Date} ${play.Timestamp}`, "America/New_York")
          .format();
        newPlay.hash = md5(JSON.stringify(play));
        return newPlay;
      });

      return fetchShow(plays[0].ShowID).then(showInfo => {
        plays[0].ShowInfo = showInfo;
        cache.set("spinitronPlays", plays, cacheTTL);
        return plays;
      });
    });
  };

  return {
    getMostCurrentPlay() {
      return getPlays(1).then(plays => plays[0]);
    },
    getMostCurrentShowInfo() {
      return getPlays(1).then(plays => plays[0].ShowInfo);
    },
    getRecent(num) {
      return getPlays(num);
    },
    flushCache() {
      cache.flushAll();
    }
  };
};
