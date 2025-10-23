import request from 'superagent';

const mapEventObject = (googleEvent) => ({
  title: googleEvent.summary,
  content: '',
  startTime: googleEvent.start.dateTime,
  endTime: googleEvent.end.dateTime,
});

export default function googleSource(sourceOptions) {
  if (!sourceOptions.calendarID) {
    throw new Error('Calendar ID must be supplied');
  }

  if (!sourceOptions.apiKey) {
    throw new Error('API key must be supplied');
  }

  const baseURL = `https://www.googleapis.com/calendar/v3/calendars/${sourceOptions.calendarID}/events`;
  const baseQuery = {
    key: sourceOptions.apiKey,
    orderBy: 'startTime',
    singleEvents: 'true',
  };

  const cacheTime = sourceOptions.cacheTime
    ? sourceOptions.cacheTime * 1000
    : 10_000;
  let lastUpdated = 0;
  let cachedResult = null;

  const isStale = () => Date.now() - lastUpdated > cacheTime;

  const fetchEvents = (options, callback) => {
    const maxResults = options.maxResults || 0;
    const currentTime = new Date();

    const query = { ...baseQuery };

    if (maxResults > 0) {
      query.maxResults = options.maxResults;
    }

    query.timeMin = currentTime.toISOString();

    request
      .get(baseURL)
      .query(query)
      .end((err, res) => {
        if (err) {
          return callback(err, []);
        }

        const data = res.body;

        const processedData = [];

        if (!data.items) {
          console.log('bad response from google', data);
          return callback(null, processedData);
        }

        for (let i = 0; i < data.items.length; i += 1) {
          processedData.push(mapEventObject(data.items[i]));
        }

        cachedResult = processedData;
        lastUpdated = Date.now();
        return callback(null, processedData);
      });
  };

  const getEvents = (options, callback) => {
    const maxResults = options.maxResults || 0;

    // first time or cache does not have all events requested.
    if (cachedResult === null || maxResults > cachedResult.length) {
      return fetchEvents(options, callback);
    }

    if (isStale()) {
      // If stale we should fetch the new events asynchronously.
      fetchEvents(options, () => {});
    }

    if (!Array.isArray(cachedResult)) {
      return callback(new Error('Invalid Cached Result', []));
    }

    let newResult;
    if (maxResults > 0) {
      newResult = cachedResult.slice(0, maxResults);
    }

    return callback(null, newResult);
  };

  const getCurrentEvent = (callback) => {
    getEvents(
      {
        maxResults: 1,
      },
      (err, results) => {
        if (err) {
          return callback(err, {});
        }

        return callback(null, results[0]);
      },
    );
  };

  return {
    getEvents,
    getCurrentEvent,
  };
}
