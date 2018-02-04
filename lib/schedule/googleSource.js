"use strict";

const request = require("request");

module.exports = function(options) {
  if (!options.hasOwnProperty("calendarID") || !options.calendarID) {
    throw new Error("Calendar ID must be supplied");
  }

  if (!options.hasOwnProperty("apiKey") || !options.apiKey) {
    throw new Error("API key must be supplied");
  }

  var baseURL =
    "https://www.googleapis.com/calendar/v3/calendars/" +
    options.calendarID +
    "/events?key=" +
    options.apiKey +
    "&orderBy=startTime&singleEvents=true";

  var cacheTime = options.hasOwnProperty("cacheTime")
    ? options.cacheTime * 1000
    : 10000;
  var lastUpdated = 0;
  var cachedResult = null;

  var isStale = function() {
    return Date.now() - lastUpdated > cacheTime ? true : false;
  };

  var mapEventObject = function(googleEvent) {
    var newEvent = {
      title: googleEvent.summary,
      content: "",
      startTime: googleEvent.start.dateTime,
      endTime: googleEvent.end.dateTime
    };

    return newEvent;
  };

  var fetchEvents = function(options, callback) {
    var maxResults = options.hasOwnProperty("maxResults")
      ? options.maxResults
      : 0;
    var currentTime = new Date();

    var formattedURL = baseURL;
    if (maxResults > 0) {
      formattedURL += "&maxResults=" + options.maxResults;
    }

    formattedURL += "&timeMin=" + currentTime.toISOString();

    request(formattedURL, function(error, response, body) {
      if (error) {
        callback(error, []);
        return;
      }

      const data = JSON.parse(body);

      const processedData = [];

      if (!data.items) {
        console.log("bad response from google", data);
        callback(null, processedData);
        return;
      }

      for (let i = 0; i < data.items.length; i++) {
        processedData.push(mapEventObject(data.items[i]));
      }

      cachedResult = processedData;
      lastUpdated = Date.now();
      callback(null, processedData);
      return;
    });
  };

  var getEvents = function(options, callback) {
    var maxResults = options.hasOwnProperty("maxResults")
      ? options.maxResults
      : 0;

    // first time or cache does not have all events requested.
    if (cachedResult === null || maxResults > cachedResult.length) {
      fetchEvents(options, callback);
      return;
    }

    if (isStale()) {
      // If stale we should fetch the new events asynchronously.
      fetchEvents(options, function(err, result) {});
    }

    if (!Array.isArray(cachedResult)) {
      callback(new Error("Invalid Cached Result", []));
    }

    var newResult;
    if (maxResults > 0) {
      newResult = cachedResult.slice(0, maxResults);
    }

    callback(null, newResult);
    return;
  };

  var getCurrentEvent = function(callback) {
    getEvents(
      {
        maxResults: 1
      },
      function(err, results) {
        if (err) {
          callback(err, {});
          return;
        }

        callback(null, results[0]);
        return;
      }
    );
  };

  return {
    getEvents: getEvents,
    getCurrentEvent: getCurrentEvent
  };
};
