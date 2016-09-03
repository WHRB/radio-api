'use strict';

const Promise = require('bluebird');

const pg = require('pg');
pg.defaults.ssl = (process.env.NODE_ENV === 'production');

const query = require('pg-query');
query.connectionParameters = process.env.DATABASE_URL;

pg.on('error', err => {
  console.error(err);
});

module.exports = (queryString, params) => Promise.try(() => query(queryString, params));
