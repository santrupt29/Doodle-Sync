package com.pm.chatservice.handler;

import com.pm.chatservice.dto.ChatMessage;
import com.pm.chatservice.dto.GuessMessage;
import com.pm.chatservice.service.GuessValidator;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
@RequiredArgsConstructor
public class ChatMessageHandler {
    private final GuessValidator guessValidator;
    private final SimpMessagingTemplate broker;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final RedisTemplate<String, String> redisTemplate;

    // Guessers send to: /app/room.{roomCode}.guess
    @MessageMapping("/room.{roomCode}.guess")
    public void handleGuess(
            @DestinationVariable String roomCode,
            @Payload GuessMessage guessMessage
            ) {

        String chatTopic = "/topic/room."+roomCode+".chat";
        String answer = redisTemplate.opsForValue()
                .get("word:" + roomCode);

        if (answer == null) {
            broadcast(chatTopic, "CHAT",
                    guessMessage.getUsername(), guessMessage.getGuess(),
                    guessMessage.getPlayerId());
            return;
        }

        String alreadyKey = "correct:" + roomCode
                + ":" + guessMessage.getPlayerId();
        if (redisTemplate.hasKey(alreadyKey)) {
            return;  // already guessed correctly
        }

        GuessValidator.Result result = guessValidator.validate(guessMessage.getGuess(), answer);

        switch (result) {
            case CORRECT -> {
                markPlayerGuessed(alreadyKey);

                broadcast(chatTopic, "CORRECT",
                        guessMessage.getUsername(),
                        guessMessage.getUsername() + " guessed it!",
                        guessMessage.getPlayerId());

                long secsElapsed =
                        (System.currentTimeMillis()
                                - guessMessage.getTimestamp()) / 1000;
                kafkaTemplate.send("chat-events", roomCode,
                        "CORRECT_GUESS:" + roomCode
                                + ":" + guessMessage.getPlayerId()
                                + ":" + secsElapsed);

                log.info("Correct guess by {} in room {}",
                        guessMessage.getUsername(), roomCode);
            }
            case CLOSE -> {
                    // broadcast the guess as a regular chat message to everyone
                    broadcast(chatTopic, "CHAT",
                            guessMessage.getUsername(),
                            guessMessage.getGuess(),
                            guessMessage.getPlayerId());

                    // send "so close!" hint privately to the guesser only
                    String privateTopic = "/topic/room." + roomCode
                            + ".hint." + guessMessage.getPlayerId();
                    broker.convertAndSend(privateTopic, ChatMessage.builder()
                            .type("CLOSE")
                            .username("System")
                            .message(guessMessage.getGuess() + " — so close!")
                            .playerId(guessMessage.getPlayerId())
                            .timestamp(System.currentTimeMillis())
                            .build());
            }

            case WRONG ->
                    broadcast(chatTopic, "CHAT",
                            guessMessage.getUsername(),
                            guessMessage.getGuess(),
                            guessMessage.getPlayerId());
        }
    }

    private void broadcast(String topic, String type,
                           String username, String message,
                           String playerId) {
        broker.convertAndSend(topic, ChatMessage.builder()
                .type(type)
                .username(username)
                .message(message)
                .playerId(playerId)
                .timestamp(System.currentTimeMillis())
                .build());
    }

    @Retry(name = "kafka-consumer")
    private void markPlayerGuessed(String key) {
        redisTemplate.opsForValue().set(key, "1",
                java.time.Duration.ofMinutes(5));
    }
}


//These are the two services (chat and score) where a failed consume — due to a transient Redis write error or DB hiccup — would silently drop a score or a guess. Retry catches that.
