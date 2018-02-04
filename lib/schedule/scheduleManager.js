"use strict";

var GoogleSource = require("./googleSource");

var exports = (module.exports = {});
var sourceTypes = ["Google"];
var sources = {};

exports.getSourceTypes = function() {
  return sourceTypes;
};

exports.addSource = function(sourceType, options, key) {
  if (sourceTypes.indexOf(sourceType) === -1) {
    throw new Error("SourceType not defined.");
  }

  if (sources.hasOwnProperty(key)) {
    throw new Error("Key already exists.");
  }

  if (sourceType === "Google") {
    sources[key] = new GoogleSource(options);
  }
};

exports.hasSource = function(key) {
  return sources.hasOwnProperty(key) && typeof sources[key] === "object";
};

exports.removeSource = function(key) {
  if (!sources.hasOwnProperty(key)) {
    throw new Error("Key does not exist.");
  }

  delete sources[key];
};

exports.getSchedule = function(key, options, callback) {
  if (!sources.hasOwnProperty(key)) {
    throw new Error("Key does not exist.");
  }

  sources[key].getEvents(options, callback);
};

exports.getCurrentEvent = function(key, callback) {
  if (!sources.hasOwnProperty(key)) {
    throw new Error("Key does not exist.");
  }

  sources[key].getCurrentEvent(callback);
};
