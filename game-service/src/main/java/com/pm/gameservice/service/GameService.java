package com.pm.gameservice.service;

import com.pm.gameservice.dto.CreateRoomRequest;
import com.pm.gameservice.dto.CreateRoomResponse;
import com.pm.gameservice.model.GameSession;
import com.pm.gameservice.model.GameState;
import com.pm.gameservice.repository.GameSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameService {

    private final GameSessionRepository gameSessionRepository;
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    // Omitting I,O,1,0 to avoid copy-paste errors
    // SecureRandom instead of Random for unpredictability
    private static final SecureRandom RANDOM = new SecureRandom();

    public CreateRoomResponse createRoom(CreateRoomRequest createRoomRequest) {

        String roomCode = generateUniqueRoomCode();

        GameSession.Player host = GameSession.Player.builder()
                .userId(createRoomRequest.getUserId())
                .username(createRoomRequest.getUsername())
                .score(0)
                .isHost(true)
                .isConnected(true)
                .isDrawing(false)
                .build();

        GameSession session = GameSession.builder()
                .roomCode(roomCode)
                .state(GameState.WAITING)
                .maxPlayers(createRoomRequest.getMaxPlayers())
                .totalRounds(createRoomRequest.getTotalRounds())
                .drawTimeSeconds(createRoomRequest.getDrawTimeSeconds())
                .hostUserId(createRoomRequest.getUserId())
                .players(new ArrayList<>(List.of(host)))
                .rounds(new ArrayList<>())
                .build();

        GameSession saved = gameSessionRepository.save(session);
        log.info("Room created: {} by user {}",
                saved.getRoomCode(), createRoomRequest.getUserId());

        return CreateRoomResponse.builder()
                .sessionId(saved.getId())
                .roomCode(saved.getRoomCode())
                .state(saved.getState().name())
                .maxPlayers(saved.getMaxPlayers())
                .totalRounds(saved.getTotalRounds())
                .drawTimeSeconds(saved.getDrawTimeSeconds())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    public GameSession getRoomByCode(String roomCode) {
        return gameSessionRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new NoSuchElementException(
                        "Room not found: " + roomCode));
    }

    private String generateUniqueRoomCode() {
        String code;
        int attempts = 0;
        do {
            code = generateRoomCode();
            attempts++;
            if(attempts > 10) {
                throw new IllegalStateException("Could not generate room code after 10 attempts");
            }
        } while (gameSessionRepository.existsByRoomCode(code));
        return code;
    }

    private String generateRoomCode() {
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

}
