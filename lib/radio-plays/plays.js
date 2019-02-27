'use strict';

const spinitronSource = require('./spinitronSource');
const spinitronV2Source = require('./spinitronV2Source');

const availableSources = ['Spinitron', 'SpinitronV2'];
let source = null;

const setSource = (sourceType, options) => {
  if (availableSources.indexOf(sourceType) === -1) {
    throw new Error('SourceType not defined.');
  }

  if (sourceType === 'Spinitron') {
    source = spinitronSource(options);
    return true;
  }

  if (sourceType === 'SpinitronV2') {
    source = spinitronV2Source(options);
    return true;
  }

  return false;
};

const removeSource = () => {
  source = null;
};

const getCurrent = () => {
  if (source === null) {
    throw new Error('No source has been set.');
  }

  return source.getMostCurrentPlay();
};

const recentPlays = num => {
  if (source === null) {
    throw new Error('No source has been set.');
  }

  return source.getRecent(num);
};

module.exports = {
  setSource,
  removeSource,
  getCurrent,
  recentPlays
};
