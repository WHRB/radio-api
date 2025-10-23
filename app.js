import makeServer from './lib/server.js';

const port = Number(process.env.PORT || 3000);

const server = makeServer(port, () => {
  console.log('Listening on port %d', server.address().port);
});
