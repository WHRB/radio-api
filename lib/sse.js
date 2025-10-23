import express from 'express';
import { randomUUID } from 'node:crypto';

const router = express.Router();

const connections = new Map();
let currentSong = { hash: null };

function removeConnection(id) {
  const res = connections.get(id);
  if (res) {
    console.log('Removed connection', id);
    res.end();
    connections.delete(id);
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

function sseRouter(playsManager) {
  // Initialize plays data sender
  setInterval(() => {
    playsManager
      .getCurrent()
      .then((result) => {
        if (result && result.hash !== currentSong.hash) {
          broadcastEvent('song', result);
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
    broadcastEvent('keepalive', timestamp);
  }, 45_000);

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
    playsManager
      .recentPlays(20)
      .then((playlist) => {
        sendSSEEvent(res, 'playlist', playlist);
        connections.set(requestId, res);
      })
      .catch((error) => {
        console.error(error);
        sendSSEEvent(res, 'playlist', [currentSong]);
        connections.set(requestId, res);
      });
  }

  router.get('/', openSSEConnection);

  return router;
}

export default sseRouter;
