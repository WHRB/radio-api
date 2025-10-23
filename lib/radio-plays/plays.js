import spinitronV2Source from './spinitronV2Source.js';

const availableSources = ['SpinitronV2'];
let source = null;

export const setSource = (sourceType, options) => {
  if (availableSources.indexOf(sourceType) === -1) {
    throw new Error('SourceType not defined.');
  }

  if (sourceType === 'SpinitronV2') {
    source = spinitronV2Source(options);
    return true;
  }

  return false;
};

export const removeSource = () => {
  source = null;
};

export const getCurrent = () => {
  if (source === null) {
    throw new Error('No source has been set.');
  }

  return source.getMostCurrentPlay();
};

export const recentPlays = (num) => {
  if (source === null) {
    throw new Error('No source has been set.');
  }

  return source.getRecent(num);
};
