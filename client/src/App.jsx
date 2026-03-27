import { Routes, Route, Navigate } from 'react-router-dom';
import { useGame } from './context/GameContext';

import LoginPage       from './pages/LoginPage';
import LobbyPage       from './pages/LobbyPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import GameRoomPage    from './pages/GameRoomPage';
import ResultsPage     from './pages/ResultsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useGame();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated } = useGame();
  if (isAuthenticated) return <Navigate to="/lobby" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={
        <GuestRoute><LoginPage /></GuestRoute>
      } />
      <Route path="/lobby" element={
        <ProtectedRoute><LobbyPage /></ProtectedRoute>
      } />
      <Route path="/room/:code/waiting" element={
        <ProtectedRoute><WaitingRoomPage /></ProtectedRoute>
      } />
      <Route path="/room/:code/play" element={
        <ProtectedRoute><GameRoomPage /></ProtectedRoute>
      } />
      <Route path="/room/:code/results" element={
        <ProtectedRoute><ResultsPage /></ProtectedRoute>
      } />
      <Route path="*" element={
        <GuestRoute><Navigate to="/" replace /></GuestRoute>
      } />
    </Routes>
  );
}
