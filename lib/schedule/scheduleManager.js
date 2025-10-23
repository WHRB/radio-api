import GoogleSource from './googleSource.js';

const sourceTypes = ['Google'];
const sources = {};

export const getSourceTypes = function () {
  return sourceTypes;
};

export const addSource = function (sourceType, options, key) {
  if (sourceTypes.indexOf(sourceType) === -1) {
    throw new Error('SourceType not defined.');
  }

  if (sources.hasOwnProperty(key)) {
    throw new Error('Key already exists.');
  }

  if (sourceType === 'Google') {
    sources[key] = new GoogleSource(options);
  }
};

export const hasSource = function (key) {
  return sources.hasOwnProperty(key) && typeof sources[key] === 'object';
};

export const removeSource = function (key) {
  if (!sources.hasOwnProperty(key)) {
    throw new Error('Key does not exist.');
  }

  delete sources[key];
};

export const getSchedule = function (key, options, callback) {
  if (!sources.hasOwnProperty(key)) {
    throw new Error('Key does not exist.');
  }

  sources[key].getEvents(options, callback);
};

export const getCurrentEvent = function (key, callback) {
  if (!sources.hasOwnProperty(key)) {
    throw new Error('Key does not exist.');
  }

  sources[key].getCurrentEvent(callback);
};
