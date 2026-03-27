import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useChatSocket } from '../hooks/useChatSocket';
import api from '../api/gameApi';
import Logo from '../components/Logo';

import DrawingCanvas from '../components/DrawingCanvas';
import BrushToolbar from '../components/BrushToolbar';
import ChatPanel from '../components/ChatPanel';
import LeaderboardPanel from '../components/LeaderboardPanel';
import HintDisplay from '../components/HintDisplay';
import GameTimer from '../components/GameTimer';

export default function GameRoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const {
    userId,
    updateFromSession,
    roomState,
    isDrawer,
    currentDrawerId,
    drawTimeSeconds,
    players,
    currentRound,
    totalRounds,
    drawStartedAt,
  } = useGame();

  // brush state
  const [color, setColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [wordLength, setWordLength] = useState(0);
  const [currentWord, setCurrentWord] = useState('');

  // chat socket
  const { messages, hints, sendGuess, clearChat, connected: chatConnected } = useChatSocket(code, userId);

  // Derive word length from hints
  useEffect(() => {
    if (hints.length > 0) {
      const latest = hints[hints.length - 1];
      const cleaned = latest.replace(/^Hint:\s*/, '').replace(/\s/g, '');
      if (cleaned.length > 0) {
        setWordLength(cleaned.length);
      }
    }
  }, [hints]);

  // Fetch the word from Redis for the drawer
  useEffect(() => {
    if (!code || roomState !== 'DRAWING') {
      setCurrentWord('');
      return;
    }

    const fetchWord = () => {
      api.get(`/draw/room/${code}/word`)
        .then(res => {
          if (res.data && typeof res.data === 'string') {
            setCurrentWord(res.data);
            setWordLength(res.data.length);
          }
        })
        .catch(() => {});
    };

    fetchWord();
    const retryTimeout = setTimeout(fetchWord, 2000);
    const retryTimeout2 = setTimeout(fetchWord, 5000);

    return () => {
      clearTimeout(retryTimeout);
      clearTimeout(retryTimeout2);
    };
  }, [code, roomState, currentRound]);

  // Poll room state every 2 seconds
  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/game/room/${code}`);
      updateFromSession(res.data);

      if (res.data.state === 'GAME_OVER') {
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

  // Reset hints, word, and chat when round changes
  const prevRoundRef = useRef(currentRound);
  useEffect(() => {
    if (currentRound > 0 && currentRound !== prevRoundRef.current) {
      prevRoundRef.current = currentRound;
      setWordLength(0);
      setCurrentWord('');
      clearChat();
    }
  }, [currentRound, clearChat]);

  // Find the drawer's username
  const drawerPlayer = players.find(p => p.userId === currentDrawerId);
  const drawerName = drawerPlayer?.username || 'Someone';

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Logo bar */}
      <div className="px-4 py-1 shrink-0">
        <Logo size="sm" />
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col mx-3 mb-3 border-2 border-black rounded-lg overflow-hidden bg-white min-h-0">
        {/* Top bar */}
        <div className="flex items-center border-b-2 border-black bg-white shrink-0">
          {/* Timer + Round */}
          <div className="flex items-center gap-3 px-4 py-2 border-r-2 border-black">
            <GameTimer
              drawTimeSeconds={drawTimeSeconds}
              drawStartedAt={drawStartedAt}
            />
            <span className="text-lg font-extrabold text-black">
              Round {currentRound || 1} of {totalRounds || 3}
            </span>
          </div>

          {/* Center: Hint / Word area */}
          <div className="flex-1 text-center py-2">
            <HintDisplay
              hints={hints}
              wordLength={wordLength}
              isDrawer={isDrawer}
              roomState={roomState}
              chatConnected={chatConnected}
              currentWord={currentWord}
            />
          </div>

          {/* Chat Box label */}
          <div className="px-6 py-2 border-l-2 border-black">
            <span className="text-lg font-extrabold text-black">Chat Box</span>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Leaderboard */}
          <div className="w-[180px] shrink-0 border-r-2 border-black bg-gray-100 overflow-y-auto">
            <LeaderboardPanel roomCode={code} players={players} />
          </div>

          {/* Center: Canvas */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Status banner for CHOOSING/RESULTS */}
            {(roomState === 'CHOOSING' || roomState === 'RESULTS') && (
              <div className="flex items-center justify-center py-3 bg-[var(--color-card)] border-b-2 border-black">
                <span className="text-black font-bold text-sm animate-pulse">
                  {roomState === 'CHOOSING'
                    ? '🎯 Choosing a word...'
                    : '📊 Round over! Next round starting soon...'}
                </span>
              </div>
            )}

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center p-2 min-h-0">
              <DrawingCanvas
                roomCode={code}
                playerId={userId}
                isDrawer={isDrawer && roomState === 'DRAWING'}
                color={color}
                brushWidth={brushWidth}
                isEraser={isEraser}
                currentRound={currentRound}
              />
            </div>

            {/* Brush toolbar for drawer */}
            {isDrawer && roomState === 'DRAWING' && (
              <div className="shrink-0 border-t-2 border-black bg-white px-4 py-2">
                <BrushToolbar
                  color={color}
                  setColor={setColor}
                  brushWidth={brushWidth}
                  setBrushWidth={setBrushWidth}
                  isEraser={isEraser}
                  setIsEraser={setIsEraser}
                />
              </div>
            )}
          </div>

          {/* Right: Chat */}
          <div className="w-[250px] shrink-0 border-l-2 border-black flex flex-col min-h-0">
            <ChatPanel
              messages={messages}
              sendGuess={sendGuess}
              isDrawer={isDrawer}
              myPlayerId={userId}
              drawStartedAt={drawStartedAt}
              drawerName={drawerName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
