import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/gameApi';
import Logo from '../components/Logo';

export default function ResultsPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    api.get(`/score/room/${code}/leaderboard`)
      .then(r => setScores(r.data))
      .catch(() => {});
    api.get(`/game/room/${code}`)
      .then(r => setPlayers(r.data.players || []))
      .catch(() => {});
  }, [code]);

  const getUserName = (userId) => {
    const player = players.find(p => p.userId === userId);
    return player?.username || userId;
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl animate-slide-up">
        <div className="text-center mb-10">
          <Logo size="xl" />
          <div className="text-6xl mt-4 animate-bounce">🎉</div>
          <h1 className="text-4xl font-extrabold text-white mt-4 drop-shadow-md">
            Game Over!
          </h1>
          <p className="text-white/90 mt-2 text-xl font-bold tracking-wide">
            Here are the final results
          </p>
        </div>

        <div className="bg-[var(--color-card)] rounded-xl border-2 border-[var(--color-card-border)] shadow-2xl overflow-hidden flex flex-col min-h-[550px]">
          <div className="px-8 py-5 border-b-2 border-black bg-white/80">
            <h2 className="text-2xl font-black text-black text-center tracking-wide uppercase">
              🏆 Final Leaderboard
            </h2>
          </div>

          <div className="flex-1 py-6 px-8 bg-black/5 overflow-y-auto space-y-3">
            {scores.length === 0 && (
              <div className="text-center py-12 text-black/40 text-lg font-extrabold uppercase tracking-widest">
                No scores recorded
              </div>
            )}
            
            {scores.map((s, i) => (
              <div
                key={s.userId}
                className={`flex items-center justify-between px-6 py-4 border-2 border-black rounded-xl shadow-[0_2px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 ${
                  i === 0 ? 'bg-yellow-100' : i === 1 ? 'bg-gray-100' : i === 2 ? 'bg-orange-100' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl w-10 text-center drop-shadow-sm">
                    {medals[i] || (
                      <span className="text-lg text-black/50 font-black">
                        #{i + 1}
                      </span>
                    )}
                  </span>
                  <span className={`font-black text-black ${i === 0 ? 'text-2xl' : 'text-xl'}`}>
                    {getUserName(s.userId)}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-black text-black ${i === 0 ? 'text-3xl' : 'text-2xl'}`}>
                    {s.score}
                  </span>
                  <span className="text-sm text-black/50 ml-1.5 font-extrabold uppercase tracking-wide">pts</span>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-8 py-6 border-t-2 border-black bg-white flex gap-4 mt-auto">
            <button
              onClick={() => navigate('/lobby')}
              className="flex-1 py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xl font-extrabold rounded-lg transition-all border-2 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 active:translate-y-2 flex items-center justify-center gap-2"
            >
              <span className="text-2xl"></span> Play Again
            </button>
            <button
              onClick={() => navigate('/lobby')}
              className="flex-1 py-4 bg-white hover:bg-gray-50 text-black text-xl font-extrabold rounded-lg transition-all border-2 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 active:translate-y-2 flex items-center justify-center gap-2"
            >
              <span className="text-2xl">🏠</span> Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
