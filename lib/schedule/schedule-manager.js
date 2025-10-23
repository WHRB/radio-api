import GoogleSource from './google-source.js';

const sourceTypes = ['Google'];
const sources = {};

export function getSourceTypes() {
  return sourceTypes;
}

export function addSource(sourceType, options, key) {
  if (!sourceTypes.includes(sourceType)) {
    throw new Error('SourceType not defined.');
  }

  if (sources[key] !== undefined) {
    throw new Error('Key already exists.');
  }

  if (sourceType === 'Google') {
    sources[key] = new GoogleSource(options);
  }
}

export function hasSource(key) {
  return !!(sources[key] && typeof sources[key] === 'object');
}

export function removeSource(key) {
  if (!sources[key]) {
    throw new Error('Key does not exist.');
  }

  delete sources[key];
}

export function getSchedule(key, options, callback) {
  if (!sources[key]) {
    throw new Error('Key does not exist.');
  }

  sources[key].getEvents(options, callback);
}

export function getCurrentEvent(key, callback) {
  if (!sources[key]) {
    throw new Error('Key does not exist.');
  }

  sources[key].getCurrentEvent(callback);
}
