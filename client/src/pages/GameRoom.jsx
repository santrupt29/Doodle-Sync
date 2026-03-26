import { useState, useEffect } from 'react';
import DrawingCanvas from '../components/DrawingCanvas';
import BrushToolbar  from '../components/BrushToolbar';
import api           from '../api/gameApi';

export default function GameRoom() {

  // --- auth state (hardcoded for now, wire login in Week 4) ---
//   const [userId]   = useState('player-1');
//   const [username] = useState('Santrupt');
const [userId, setUserId] = useState('player-1'); 
  const [username, setUsername] = useState('Santrupt');
  const [token, setToken] = useState('');

  // --- room state ---
  const [roomCode,  setRoomCode]  = useState('');
  const [inputCode, setInputCode] = useState('');
  const [inRoom,    setInRoom]    = useState(false);
  const [isDrawer,  setIsDrawer]  = useState(true);

  // --- brush state ---
  const [color,      setColor]      = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(5);
  const [isEraser,   setIsEraser]   = useState(false);

  // --- quick login for testing (no UI yet) ---
  useEffect(() => {
    api.post('/user/auth/login',
      { username: 'santrupt', password: 'pass123' })
      .then(res => {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      })
      .catch(() => console.warn('Login failed — using no auth'));
  }, []);

  const createRoom = async () => {
    const res = await api.post('/game/room', {
      userId, username,
      maxPlayers: 4, totalRounds: 2, drawTimeSeconds: 60,
    });
    setRoomCode(res.data.roomCode);
    setInRoom(true);
    setIsDrawer(true);
    console.log('Room created:', res.data.roomCode);
  };

  const joinRoom = async () => {
    setUserId('player-2');
    setUsername('Player2');
    await api.post(
      `/game/room/${inputCode}/join`,
      { userId: 'player-2', username: 'Player2' }
    );
    setRoomCode(inputCode.toUpperCase());
    setInRoom(true);
    setIsDrawer(false);  // second tab is a guesser
  };

  if (!inRoom) return (
    <div style={{padding:'2rem',maxWidth:'400px',margin:'0 auto'}}>
      <h2>Scribble Demo</h2>
      <button onClick={createRoom}
              style={{display:'block',width:'100%',
                      padding:'12px',marginBottom:'12px'}}>
        Create Room (Tab 1 — Drawer)
      </button>
      <input
        placeholder="Room code"
        value={inputCode}
        onChange={e => setInputCode(e.target.value.toUpperCase())}
        style={{width:'100%',padding:'8px',marginBottom:'8px'}}
      />
      <button onClick={joinRoom}
              style={{display:'block',width:'100%',padding:'12px'}}>
        Join Room (Tab 2 — Guesser)
      </button>
    </div>
  );

  return (
    <div style={{padding:'1rem'}}>
      <div style={{marginBottom:'8px',fontFamily:'monospace'}}>
        Room: <b>{roomCode}</b>
         | 
        Role: <b>{isDrawer ? 'Drawer' : 'Guesser'}</b>
      </div>

      {isDrawer && (
        <BrushToolbar
          color={color}       setColor={setColor}
          brushWidth={brushWidth} setBrushWidth={setBrushWidth}
          isEraser={isEraser} setIsEraser={setIsEraser}
        />
      )}

      <DrawingCanvas
        roomCode={roomCode}
        playerId={userId}
        isDrawer={isDrawer}
        color={color}
        brushWidth={brushWidth}
        isEraser={isEraser}
      />
    </div>
  );
}