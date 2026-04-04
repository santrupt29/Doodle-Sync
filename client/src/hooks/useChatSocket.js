import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { fetchWsTicket } from '../api/gameApi';

export function useChatSocket(roomCode, playerId) {
  const [messages, setMessages] = useState([]);
  const [hints,    setHints]    = useState([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!roomCode) return;

    const client = new Client({
      // placeholder — overwritten by beforeConnect
      brokerURL: `ws://localhost:8080/ws-chat/websocket`,
      reconnectDelay: 3000,

      // fires before EVERY connect attempt (initial + reconnects)
      beforeConnect: async () => {
        try {
          const ticket = await fetchWsTicket();
          client.brokerURL = `ws://localhost:8080/ws-chat/websocket?ticket=${ticket}`;
        } catch (e) {
          console.error('[Chat WS] Failed to fetch ticket:', e);
          setConnected(false);
          client.deactivate();
        }
      },

      onConnect: () => {
        console.log('[Chat WS] Connected to chat-service (authenticated)');
        setConnected(true);

        client.subscribe(
          `/topic/room.${roomCode}.chat`,
          (msg) => {
            try {
              const data = JSON.parse(msg.body);
              console.log('[Chat WS] Received:', data.type, data.message);

              if (data.type === 'HINT') {
                setHints(prev => [...prev, data.message]);
              } else {
                setMessages(prev => [...prev, data]);
              }
            } catch (e) {
              console.error('[Chat WS] Failed to parse message:', e, msg.body);
            }
          }
        );

        // subscribe to private "so close!" hints (only this player receives them)
        if (playerId) {
          client.subscribe(
            `/topic/room.${roomCode}.hint.${playerId}`,
            (msg) => {
              try {
                const data = JSON.parse(msg.body);
                console.log('[Chat WS] Private hint:', data.message);
                setMessages(prev => [...prev, data]);
              } catch (e) {
                console.error('[Chat WS] Failed to parse private hint:', e);
              }
            }
          );
        }
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