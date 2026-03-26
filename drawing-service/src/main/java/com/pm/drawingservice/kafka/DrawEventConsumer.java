package com.pm.drawingservice.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pm.drawingservice.dto.StrokeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DrawEventConsumer {
    private final SimpMessagingTemplate broker;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "draw-events", groupId = "drawing-service-broadcast")
    public void onDrawEvent(ConsumerRecord<String, String> record) {
        String roomCode = record.key();
        String json = record.value();

        try {
            StrokeEvent strokeEvent = objectMapper.readValue(json, StrokeEvent.class);
            String topic = "/topic/room." + roomCode + ".canvas";
            broker.convertAndSend(topic, strokeEvent);

            log.debug("Stroke broadcast → {}", topic);
        } catch (Exception e){
            log.error("Failed to broadcast stroke for room {}: {}",
                    roomCode, e.getMessage());
        }
    }
}

// drawing-service uses a different consumer group (drawing-service-broadcast) from its game event consumer (drawing-service-game).
// If we reuse the same group ID for both listeners, Kafka splits messages between them —
// some strokes go to the game consumer instead of the broadcast consumer and are silently dropped.

// drawing-service both produces strokes to Kafka AND consumes them back to broadcast to all STOMP subscribers.
// This is the fan-out pattern — one stroke from the drawer reaches all guessers via the topic subscription.