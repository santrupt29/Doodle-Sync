import ws   from 'k6/ws';
import http from 'k6/http';
import { check, sleep }  from 'k6';
import { Counter, Trend } from 'k6/metrics';

const strokesSent     = new Counter('strokes_sent');
const strokeLatency   = new Trend('stroke_latency_ms');
const wsConnectErrors = new Counter('ws_connect_errors');

export const options = {
  vus:      8,          // 8 virtual users = 8 concurrent players
  duration: '60s',
  thresholds: {
    stroke_latency_ms:   ['p(99) < 200'],
    'http_req_failed':   ['rate < 0.01'],
    ws_connect_errors:   ['count < 3'],
  },
};

export function setup() {
  const headers = { 'Content-Type': 'application/json' };

  const regPayload = JSON.stringify({
    username: 'loadtest123',
    email:    'load123@test.com',
    password: 'pass123',
  });

  let authData;
  const reg = http.post('http://localhost:8765/user/auth/register', regPayload, { headers });

  if (reg.status === 200 || reg.status === 201) {
    authData = reg.json();
  } else {
    console.log(`Registration skipped (${reg.status}). Logging in...`);
    const loginPayload = JSON.stringify({ username: 'loadtest123', password: 'pass123' });
    const login = http.post('http://localhost:8765/user/auth/login', loginPayload, { headers });

    if (login.status !== 200) {
      console.error(`Login failed: ${login.status} — ${login.body}`);
      throw new Error('Could not authenticate loadtest user');
    }
    authData = login.json();
  }

  const token    = authData.token;
  const userId   = authData.userId;

  if (!token || !userId) {
    throw new Error(`Auth incomplete — token: ${token}, userId: ${userId}`);
  }

  const roomPayload = JSON.stringify({
    userId,
    username:       'loadtest123',
    maxPlayers:     8,
    totalRounds:    2,
    drawTimeSeconds: 90,
  });

  const room = http.post('http://localhost:8765/game/room', roomPayload, {
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (room.status !== 200 && room.status !== 201) {
    console.error(`Room creation failed: ${room.status} — ${room.body}`);
    throw new Error('Could not create room');
  }

  const roomCode = room.json('roomCode');
  console.log(`Setup complete — room: ${roomCode}`);

  return { roomCode, token };
}

export default function (data) {
  const { roomCode, token } = data;
  const vuId = __VU;

  const url = 'ws://localhost:8081/ws/websocket';

  const res = ws.connect(url, {}, function (socket) {

    socket.on('open', function () {
      socket.send('CONNECT\naccept-version:1.2\nheart-beat:0,0\n\n\x00');
    });

    socket.on('message', function (msg) {

      if (msg.startsWith('CONNECTED')) {

        socket.send(
          'SUBSCRIBE\n' +
          'id:sub-' + vuId + '\n' +
          'destination:/topic/room.' + roomCode + '.canvas\n\n\x00'
        );

        let seq = 0;
        socket.setInterval(function () {
          const start = Date.now();
          const stroke = JSON.stringify({
            playerId:    'vu-' + vuId,
            roomCode:    roomCode,
            x1: Math.random() * 800,
            y1: Math.random() * 600,
            x2: Math.random() * 800,
            y2: Math.random() * 600,
            color:       '#000000',
            width:       5,
            isEraser:    false,
            timestamp:   start,
            sequenceNum: ++seq,
          });

          socket.send(
            'SEND\n' +
            'destination:/app/room.' + roomCode + '.stroke\n' +
            'content-type:application/json\n' +
            '\n' + stroke + '\x00'
          );

          strokesSent.add(1);
          strokeLatency.add(Date.now() - start);
        }, 100);  // every 100ms = 10 strokes/sec

        socket.setTimeout(function () {
          socket.close();
        }, 58000);
      }
    });

    socket.on('error', function (e) {
      console.error('WS error: ' + (e.message || e));
      wsConnectErrors.add(1);
    });

    socket.on('close', function () {
      // no-op: k6 will end the VU iteration
    });
  });

  check(res, { 'WS connected': (r) => r && r.status === 101 });
}