package com.pm.drawingservice.kafka;

import com.pm.drawingservice.handler.DrawingMessageHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class GameEventConsumer {

    private final DrawingMessageHandler drawingMessageHandler;

    @KafkaListener(topics = "game-events", groupId = "drawing-service-game")
    public void onGameEvent(ConsumerRecord<String, String> record) {
        String value = record.value();
        String roomCode = record.key();

        // Format : DRAWING_STARTED:{roomCode}:{drawTimeSeconds}
        if(value.startsWith("DRAWING_STARTED:")) {
            String []parts = value.split(":");
            int drawTime = Integer.parseInt(parts[2]);
            drawingMessageHandler.setCanvasTTL(roomCode, drawTime);
        }

        if (value.startsWith("ROUND_ENDED:")) {
            log.info("Round ended — canvas will expire by TTL: {}",
                    roomCode);
        }
    }
}

// Strokes are stored as JSON strings in the Redis List — one entry per stroke.
// RPUSH appends to the right, so the list is naturally ordered by time.
// When a player joins mid-round, LRANGE canvas:roomCode 0 -1 returns all strokes in the exact order they were drawn.
