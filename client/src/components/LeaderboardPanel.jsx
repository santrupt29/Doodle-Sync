import { useState, useEffect } from 'react';
import api from '../api/gameApi';

export default function LeaderboardPanel({ roomCode, players = [] }) {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    if (!roomCode) return;

    const fetchScores = () =>
      api.get(`/score/room/${roomCode}/leaderboard`)
        .then(r => setScores(r.data))
        .catch(() => {});

    fetchScores();
    const interval = setInterval(fetchScores, 5000);
    return () => clearInterval(interval);
  }, [roomCode]);

  // Map userId to username
  const getUserName = (userId) => {
    const player = players.find(p => p.userId === userId);
    return player?.username || userId;
  };

  // Build display list: all players with their scores
  const playerScores = players.map((p, idx) => {
    const scoreEntry = scores.find(s => s.userId === p.userId);
    return {
      userId: p.userId,
      username: p.username,
      score: scoreEntry?.score || 0,
      rank: idx + 1,
    };
  });

  // Sort by score descending
  playerScores.sort((a, b) => b.score - a.score);

  // Re-rank after sorting
  playerScores.forEach((p, i) => { p.rank = i + 1; });

  return (
    <div className="flex flex-col">
      {playerScores.length === 0 && (
        <div className="text-xs text-gray-500 text-center py-6 font-semibold">
          No players
        </div>
      )}
      {playerScores.map((s, i) => (
        <div
          key={s.userId}
          className="px-3 py-3 border-b border-black/20 text-center"
          style={{
            background: i % 2 === 0 ? '#c0c0c0' : '#d9d9d9',
          }}
        >
          <div className="text-sm font-extrabold text-black">
            #{s.rank}: {s.username}
          </div>
          <div className="text-xs font-bold text-black/70">
            {s.score} pts
          </div>
        </div>
      ))}
    </div>
  );
}