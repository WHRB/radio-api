import express from 'express';
import { randomUUID } from 'node:crypto';

const router = express.Router();

const connections = new Map();

function removeConnection(id) {
  const res = connections.get(id);
  if (res) {
    console.log('Removed connection', id);
    res.end();
    connections.delete(id);

    console.log(connections.size, 'active event listeners');
  } else {
    console.log('Could not find during connection removal', id);
  }
}

function sendSSEEvent(res, name, data) {
  res.write(`event: ${name}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  res.flush();
}

function broadcastEvent(name, data) {
  for (const res of connections.values()) {
    sendSSEEvent(res, name, data);
  }
}

function sseRouter(spinitron) {
  // Initialize plays data sender

  // keep-alive needed for heroku
  const timeoutInterval = setInterval(() => {
    const timestamp = Date.now();
    broadcastEvent('keepalive', timestamp);
  }, 45_000);

  spinitron.addSongUpdateListener(() => {
    spinitron.getLegacyPlays(1).then((plays) => {
      broadcastEvent('song', plays[0]);
    });
  });

  function openSSEConnection(req, res) {
    const requestId = randomUUID();
    req.on('close', () => {
      removeConnection(requestId);
    });

    req.on('end', () => {
      removeConnection(requestId);
    });

    // Initialize SSE connection with recent plays data
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    spinitron
      .getLegacyPlays(20)
      .then((playlist) => {
        sendSSEEvent(res, 'playlist', playlist);
        connections.set(requestId, res);
        console.log(connections.size, 'active event listeners');
      })
      .catch((error) => {
        console.error(error);
        sendSSEEvent(res, 'playlist', []);
        connections.set(requestId, res);
      });
  }

  router.get('/', openSSEConnection);

  const cleanUp = () => {
    clearInterval(timeoutInterval);
  };

  return { router, cleanUp };
}

export default sseRouter;
