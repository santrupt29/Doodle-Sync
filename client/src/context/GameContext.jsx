import { createContext, useContext, useState, useCallback } from 'react';

const GameContext = createContext(null);

function loadPersistedState(roomCode) {
  try {
    const raw = sessionStorage.getItem(`game:${roomCode}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function persistState(roomCode, state) {
  try {
    sessionStorage.setItem(`game:${roomCode}`, JSON.stringify({
      currentRound: state.currentRound,
      drawStartedAt: state.drawStartedAt,
      currentDrawerId: state.currentDrawerId,
      lastKnownState: state.roomState,
    }));
  } catch { /* ignore */ }
}

export function GameProvider({ children }) {
  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem('token') || null,
    userId: localStorage.getItem('userId') || null,
    username: localStorage.getItem('username') || null,
  }));

  const [room, setRoomState] = useState({
    roomCode: null,
    roomState: null,
    players: [],
    isDrawer: false,
    currentDrawerId: null,
    wordLength: 0,
    drawTimeSeconds: 90,
    totalRounds: 3,
    currentRound: 0,
    hostUserId: null,
    drawStartedAt: null,
  });

  const login = useCallback((token, userId, username) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    setAuth({ token, userId, username });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setAuth({ token: null, userId: null, username: null });
  }, []);

  const setRoom = useCallback((updates) => {
    setRoomState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateFromSession = useCallback((session) => {
    const myUserId = localStorage.getItem('userId');

    setRoomState(prev => {
      const prevState = prev.roomState;
      const newState = session.state;
      const players = session.players || [];
      let currentRound = prev.currentRound;
      let drawStartedAt = prev.drawStartedAt;

      // ── First load: restore from sessionStorage ───────────────────
      if (prevState === null && session.roomCode) {
        const persisted = loadPersistedState(session.roomCode);
        if (persisted && persisted.currentRound > 0) {
          currentRound = persisted.currentRound;
          drawStartedAt = persisted.drawStartedAt || null;

          // If the persisted state was RESULTS but now it's DRAWING,
          // a new round started while we were refreshing
          if (newState === 'DRAWING' && persisted.lastKnownState === 'RESULTS') {
            currentRound = persisted.currentRound + 1;
            drawStartedAt = Date.now();
          }
        }
        // If no persisted round and game is active, start at round 1
        if (currentRound === 0 && newState !== 'WAITING') {
          currentRound = 1;
          if (newState === 'DRAWING') {
            drawStartedAt = Date.now();
          }
        }
      }

      // ── Detect round transitions ──────────────────────────────────
      // The backend goes: WAITING → CHOOSING → DRAWING → RESULTS → CHOOSING → DRAWING → ...
      //
      // CRITICAL: The CHOOSING state is extremely brief (word is fetched async
      // and transitions to DRAWING within milliseconds). With 2-second polling
      // the frontend WILL miss CHOOSING. So we must also detect:
      //   RESULTS → DRAWING  (missed CHOOSING in between = new round)
      //   DRAWING → DRAWING  (same: missed RESULTS+CHOOSING = new round? no, unlikely)
      //
      if (prevState !== null) {
        const isNewRound =
          // Normal detection: we caught the CHOOSING state
          (newState === 'CHOOSING' && prevState !== 'CHOOSING') ||
          // Missed CHOOSING: went from RESULTS straight to DRAWING
          (newState === 'DRAWING' && prevState === 'RESULTS') ||
          // Missed both RESULTS + CHOOSING: went from DRAWING to DRAWING (edge case)
          (newState === 'DRAWING' && prevState === 'DRAWING' &&
            prev.drawStartedAt !== null &&
            (Date.now() - prev.drawStartedAt) > (prev.drawTimeSeconds * 1000 + 5000));

        if (isNewRound) {
          currentRound = currentRound + 1;
          drawStartedAt = null; // will be set below if newState is DRAWING
          console.log(`[Game] Round advanced to ${currentRound}`);
        }

        // Record when DRAWING state begins (for timer)
        if (newState === 'DRAWING' && (prevState !== 'DRAWING' || isNewRound)) {
          drawStartedAt = Date.now();
        }
      }

      // ── Compute drawer using backend algorithm ────────────────────
      // Backend: drawerIdx = (currentRound - 1) % players.size()
      let currentDrawerId = prev.currentDrawerId;
      if (currentRound > 0 && players.length > 0) {
        const drawerIdx = (currentRound - 1) % players.length;
        currentDrawerId = players[drawerIdx]?.userId || null;
      }

      const isDrawer = currentDrawerId === myUserId;

      const newRoom = {
        ...prev,
        roomCode: session.roomCode,
        roomState: newState,
        players,
        currentDrawerId,
        isDrawer,
        drawTimeSeconds: session.drawTimeSeconds,
        totalRounds: session.totalRounds,
        currentRound,
        hostUserId: session.hostUserId,
        drawStartedAt,
      };

      if (session.roomCode) {
        persistState(session.roomCode, newRoom);
      }

      return newRoom;
    });
  }, []);

  const resetRoom = useCallback((roomCode) => {
    if (roomCode) {
      sessionStorage.removeItem(`game:${roomCode}`);
    }
    setRoomState({
      roomCode: null,
      roomState: null,
      players: [],
      isDrawer: false,
      currentDrawerId: null,
      wordLength: 0,
      drawTimeSeconds: 90,
      totalRounds: 3,
      currentRound: 0,
      hostUserId: null,
      drawStartedAt: null,
    });
  }, []);

  return (
    <GameContext.Provider value={{
      ...auth,
      ...room,
      login,
      logout,
      setRoom,
      updateFromSession,
      resetRoom,
      isAuthenticated: !!auth.token,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
