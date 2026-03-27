import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import api from '../api/gameApi';
import Logo from '../components/Logo';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { userId, username, logout } = useGame();

  // Create room form
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [totalRounds, setTotalRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(90);

  // Join room
  const [joinCode, setJoinCode] = useState('');

  // Recent rooms
  const [recentRooms, setRecentRooms] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('recentRooms') || '[]');
      setRecentRooms(stored);
    } catch { /* ignore */ }
  }, []);

  const saveRecentRoom = (code) => {
    const rooms = [code, ...recentRooms.filter(r => r !== code)].slice(0, 5);
    localStorage.setItem('recentRooms', JSON.stringify(rooms));
    setRecentRooms(rooms);
  };

  const handleCreate = async () => {
    setError('');
    setLoading('create');
    try {
      const res = await api.post('/game/room', {
        userId,
        username,
        maxPlayers,
        totalRounds,
        drawTimeSeconds: drawTime,
      });
      saveRecentRoom(res.data.roomCode);
      navigate(`/room/${res.data.roomCode}/waiting`);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to create room');
    } finally {
      setLoading('');
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setError('');
    setLoading('join');
    try {
      const code = joinCode.trim().toUpperCase();
      await api.post(`/game/room/${code}/join`, { userId, username });
      saveRecentRoom(code);
      navigate(`/room/${code}/waiting`);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to join room');
    } finally {
      setLoading('');
    }
  };

  return (
      <div className="min-h-screen flex flex-col">
      {/* Top right user info */}
      {/* Enhanced Top Navbar */}
      <nav className="w-full flex items-center justify-between px-8 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10 shadow-sm">
        {/* Left side - Subtle Brand Name so it feels like a real navbar */}
        <div className="text-white/40 font-extrabold tracking-widest text-sm uppercase">
          Doodle-Sync Lobby
        </div>

        {/* Right side - User Info & Actions */}
        <div className="flex items-center gap-6">
          {/* User Profile Pill */}
          <div className="flex w-35 items-center gap-3 bg-black/30 pl-2 pr-5 py-1.5 rounded-full border border-white/10 shadow-inner">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold border-2 border-white/20 uppercase">
              {username?.charAt(0) || 'U'}
            </div>
            <span className="text-base text-white/90">
              Hey, <span className="font-bold text-white tracking-wide">{username}</span>!
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-500/90 border border-white/20 hover:border-red-500 text-white font-bold rounded-lg transition-all shadow-sm group"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 flex justify-center px-4 pb-8">
        <div className="w-full max-w-6xl animate-slide-up">
          {/* Logo + heading */}
          <div className="text-center mb-8">
            <Logo size="xl" />
            <h2 className="text-3xl font-extrabold text-white mt-2">Game Lobby</h2>
            <p className="text-white/80 mt-1 text-lg font-semibold">
              Create a New Game or Join an Existing One
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-20">
            {/* Create Room card */}
            <div className="bg-[var(--color-card)] rounded-xl border-2 border-[var(--color-card-border)] p-10 flex flex-col min-h-[420px]">
              <h3 className="text-2xl font-extrabold text-black text-center mb-8">Create a New Room</h3>

              <div className="flex-1 flex flex-col justify-evenly mb-8">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-bold text-black">Max Players</label>
                  <select
                    value={maxPlayers}
                    onChange={e => setMaxPlayers(Number(e.target.value))}
                    className="px-3 py-2 bg-white border-2 border-black rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 w-28 text-center"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-lg font-bold text-black">Rounds</label>
                  <select
                    value={totalRounds}
                    onChange={e => setTotalRounds(Number(e.target.value))}
                    className="px-3 py-2 bg-white border-2 border-black rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 w-28 text-center"
                  >
                    {[2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-lg font-bold text-black">Draw Time</label>
                  <select
                    value={drawTime}
                    onChange={e => setDrawTime(Number(e.target.value))}
                    className="px-3 py-2 bg-white border-2 border-black rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 w-28 text-center"
                  >
                    <option value={60}>60s</option>
                    <option value={90}>90s</option>
                    <option value={120}>120s</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading === 'create'}
                className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 text-white text-xl font-extrabold rounded-lg transition-all border-2 border-black shadow-lg mt-auto"
              >
                {loading === 'create' ? 'Creating...' : 'Create Room'}
              </button>
            </div>

            {/* Join Room card */}
            <div className="bg-[var(--color-card)] rounded-xl border-2 border-purple-600 border-dashed p-10 flex flex-col min-h-[420px]">
              <h3 className="text-2xl font-extrabold text-black text-center mb-8">Join an Existing Room</h3>

              <div className="flex-1 flex flex-col justify-center space-y-8 mb-8">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-lg font-bold text-black whitespace-nowrap">Room Code</label>
                  <input
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="E.G XL29PK"
                    maxLength={8}
                    className="px-4 py-2.5 bg-white border-2 border-black rounded-lg text-base font-mono tracking-widest text-center text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 uppercase w-48"
                  />
                </div>

                {/* Recent rooms */}
                {recentRooms.length > 0 && (
                  <div>
                    <div className="text-sm font-bold text-black/60 mb-3">Recent Rooms</div>
                    <div className="flex flex-wrap gap-2">
                      {recentRooms.map(code => (
                        <button
                          key={code}
                          onClick={() => setJoinCode(code)}
                          className="px-4 py-2 bg-white/50 border border-black/30 rounded-lg text-sm font-mono text-black hover:bg-white transition-colors"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleJoin}
                disabled={loading === 'join' || !joinCode.trim()}
                className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 text-white text-xl font-extrabold rounded-lg transition-all border-2 border-black shadow-lg mt-auto"
              >
                {loading === 'join' ? 'Joining...' : 'Join Room'}
              </button>
            </div>
            {error && (
            <div className="mt-4 px-4 py-3 bg-red-100 border-2 border-red-400 text-red-700 text-sm rounded-xl animate-fade-in text-center font-bold">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </div>
          )}
          </div>
          </div>
    </main>
     </div>
  );
}


