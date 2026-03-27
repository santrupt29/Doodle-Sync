import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';

export function useChatSocket(roomCode, playerId) {
  const [messages, setMessages] = useState([]);
  const [hints,    setHints]    = useState([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!roomCode) return;

    const client = new Client({
      brokerURL: `ws://localhost:8080/ws-chat/websocket`,
      reconnectDelay: 3000,

      onConnect: () => {
        console.log('[Chat WS] Connected to chat-service');
        setConnected(true);

        client.subscribe(
          `/topic/room.${roomCode}.chat`,
          (msg) => {
            try {
              const data = JSON.parse(msg.body);
              console.log('[Chat WS] Received:', data.type, data.message);

              if (data.type === 'HINT') {
                // data.message format: "Hint:_A____" or "Hint: _ A _ _ _ _"
                setHints(prev => [...prev, data.message]);
              } else {
                setMessages(prev => [...prev, data]);
              }
            } catch (e) {
              console.error('[Chat WS] Failed to parse message:', e, msg.body);
            }
          }
        );
      },

      onStompError: (frame) => {
        console.error('[Chat WS] STOMP error:', frame.headers?.message, frame.body);
        setConnected(false);
      },

      onWebSocketError: (event) => {
        console.error('[Chat WS] WebSocket error:', event);
        setConnected(false);
      },

      onDisconnect: () => {
        console.log('[Chat WS] Disconnected');
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      setConnected(false);
    };
  }, [roomCode]);

  const sendGuess = useCallback((text, drawStartedAt) => {
    if (!clientRef.current?.connected || !text.trim()) return;
    clientRef.current.publish({
      destination: `/app/room.${roomCode}.guess`,
      body: JSON.stringify({
        playerId,
        username: localStorage.getItem('username') || 'Player',
        guess: text.trim(),
        // Send the round start time, NOT Date.now().
        // Backend calculates: secsElapsed = (server_now - this_timestamp) / 1000
        // So secsElapsed = time since round started = proper score decay
        timestamp: drawStartedAt || Date.now(),
      }),
    });
  }, [roomCode, playerId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setHints([]);
  }, []);

  return { messages, hints, sendGuess, clearChat, connected };
}