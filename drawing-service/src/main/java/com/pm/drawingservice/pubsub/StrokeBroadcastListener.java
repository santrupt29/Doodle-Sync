package com.pm.drawingservice.pubsub;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pm.drawingservice.dto.StrokeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Listens on Redis Pub/Sub channel pattern "draw:*" and broadcasts
 * each stroke to all STOMP subscribers on /topic/room.{roomCode}.canvas.
 *
 * Replaces the old Kafka DrawEventConsumer — strokes are ephemeral
 * and don't need Kafka's durability guarantees.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class StrokeBroadcastListener implements MessageListener {

    private final SimpMessagingTemplate broker;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String channel = new String(message.getChannel());
            // channel format: "draw:{roomCode}"
            String roomCode = channel.substring("draw:".length());
            String json = new String(message.getBody());

            StrokeEvent stroke = objectMapper.readValue(json, StrokeEvent.class);
            String topic = "/topic/room." + roomCode + ".canvas";
            broker.convertAndSend(topic, stroke);

            log.debug("Redis Pub/Sub stroke broadcast → {}", topic);
        } catch (Exception e) {
            log.error("Failed to broadcast stroke from Redis Pub/Sub: {}",
                    e.getMessage());
        }
    }
}
