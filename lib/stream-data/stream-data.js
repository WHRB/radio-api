function streamData() {
  const options = {};
  options.maxAge = 30_000;

  return {
    streams() {
      const streams = [
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

export default streamData;
