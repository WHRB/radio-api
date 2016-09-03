'use strict';

const fetch = require('node-fetch');
const Promise = require('bluebird');
const _ = require('lodash');
const ms = require('ms');

fetch.Promise = Promise;

const db = require('./db');

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
      return db.query(
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
  db.query('SELECT server_name, server_type, listeners, timestamp FROM whrb_stats ORDER BY timestamp DESC', (err, result) => {
    if (err) {
      res.status(500).json(err);
    }

    const results = {};
    result.rows.forEach(entry => {
      if (!results.hasOwnProperty(entry.server_name)) {
        results[entry.server_name] = [];
      }
      results[entry.server_name].push(entry);
    });

    res.json(results);
  });
};
