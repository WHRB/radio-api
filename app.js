var express = require('express');
var spinClientMaker = require('../SpinPapi-JS-Client');
var config = require('./config');
var fs = require('fs');
var http = require('http');
var app = express();
var spinClient = spinClientMaker(config.spinitron.userid, config.spinitron.secret, config.spinitron.station);

app.get('/nowplaying', function(req, res){
	checkCacheAge('nowplaying.json');
	res.send(readCache('nowplaying.json'));
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
	updateNowPlaying();
});

var checkCacheAge = function(name) {
	fs.stat('cache/'+name, function(err, stats) {
		mtime = new Date(stats.mtime);
		diff = new Date() - mtime;
		if (diff > 30000) {
			updateNowPlaying();
		}
	});
}

var readCache = function(name) {
	var response = fs.readFileSync('cache/'+name, {encoding: 'utf8'});
	return JSON.parse(response);
}

var cacheFile = function(name, data) {
	fs.writeFile('cache/'+name, data, function (err) {
	  if (err) throw err;
	  console.log('Cache file '+name+' saved.');
	});
}

var updateNowPlaying = function() {
	var queryUrl = spinClient.getQuery({'method':'getSong'});
    http.get(queryUrl, function(res) {
		var body = '';

		res.on('data', function(chunk) {
			body += chunk;
		});

		res.on('end', function() {
			var response = body;
			cacheFile('nowplaying.json', response);
		});
	}).on('error', function(e) {
		  console.log("Got error: ", e);
	});
}
