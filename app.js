'use strict';

var makeServer = require('./lib/server');

var port = Number(process.env.PORT || 3000);

var server = makeServer(port, function() {
  console.log('Listening on port %d', server.address().port);
});
