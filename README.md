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
***
### Streaming Data
The streaming data module returns a list of all available streams for a radio station.
Streams are grouped into stream sets. A set is comprised of one or more stream formats.

See: https://github.com/WHRB/stream-data

#### JSON structure
##### Stream Set:
- Name
- Priority (Integer value with 0 denoting highest priority. Priority decreases as value increases)
- Streams: Array of stream objects ordered from highest to lowest priority. Each stream in a set should a unique codec.
	* URL
	* Mime-type
	* Codec
	* Bitrate (Kbps)

Example:
```
[
	{ 'Name': 'High',
	  'Priority': 0,
	  'Streams' : [
	  	{ 'URL' : 'http://example.com/high.mp3',
	  	  'Mime-type' : 'audio/mpeg',
	  	  'Codec' : 'mp3',
	  	  'Bitrate' : 96
	  	},
	  	{ 'URL' : 'http://example.com/high.opus',
	  	  'Mime-type' : 'audio/ogg',
	  	  'Codec' : 'opus',
	  	  'Bitrate' : 64
	  	}
	  ]
	},
	{ 'Name': 'Low',
	  'Priority': 1,
	  'Streams' : [
	  	{ 'URL' : 'http://example.com/low.mp3',
	  	  'Mime-type' : 'audio/mpeg',
	  	  'Codec' : 'mp3',
	  	  'Bitrate' : 64
	  	},
	  	{ 'URL' : 'http://example.com/low.opus',
	  	  'Mime-type' : 'audio/ogg',
	  	  'Codec' : 'opus',
	  	  'Bitrate' : 48
	  	}
	  ]
	}
]
```
***
### Calendar Feed
Grabs data from a calendar source and provides it via JSON.

#### JSON structure
* Calendar Title:
* Events List:
	* Title
	* Description
	* Start
		* DateTime
	* End
		* DateTime

(potentially fields more to be added)

