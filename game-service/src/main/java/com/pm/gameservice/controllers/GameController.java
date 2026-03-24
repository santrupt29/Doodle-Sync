package com.pm.gameservice.controllers;

import com.pm.gameservice.dto.CreateRoomRequest;
import com.pm.gameservice.dto.CreateRoomResponse;
import com.pm.gameservice.dto.JoinRoomRequest;
import com.pm.gameservice.dto.JoinRoomResponse;
import com.pm.gameservice.exception.GameException;
import com.pm.gameservice.model.GameSession;
import com.pm.gameservice.service.GameService;
import com.pm.gameservice.statemachine.GameStateMachine;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;

@RestController
@RequestMapping("/game")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;
    private final GameStateMachine gameStateMachine;

    @GetMapping("/health")
    public String gameHealth() {
        return "Game Service Running";
    }

    @PostMapping("/room")
    public ResponseEntity<CreateRoomResponse> createRoom(
            @Valid @RequestBody CreateRoomRequest createRoomRequest) {

        CreateRoomResponse createRoomResponse =
                gameService.createRoom(createRoomRequest);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createRoomResponse);
    }

    @GetMapping("/room/{roomCode}")
    public ResponseEntity<GameSession> getRoom(
            @PathVariable String roomCode) {
        return ResponseEntity.ok(
                gameService.getRoomByCode(roomCode.toUpperCase()));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ex.getMessage());
    }

    @ExceptionHandler({IllegalArgumentException.class,
            IllegalStateException.class})
    public ResponseEntity<String> handleBadRequest(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ex.getMessage());
    }

    @PostMapping("/room/{roomCode}/join")
    public ResponseEntity<JoinRoomResponse> joinRoom(@Valid @PathVariable String roomCode,
                                                            @RequestBody JoinRoomRequest joinRoomRequest) {
        return ResponseEntity.ok(gameService.joinRoom(roomCode, joinRoomRequest));
    }

    @PostMapping("/room/{roomCode}/start")
    public ResponseEntity<String> startGame(@PathVariable String roomCode,
                                            @RequestParam String userId) {
        GameSession gameSession = gameService.getRoomByCode(roomCode);
        if (!gameSession.getHostUserId().equals(userId))
            throw GameException.badRequest(
                    "Only the host can start the game");

        gameStateMachine.startGame(roomCode.toUpperCase());
        return ResponseEntity.ok("Game started");
    }

    @PostMapping("/room/{roomCode}/word")
    public ResponseEntity<String> wordChosen(
            @PathVariable String roomCode,
            @RequestParam String word) {
        gameStateMachine.wordChosen(roomCode.toUpperCase(), word);
        return ResponseEntity.ok("Word set, drawing started");
    }
}
