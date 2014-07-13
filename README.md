Node.js radio-api
=========

A node.js based API for accessing public data about a radio station.
Designed for deployment on Heroku platform.

### Features
Supports fetching now playing information from Spinitron
```
http://yourapp.com/nowplaying
http://yourapp.com/recentplays/[num]
```
Example: http://whrb-api.herokuapp.com/nowplaying

### Planned features
- Provide stream information pulled from icecast (and potentially shoutcast) servers. Will utilize json api in Icecast 2.4.0 and facilitate the creation of a dynamic client stream player.
