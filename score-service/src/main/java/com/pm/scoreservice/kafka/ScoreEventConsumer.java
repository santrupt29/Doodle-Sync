package com.pm.scoreservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScoreEventConsumer {
    private final RedisTemplate<String, String> redisTemplate;

    private static final int BASE_SCORE = 100;
    private static final int DECAY_RATE = 1;

    @KafkaListener(topics = "chat-events", groupId = "score-service")
    public void onChatEvent(ConsumerRecord<String, String> record) {
        String value = record.value();

        // Format : CORRECT_GUESS:{roomCode}:{userId}:{secondsElapsed}
        if(!value.startsWith("CORRECT_GUESS:")) return;
        String []parts = value.split(":");
        if(parts.length < 4) return;

        String roomCode      = parts[1];
        String userId        = parts[2];
        int secsElapsed   = Integer.parseInt(parts[3]);

        int points = BASE_SCORE - (secsElapsed*DECAY_RATE);
        if(points < 10) points = 10;

        String key = "scores:" + roomCode;
        redisTemplate.opsForZSet().incrementScore(key, userId, points);

        log.info("Score +{} → user {} in room {} ({}s elapsed)",
                points, userId, roomCode, secsElapsed);
    }

    @KafkaListener(topics = "game-events", groupId = "score-service-game")
    public void onGameEvent(ConsumerRecord<String, String> record) {
        String value = record.value();

        if(value.startsWith("GAME_OVER:")) {
            String roomCode = value.split(":")[1];
            // Expires after 1 hour not immediately so that leaderboard is readable for some time
            redisTemplate.expire("scores:"+roomCode, java.time.Duration.ofHours(1));
            log.info("Scores TTL set for room {}", roomCode);
        }
    }

}
