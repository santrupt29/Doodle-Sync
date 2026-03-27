import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import api from '../api/gameApi';
import Logo from '../components/Logo';
import PlayerList from '../components/PlayerList';

export default function WaitingRoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { userId, updateFromSession, resetRoom } = useGame();

  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset room state when entering waiting room (fresh game)
  useEffect(() => {
    resetRoom(code);
  }, [resetRoom, code]);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/game/room/${code}`);
      setSession(res.data);

      // if the game has moved past WAITING, update context and navigate
      if (res.data.state === 'DRAWING' || res.data.state === 'CHOOSING') {
        updateFromSession(res.data);
        navigate(`/room/${code}/play`, { replace: true });
      } else if (res.data.state === 'GAME_OVER') {
        navigate(`/room/${code}/results`, { replace: true });
      }
    } catch (err) {
      console.error('Failed to fetch room', err);
    }
  }, [code, navigate, updateFromSession]);

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [fetchRoom]);

  const handleStart = async () => {
    setError('');
    setStarting(true);
    try {
      await api.post(`/game/room/${code}/start?userId=${userId}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to start game';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setStarting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isHost = session?.hostUserId === userId;
  const playerCount = session?.players?.length || 0;
  const canStart = isHost && playerCount >= 2;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo + heading */}
      <div className="text-center mb-8 animate-slide-up">
        <Logo size="xl" />
        <h2 className="text-4xl font-extrabold text-white mt-4 drop-shadow-md">Game Waiting Room</h2>
      </div>

      {/* Main card */}
      <div className="w-full max-w-xl animate-slide-up">
        <div className="bg-[var(--color-card)] rounded-xl border-2 border-[var(--color-card-border)] overflow-hidden shadow-2xl flex flex-col min-h-[550px]">
          {/* Room code section */}
          <div className="px-8 py-8 text-center border-b-2 border-black bg-[var(--color-surface-light)]/30">
            <h3 className="text-xl font-extrabold text-black mb-4">Room Code</h3>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="px-8 py-3 bg-white border-2 border-black rounded-lg text-3xl font-extrabold font-mono tracking-[0.3em] text-black shadow-inner">
                {code}
              </span>
              <button
                onClick={handleCopy}
                className="p-3 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-all shadow-sm active:translate-y-1"
                title="Copy to clipboard"
              >
                <span className="text-2xl">{copied ? '✅' : '📋'}</span>
              </button>
            </div>
            <p className="text-base font-extrabold text-indigo-700 bg-indigo-100 inline-block px-4 py-1.5 rounded-full border border-indigo-200">
              Share this code with your friends to join!
            </p>
          </div>

          {/* Settings summary */}
          {session && (
            <div className="flex justify-evenly px-8 py-5 bg-white/60 border-b-2 border-black shadow-inner">
              <div className="text-center">
                <div className="text-sm font-extrabold text-black/50 uppercase tracking-wider mb-1">Players</div>
                <div className="text-xl font-black text-black">
                  {playerCount} <span className="text-black/40">/</span> {session.maxPlayers}
                </div>
              </div>
              <div className="w-0.5 bg-black/10 rounded-full"></div>
              <div className="text-center">
                <div className="text-sm font-extrabold text-black/50 uppercase tracking-wider mb-1">Rounds</div>
                <div className="text-xl font-black text-black">
                  {session.totalRounds}
                </div>
              </div>
              <div className="w-0.5 bg-black/10 rounded-full"></div>
              <div className="text-center">
                <div className="text-sm font-extrabold text-black/50 uppercase tracking-wider mb-1">Draw Time</div>
                <div className="text-xl font-black text-black">
                  {session.drawTimeSeconds}s
                </div>
              </div>
            </div>
          )}

          {/* Player list */}
          <div className="flex-1 px-8 py-6 overflow-y-auto bg-black/5">
            {session?.players && (
              <PlayerList
                players={session.players}
                currentDrawerId={null}
              />
            )}
          </div>

          {/* Actions */}
          <div className="px-8 py-6 border-t-2 border-black bg-white mt-auto">
            {isHost ? (
              <button
                onClick={handleStart}
                disabled={!canStart || starting}
                className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 text-white text-2xl font-extrabold rounded-lg transition-all border-2 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 active:translate-y-2 disabled:shadow-none disabled:translate-y-0"
              >
                {starting
                  ? 'Starting...'
                  : playerCount < 2
                    ? 'Need at least 2 players'
                    : 'Start Game!'
                }
              </button>
            ) : (
              <div className="w-full py-4 bg-gray-100 border-2 border-gray-300 rounded-lg text-center">
                <div className="inline-flex items-center gap-3 text-gray-600 font-extrabold text-lg">
                  <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse border-2 border-black" />
                  <span>Waiting for host to start...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 px-4 py-3 bg-red-100 border-2 border-red-400 text-red-700 text-sm rounded-lg font-bold text-center">
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </div>
            )}
          </div>
        </div>

        {/* Back button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/lobby')}
            className="text-base font-bold text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <span className="text-xl">←</span> Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
