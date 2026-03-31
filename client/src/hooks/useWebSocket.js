import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { useState } from 'react';

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
      brokerURL: `ws://localhost:8081/ws/websocket`,
      reconnectDelay: 3000,

      onConnect: () => {
        console.log('[WS] Connected to drawing-service');
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
        reconnectCount++;
                setStatus(reconnectCount >= 3
                  ? 'disconnected' : 'reconnecting');
                console.warn(`[WS] Disconnected (attempt ${reconnectCount})`);
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