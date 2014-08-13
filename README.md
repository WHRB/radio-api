Node.js radio-api
=========

A node.js based API for accessing public data about a radio station.
Designed for deployment on Heroku platform.

### Now Playing Information
See: https://github.com/WHRB/recent-plays

Supports fetching now playing information from Spinitron
```
http://yourapp.com/nowplaying
http://yourapp.com/recentplays/[num]
```
Example: http://whrb-api.herokuapp.com/nowplaying

#### JSON structure
##### Guaranteed fields:
- Date
- Timestamp
- ArtistName
- SongName
- ComposerName
- DiskName
- LabelName
- Playlist URL
- Show URL

Note: Now playing returns a single JSON object, while recent plays returns an array of JSON objects.

### Streaming Data
To be added soon.

See: https://github.com/WHRB/stream-data
