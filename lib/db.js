'use strict';

const pg = require('pg');
pg.defaults.ssl = (process.env.NODE_ENV === 'production');
const client = new pg.Client(process.env.DATABASE_URL);

// connect to our database
client.connect(err => {
  if (err) {
    throw err;
  }

  console.log('Postgres Connected');
  client.query(`CREATE TABLE IF NOT EXISTS whrb_stats
  (
    id bigserial,
    server_name text,
    server_type text,
    listeners integer,
    "timestamp" timestamp with time zone DEFAULT now(),
    PRIMARY KEY(id)
  )`, err2 => {
    if (err2) {
      console.error(err2);
    } else {
      console.log('Table initialized');
    }
  });
});

module.exports = client;
