'use strict';

const Promise = require('bluebird');
const pg = require('pg');
const query = require('pg-query');

pg.defaults.ssl = (process.env.NODE_ENV === 'production');

query.connectionParameters = process.env.DATABASE_URL;

pg.on('error', (err) => {
  console.error(err);
});

query('CREATE TABLE IF NOT EXISTS whrb_stats_v2(id SERIAL PRIMARY KEY, timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(), stats JSONB)');

module.exports = (queryString, params) => Promise.try(() => query(queryString, params));
