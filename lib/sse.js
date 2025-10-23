import express from 'express';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

const router = express.Router();

function sseInit(req, res, next) {
  res.locals.sseSetup = () => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
  };

  res.locals.sseSend = (data, name = null) => {
    if (name) {
      res.write(`event: ${name}\n`);
    }

    res.write(`data: ${JSON.stringify(data)}\n\n`);
    res.flush();
  };

  next();
}

const connections = new Map();
const emitter = new EventEmitter();

let currentSong = { hash: null };

emitter.on('newSong', (song) => {
  for (const res of connections.values()) {
    res.locals.sseSend(song, 'song');
  }
});

emitter.on('keepalive', (timestamp) => {
  for (const res of connections.values()) {
    res.locals.sseSend(timestamp, 'keepalive');
  }
});

router.use(sseInit);

const removeConnection = (id) => {
  const res = connections.get(id);
  if (res) {
    res.end();
    connections.delete(id);
  }
};

const sseRouter = (playsManager) => {
  setInterval(() => {
    playsManager
      .getCurrent()
      .then((result) => {
        if (result && result.hash !== currentSong.hash) {
          emitter.emit('newSong', result);
          currentSong = result;
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, 2500);

  // keep-alive needed for heroku
  setInterval(() => {
    const timestamp = Date.now();
    emitter.emit('keepalive', { timestamp });
  }, 54_000);

  const openSSEConnection = (req, res) => {
    const requestId = randomUUID();
    req.on('close', () => {
      removeConnection(requestId);
    });

    req.on('end', () => {
      removeConnection(requestId);
    });

    res.locals.sseSetup();
    playsManager
      .recentPlays(20)
      .then((playlist) => {
        res.locals.sseSend(playlist, 'playlist');
        connections.set(requestId, res);
      })
      .catch((error) => {
        console.error(error);
        res.locals.sseSend([currentSong], 'playlist');
        connections.set(requestId, res);
      });
  };

  router.get('/', openSSEConnection);

  return router;
};

export default sseRouter;
