'use strict';

const pg = require('pg');
pg.defaults.ssl = (process.env.NODE_ENV === 'production');
const client = new pg.Client();

// connect to our database
client.connect(err => {
  if (err) {
    throw err;
  }

  console.log('Postgres Connected');
});

module.exports = client;
