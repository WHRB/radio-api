import https from 'node:https';
import querystring from 'node:querystring';
import moment from 'moment-timezone';

interface SongPlay {
  id: number;
  playlist_id: number;
  artist: string;
  song: string;
  note: string;
  composer: string;
  release: string;
  released: number | null;
  label: string;
  start: string;
  timezone: string;
}

interface Show {
  id: number;
  title: string;
  category: string;
  url: string;
}

interface Playlist {
  id: number;
  show_id: number;
  title: string;
}

interface LegacyPlay {
  SongID: number;
  PlaylistID: number;
  ShowID: number | null;
  ArtistName: string;
  SongName: string;
  SongNote: string;
  ComposerName: string;
  DiskName: string;
  DiskReleased: number | null;
  LabelName: string;
  isoTime: string;
  Date: string;
  Timestamp: string;
  ShowInfo: LegacyShow | null;
  hash: string;
}

interface LegacyShow {
  ShowName: string;
}

class SpinitronData {
  spinitronToken: string;
  recentPlays: SongPlay[];
  playlistCache: Map<number, Playlist>;
  showCache: Map<number, Show>;
  watchInterval: NodeJS.Timeout;
  spinBaseUrl: string = 'spinitron.com';
  songUpdateListeners: ((song: SongPlay) => void)[];

  constructor(spinitronToken: string) {
    this.spinitronToken = spinitronToken;
    this.recentPlays = [];
    this.playlistCache = new Map();
    this.showCache = new Map();

    this.watchInterval = this.watchForUpdates();
    this.songUpdateListeners = [];
  }

  watchForUpdates() {
    const interval = setInterval(() => {
      this.updatePlaysData();
    }, 60_000 * 5);

    return interval;
  }

  haltWatch() {
    clearInterval(this.watchInterval);
  }

  addSongUpdateListener(cb: (play: SongPlay) => void) {
    this.songUpdateListeners.push(cb);
  }

  // Get methods with caching

  async getPlays(num = 25) {
    if (this.recentPlays.length >= num) {
      return this.recentPlays.slice(0, num);
    }

    // Otherwise refresh to get more data.
    await this.updatePlaysData();
    return this.recentPlays.slice(0, num);
  }

  async getShow(showId: number) {
    if (this.showCache.has(showId)) {
      return this.showCache.get(showId);
    }
    const show = await this.fetchShow(showId);
    this.showCache.set(showId, show);
    return show;
  }

  async getPlaylist(playlistId: number) {
    if (this.playlistCache.has(playlistId)) {
      return this.playlistCache.get(playlistId);
    }
    const playlist = await this.fetchPlaylist(playlistId);
    this.playlistCache.set(playlistId, playlist);
    return playlist;
  }

  async getLegacyPlays(num = 25) {
    const plays = await this.getPlays(num);

    const legacyPlays: (SongPlay & LegacyPlay)[] = [];

    if (plays.length === 0 || !plays[0]) {
      return legacyPlays;
    }

    for (const play of plays) {
      const time = moment.tz(play.start, play.timezone);
      const legacyPlay = {
        ...play,
        SongID: play.id,
        PlaylistID: play.playlist_id,
        ShowID: null,
        ShowInfo: null,
        ArtistName: play.artist,
        SongName: play.song,
        SongNote: play.note,
        ComposerName: play.composer,
        DiskName: play.release,
        DiskReleased: play.released,
        LabelName: play.label,
        isoTime: time.format(),
        Date: time.format('YYYY-MM-DD'),
        Timestamp: time.format('HH:mm:ss'),
        hash: `${play.id}`,
      };

      legacyPlays.push(legacyPlay);
    }

    const firstPlaylist = await this.getPlaylist(plays[0].playlist_id);
    if (!firstPlaylist) {
      return legacyPlays;
    }

    if (legacyPlays[0]) {
      legacyPlays[0].ShowID = firstPlaylist.show_id;
      legacyPlays[0].ShowInfo = { ShowName: firstPlaylist.title };
    }

    return legacyPlays;
  }

  /**
   * Refresh the play data by requerying spinitron.
   *
   * If the most recent song changed, then notify
   * song update listeners of the change.
   */
  async updatePlaysData() {
    let currentSong: SongPlay | null = null;
    if (this.recentPlays.length && this.recentPlays[0]) {
      currentSong = this.recentPlays[0];
    }

    const newPlays = await this.fetchPlays(200);
    this.recentPlays = newPlays;

    // Notify listeners of change
    if (newPlays.length && newPlays[0] && newPlays[0].id !== currentSong?.id) {
      console.log('new song found');
      for (const cb of this.songUpdateListeners) {
        cb(newPlays[0]);
      }
    }
  }

  // Spinitron fetch methods

  async fetchPlays(num = 200) {
    const plays = await this.spinitronRequest<SongPlay[]>('spins', {
      count: num,
    });
    return plays.map((play) => {
      const newData = {
        id: play.id,
        playlist_id: play.playlist_id,
        artist: play.artist,
        song: play.song,
        note: play.note,
        composer: play.composer,
        release: play.release,
        released: play.released,
        label: play.label,
        start: play.start,
        timezone: play.timezone,
      };

      return newData;
    });
  }

  async fetchPlaylist(playlistId: number) {
    const playlist = await this.spinitronRequest<Playlist>(
      `playlists/${playlistId}`,
    );
    return playlist;
  }

  async fetchShow(showId: number) {
    const show = await this.spinitronRequest<Show>(`shows/${showId}`);
    return show;
  }

  async spinitronRequest<T>(
    endpoint: string,
    params?: Record<string, string | number>,
  ) {
    const resultPromise: Promise<T> = new Promise((resolve, reject) => {
      const options = {
        hostname: this.spinBaseUrl,
        port: 443,
        path: `/api/${endpoint}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.spinitronToken}`,
        },
      };

      if (params) {
        const queryString = querystring.stringify(params);
        options.path = `${options.path}?${queryString}`;
      }

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const parsedData = JSON.parse(data);
          if (parsedData?._meta && parsedData?.items) {
            resolve(parsedData.items);
          } else {
            resolve(parsedData);
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });
      req.end();
    });

    return resultPromise;
  }
}

export default SpinitronData;
