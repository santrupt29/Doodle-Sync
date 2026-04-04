import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { fetchWsTicket } from '../api/gameApi';

export function useWebSocket(roomCode, onStroke) {
  const clientRef       = useRef(null);
  const onStrokeRef     = useRef(onStroke);
  const subscriptionRef = useRef(null);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    onStrokeRef.current = onStroke;
  }, [onStroke]);

  useEffect(() => {
    if (!roomCode) return;

    const client = new Client({
      // placeholder — overwritten by beforeConnect
      brokerURL: `ws://localhost:8081/ws/websocket`,
      reconnectDelay: 3000,

      // fires before EVERY connect attempt (initial + reconnects)
      beforeConnect: async () => {
        try {
          const ticket = await fetchWsTicket();
          client.brokerURL = `ws://localhost:8081/ws/websocket?ticket=${ticket}`;
        } catch (e) {
          console.error('[WS] Failed to fetch ticket:', e);
          setStatus('disconnected');
          client.deactivate();
        }
      },

      onConnect: () => {
        console.log('[WS] Connected to drawing-service (authenticated)');
        setStatus('connected');
        subscriptionRef.current = client.subscribe(
          `/topic/room.${roomCode}.canvas`,
          (message) => {
            try {
              const stroke = JSON.parse(message.body);
              onStrokeRef.current?.(stroke);
            } catch (e) {
              console.error('[WS] Failed to parse stroke', e);
            }
          }
        );
      },

      onDisconnect: () => {
        setStatus('reconnecting');
        console.warn('[WS] Disconnected, will reconnect with new ticket');
      },

      onStompError: () => setStatus('reconnecting'),
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, [roomCode]);

  const sendStroke = useCallback((stroke) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/room.${roomCode}.stroke`,
      body: JSON.stringify(stroke),
    });
  }, [roomCode]);

  return { sendStroke, status };
}