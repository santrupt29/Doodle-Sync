package com.pm.gameservice.service;

import com.pm.gameservice.dto.CreateRoomRequest;
import com.pm.gameservice.dto.CreateRoomResponse;
import com.pm.gameservice.dto.JoinRoomRequest;
import com.pm.gameservice.dto.JoinRoomResponse;
import com.pm.gameservice.exception.GameException;
import com.pm.gameservice.model.GameSession;
import com.pm.gameservice.model.GameState;
import com.pm.gameservice.repository.GameSessionRepository;
import jakarta.validation.Valid;
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

    public JoinRoomResponse joinRoom(@Valid String roomCode, JoinRoomRequest joinRoomRequest) {
        GameSession gameSession = gameSessionRepository
                .findByRoomCode(roomCode.toUpperCase())
                .orElseThrow(() -> GameException.notFound("Room not found with RoomCode :"+ roomCode));

        if(gameSession.getState() != GameState.WAITING) {
            throw GameException.conflict("Room: "+roomCode+" is already in progress");
        }

        if (gameSession.getPlayers().size() >= gameSession.getMaxPlayers()) {
            throw GameException.conflict("Room is full (" + gameSession.getMaxPlayers() + " players)");
        }

        boolean alreadyIn = gameSession.getPlayers().stream().anyMatch(p -> p.getUserId().equals(joinRoomRequest.getUserId()));
        if (alreadyIn) {
            throw GameException.conflict("User already in this room");
        }

        GameSession.Player newPlayer = GameSession.Player.builder()
                .userId(joinRoomRequest.getUserId())
                .username(joinRoomRequest.getUsername())
                .score(0)
                .isHost(false)
                .isConnected(true)
                .isDrawing(false)
                .build();

        gameSession.getPlayers().add(newPlayer);
        GameSession saved = gameSessionRepository.save(gameSession);
        log.info("Player {} joined room {}",
                joinRoomRequest.getUsername(), roomCode);

        return JoinRoomResponse.builder()
                .sessionId(saved.getId())
                .roomCode(saved.getRoomCode())
                .state(saved.getState().name())
                .players(saved.getPlayers())
                .maxPlayers(saved.getMaxPlayers())
                .totalRounds(saved.getTotalRounds())
                .build();
    }

    // The state machine lives in memory — not in MongoDB.
    // MongoDB stores the persistent game record.
    // The in-memory ConcurrentHashMap is for fast state transitions during an active game.
    // Both must stay in sync.


}
