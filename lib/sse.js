import express from 'express';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

const router = express.Router();

function sseInit(req, res, next) {
  res.sseSetup = () => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
  };

  res.sseSend = (data, name = null) => {
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
  connections.forEach((res) => {
    res.sseSend(song, 'song');
  });
});

emitter.on('keepalive', (timestamp) => {
  connections.forEach((res) => {
    res.sseSend(timestamp, 'keepalive');
  });
});

router.use(sseInit);

const removeConnection = (id) => {
  const res = connections.get(id);
  if (res) {
    console.log(id);
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
      .catch((err) => {
        console.error(err);
      });
  }, 2500);

  // keep-alive needed for heroku
  setInterval(() => {
    const timestamp = Date.now();
    emitter.emit('keepalive', { timestamp });
  }, 54000);

  const openSSEConnection = (req, res) => {
    const requestId = randomUUID();
    req.on('close', () => {
      removeConnection(requestId);
    });

    req.on('end', () => {
      removeConnection(requestId);
    });

    res.sseSetup();
    playsManager
      .recentPlays(20)
      .then((playlist) => {
        res.sseSend(playlist, 'playlist');
        connections.set(requestId, res);
      })
      .catch((err) => {
        console.error(err);
        res.sseSend([currentSong], 'playlist');
        connections.set(requestId, res);
      });
  };

  router.get('/', openSSEConnection);

  return router;
};

export default sseRouter;
