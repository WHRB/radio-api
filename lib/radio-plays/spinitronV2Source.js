/* eslint no-underscore-dangle:off, no-param-reassign:off */

const NodeCache = require('node-cache');
const fetch = require('node-fetch');
const Promise = require('bluebird');
const md5 = require('md5');
const moment = require('moment-timezone');

const cache = new NodeCache();
const urlCache = new NodeCache({ useClones: false });
fetch.Promise = Promise;

const BASE_URL = 'https://spinitron.com/api';

const responseConverter = (entry) => {
  entry._links = undefined;

  const convertedData = {
    SongID: entry.id,
    PlaylistID: entry.playlist_id,
    ShowID: null,
    ArtistName: entry.artist,
    SongName: entry.song,
    SongNote: entry.note,
    ComposerName: entry.composer,
    DiskName: entry.release,
    DiskFormat: '',
    DiskType: '',
    DiskLocation: '',
    DiskReleased: entry.released,
    LabelName: entry.label,
    LabelWebsite: '',
    LabelCountry: '',
    LocalFlag: entry.local,
    RequestFlag: entry.request,
    NewFlag: entry.new,
  };

  return Object.assign(entry, convertedData);
};

const checkResponse = (res) => {
  if (!res.ok) {
    return res.text().then((text) => {
      console.log(text);
      return Promise.reject(new Error('API call failed'));
    });
  }
  return res.json();
};

module.exports = (options) => {
  if (!options.token) {
    throw new Error('Credentials must be supplied');
  }

  const cacheTTL = options.cacheTime ? options.cacheTime : 10;

  const fetchShow = (showID) => {
    const url = `${BASE_URL}/shows/${showID}`;

    const cachedPromise = urlCache.get(url);
    if (cachedPromise) {
      return cachedPromise;
    }

    console.log(`fetchShow ${url}`);

    const fetchPromise = fetch(url, {
      headers: {
        Authorization: `Bearer ${options.token}`,
      },
    })
      .then((res) => checkResponse(res))
      // Handle empty show responses
      .catch(() => ({ title: '' }));

    // cache fetch response for 1 minute
    urlCache.set(url, fetchPromise, 60);

    return fetchPromise;
  };

  const fetchPlaylist = (playlistId) => {
    const url = `${BASE_URL}/playlists/${playlistId}`;

    const cachedPromise = urlCache.get(url);
    if (cachedPromise) {
      return cachedPromise;
    }

    console.log(`fetchPlaylist ${url}`);

    const fetchPromise = fetch(url, {
      headers: {
        Authorization: `Bearer ${options.token}`,
      },
    }).then((res) => checkResponse(res));

    // cache fetch response for 1 minute
    urlCache.set(url, fetchPromise, 60);

    return fetchPromise;
  };

  const fetchPlays = (num) => {
    const url = `${BASE_URL}/spins`;

    const cacheKey = `${url}:${num}`;

    const cachedPromise = urlCache.get(cacheKey);
    if (cachedPromise) {
      return cachedPromise;
    }

    console.log(`fetchPlays ${cacheKey}`);

    const fetchPromise = fetch(url, {
      headers: {
        authorization: `Bearer ${options.token}`,
      },
    })
      .then((res) => checkResponse(res))
      .then((data) => {
        const { items } = data;
        if (items.length > num) {
          items.length = num;
        }
        return items;
      });

    // cache fetch response for 5 seconds
    urlCache.set(cacheKey, fetchPromise, 5);

    return fetchPromise;
  };

  const getPlays = (num) => {
    let plays = cache.get('spinitronPlays');

    if (plays && num <= plays.length) {
      console.log('cache hit');
      return Promise.resolve(plays.slice(0, num));
    }

    console.log('cache miss');

    return fetchPlays(num)
      .then((newPlays) => {
        plays = newPlays.map((play) => {
          const newPlay = responseConverter(play);
          const time = moment.tz(play.start, play.timezone);
          newPlay.isoTime = time.format();
          newPlay.Date = time.format('YYYY-MM-DD');
          newPlay.Timestamp = time.format('HH:mm:ss');
          newPlay.hash = md5(JSON.stringify(play));
          return newPlay;
        });

        return fetchPlaylist(plays[0].playlist_id);
      })
      .then((playlistData) => {
        playlistData._links = undefined;
        plays[0].PlaylistInfo = playlistData;

        if (!playlistData.show_id) {
          plays[0].ShowInfo = {
            ShowName: playlistData.title,
          };

          cache.set('spinitronPlays', plays, cacheTTL);

          return plays;
        }

        return fetchShow(playlistData.show_id).then((showData) => {
          showData._links = undefined;
          showData.ShowName = showData.title;
          plays[0].ShowInfo = showData;

          cache.set('spinitronPlays', plays, cacheTTL);

          return plays;
        });
      });
  };

  return {
    getMostCurrentPlay() {
      return getPlays(1).then((plays) => plays[0]);
    },
    getMostCurrentShowInfo() {
      return getPlays(1).then((plays) => plays[0].ShowInfo);
    },
    getRecent(num) {
      return getPlays(num);
    },
    flushCache() {
      cache.flushAll();
    },
  };
};
