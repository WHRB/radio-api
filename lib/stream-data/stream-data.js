export default function streamData(params) {
  var options = {};
  options.maxAge = 30000;
  //options = extend(options, params);
  var lastUpdated = new Date();
  var streamData = { sets: [] };

  var isStale = function () {
    diff = new Date() - lastUpdated;
    if (diff > options.maxAge) {
      return true;
    }
    return false;
  };

  var parseStreams = function () {};

  return {
    streams: function () {
      var streams = [
        {
          Name: 'High',
          Priority: 0,
          Streams: [
            {
              URL: 'http://hrbinc-hi.streamguys.net/',
              'Mime-type': 'audio/mpeg',
              Codec: 'mp3',
              Bitrate: 96,
            },
            {
              URL: 'http://hrbinc-low.streamguys.net/',
              'Mime-type': 'audio/aacp',
              Bitrate: 48,
            },
          ],
        },
        {
          Name: 'Low',
          Priority: 1,
          Streams: [
            {
              URL: 'http://hrbinc.streamguys.net/',
              'Mime-type': 'audio/mpeg',
              Codec: 'mp3',
              Bitrate: 32,
            },
          ],
        },
      ];
      return streams;
    },
  };
}
