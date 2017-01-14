'use strict';

const Promise = require('bluebird');
const fetch = require('node-fetch');
const ms = require('ms');
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
  .then(json => query(
      'INSERT INTO whrb_stats_v2(stats) VALUES($1)',
      [json.icestats]
    )
  )
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

  return query('SELECT timestamp, stats FROM whrb_stats_v2 WHERE timestamp > current_date - interval \'8 days\' ORDER BY timestamp ASC')
  .spread((rows, result, error) => {
    if (error) {
      return Promise.reject(error);
    }

    const results = {
      Total: [],
    };

    rows.forEach(entry => {
      let total = 0;

      entry.stats.source.forEach(statsRecord => {
        total += statsRecord.listeners;
        if (!Array.isArray(results[statsRecord.server_name])) {
          results[statsRecord.server_name] = [];
        }

        const item = { timestamp: entry.timestamp, listeners: statsRecord.listeners };
        results[statsRecord.server_name].push(item);
      });

      results.Total.push({ timestamp: entry.timestamp, listeners: total });
    });

    responseCache.set('stats', results);
    return res.json(results);
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ message: 'error getting stream stats' });
  });
};
