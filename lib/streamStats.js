'use strict';

const Promise = require('bluebird');
const fetch = require('node-fetch');
const _ = require('lodash');
const ms = require('ms');
const moment = require('moment');
const NodeCache = require('node-cache');
const query = require('./db');

fetch.Promise = Promise;

const responseCache = new NodeCache({ stdTTL: 180 });

if (process.env.ICECAST_STATUS_URL) {
  const fetchStreamStats = () => fetch(process.env.ICECAST_STATUS_URL)
  .then(res => {
    if (!res.ok) {
      return Promise.reject(new Error(`Could not fetch stream status. Response code ${res.status}`));
    }

    return res.json();
  })
  .then(json => _.get(json, 'icestats.source'))
  .map(source => {
    if (source) {
      return query(
        'INSERT INTO whrb_stats(server_name, server_type, listeners) VALUES($1, $2, $3)',
        [source.server_name, source.server_type, source.listeners]
      );
    }

    return null;
  })
  .catch(err => console.error('Error fetching stream stats', err));

  // set up periodic fetching of stream stats;
  fetchStreamStats();
  setInterval(fetchStreamStats, ms(process.env.STATS_INTERVAL || '5m'));
}

// middleware for fetching stream stats
module.exports = (req, res) => {
  const cached = responseCache.get('stats');
  if (cached) {
    console.log('returning cached value');
    return res.json(cached);
  }

  return query('SELECT server_name, server_type, listeners, timestamp FROM whrb_stats ORDER BY timestamp ASC')
  .spread((rows, result, error) => {
    if (error) {
      return Promise.reject(error);
    }

    const results = {};
    const total = {};

    rows.forEach(entry => {
      if (!results.hasOwnProperty(entry.server_name)) {
        results[entry.server_name] = [];
      }
      results[entry.server_name].push(entry);

      const time = moment(entry.timestamp).format('YYYY-MM-DD HH:mm:ss');
      if (!total.hasOwnProperty(time)) {
        total[time] = {
          timestamp: entry.timestamp,
          listeners: entry.listeners,
        };
      } else {
        total[time].listeners += entry.listeners;
      }
    });

    results.Total = _.values(total);
    responseCache.set('stats', results);
    return res.json(results);
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ message: 'error getting stream stats' });
  });
};
