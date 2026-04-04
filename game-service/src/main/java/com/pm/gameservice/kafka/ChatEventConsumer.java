package com.pm.gameservice.kafka;

import com.pm.gameservice.repository.GameSessionRepository;
import com.pm.gameservice.statemachine.GameStateMachine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Listens on chat-events for CORRECT_GUESS messages.
 * When all guessers have guessed correctly, triggers early round end
 * via GameStateMachine.playerGuessedCorrectly().
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChatEventConsumer {

    private final GameStateMachine gameStateMachine;
    private final GameSessionRepository gameSessionRepository;

    @KafkaListener(topics = "chat-events", groupId = "game-service-guesses")
    public void onChatEvent(ConsumerRecord<String, String> record) {
        String value = record.value();

        // Format: CORRECT_GUESS:{roomCode}:{userId}:{secondsElapsed}
        if (!value.startsWith("CORRECT_GUESS:")) return;

        String[] parts = value.split(":");
        if (parts.length < 4) return;

        String roomCode = parts[1];
        String userId   = parts[2];

        // get total players from the session to know how many guessers there are
        gameSessionRepository.findByRoomCode(roomCode).ifPresent(session -> {
            int totalPlayers = session.getPlayers().size();
            log.info("Correct guess by {} in room {} — checking if all {} guessers are done",
                    userId, roomCode, totalPlayers - 1);
            gameStateMachine.playerGuessedCorrectly(roomCode, userId, totalPlayers);
        });
    }
}
