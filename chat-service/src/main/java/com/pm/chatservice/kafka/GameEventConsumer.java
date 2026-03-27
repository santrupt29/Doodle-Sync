package com.pm.chatservice.kafka;

import com.pm.chatservice.dto.ChatMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@Slf4j
@RequiredArgsConstructor
public class GameEventConsumer {
    private final SimpMessagingTemplate broker;
    private final RedisTemplate<String, String> redisTemplate;

    @KafkaListener(topics = "game-events",
    groupId = "chat-service-game")
    public void onGameEvent(ConsumerRecord<String, String> record) {
        String roomCode = record.key();
        String value = record.value();

        if(value.startsWith("HINT:")) {
            // Format -> HINT:{roomCode}:{maskedWord}
            String hint = value.split(":",3)[2];
            ChatMessage msg = ChatMessage.builder()
                    .type("HINT")
                    .message("Hint:"+hint)
                    .timestamp(System.currentTimeMillis())
                    .build();

            broker.convertAndSend(
                    "/topic/room."+roomCode+".chat", msg
            );
        }

        // Clear the correct-guessers cache when a new round starts.
        // This allows players to guess again in the new round.
        // Keys follow the pattern: correct:{roomCode}:{playerId}
        if (value.startsWith("ROUND_STARTED:")) {
            Set<String> keys = redisTemplate.keys("correct:" + roomCode + ":*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Cleared {} correct-guess keys for room {}", keys.size(), roomCode);
            }
        }
    }
}
