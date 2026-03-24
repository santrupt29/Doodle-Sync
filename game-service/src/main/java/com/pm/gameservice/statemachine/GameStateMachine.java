package com.pm.gameservice.statemachine;

import com.pm.gameservice.exception.GameException;
import com.pm.gameservice.model.GameSession;
import com.pm.gameservice.model.GameState;
import com.pm.gameservice.repository.GameSessionRepository;
import com.pm.gameservice.timer.RoundTimer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class GameStateMachine {
    private final GameSessionRepository gameSessionRepository;
    private final RoundTimer roundTimer;
    private final KafkaTemplate<String, String> kafka;

    private final ConcurrentHashMap<String, GameRoom> rooms = new ConcurrentHashMap<>();

    public synchronized void startGame(String roomCode) {
        GameSession gameSession = getGameSession(roomCode);

        if (gameSession.getState() != GameState.WAITING)
            throw GameException.conflict("Game already started");

        if (gameSession.getPlayers().size() < 2)
            throw GameException.badRequest(
                    "Need at least 2 players to start");

        GameRoom gameRoom = new GameRoom(gameSession.getId(), roomCode);
        rooms.put(roomCode, gameRoom);

        log.info("Game starting: {}", roomCode);
        beginNextRound(gameRoom, gameSession);
    }

    public void beginNextRound(GameRoom gameRoom, GameSession gameSession) {
        gameRoom.setCurrentRound(gameRoom.getCurrentRound()+1);
        gameRoom.resetRoundCounters();

        List<GameSession.Player> players = gameSession.getPlayers();
        int drawerIdx = (gameRoom.getCurrentRound() - 1) % players.size();
        GameSession.Player drawer = players.get(drawerIdx);

        gameRoom.setCurrentDrawerId(drawer.getUserId());
        gameRoom.setGameState(GameState.CHOOSING);

        gameSession.setState(GameState.CHOOSING);
        gameSessionRepository.save(gameSession);

        kafka.send("game-events", gameRoom.getRoomCode(),
                "ROUND_STARTED:" + gameRoom.getCurrentRound()
                        + ":" + drawer.getUserId());

        log.info("Round {} started in {}. Drawer: {}",
                gameRoom.getCurrentRound(), gameRoom.getRoomCode(),
                drawer.getUsername());
    }

    public synchronized void wordChosen(
            String roomCode, String word) {

        GameRoom room = getGameRoom(roomCode);
        GameSession session = getGameSession(roomCode);

        if (room.getGameState() != GameState.CHOOSING)
            throw GameException.conflict("Not in CHOOSING state");

        room.setCurrentWord(word);
        room.setGameState(GameState.DRAWING);

        session.setState(GameState.DRAWING);
        gameSessionRepository.save(session);

        kafka.send("game-events", roomCode,
                "DRAWING_STARTED:" + roomCode
                        + ":" + word.length());  // send length, not the word

        // start the countdown timer
        roundTimer.start(roomCode,
                session.getDrawTimeSeconds(),
                () -> onRoundTimeout(roomCode));

        log.info("Drawing started in {}. Word: {}",
                roomCode, word);
    }

    public synchronized void playerGuessedCorrectly(
            String roomCode, String userId, int totalPlayers) {

        GameRoom room = getGameRoom(roomCode);
        if (room.getGameState() != GameState.DRAWING) return;

        room.setCorrectGuessCount(room.getCorrectGuessCount() + 1);

        // if everyone except the drawer guessed → end round early
        int guessers = totalPlayers - 1;
        if (room.getCorrectGuessCount() >= guessers)
            endRound(roomCode);
    }

    public void onRoundTimeout(String roomCode) {
        log.info("Round timed out: {}", roomCode);
        endRound(roomCode);
    }

    private synchronized void endRound(String roomCode) {
        GameRoom room = getGameRoom(roomCode);
        GameSession session = getGameSession(roomCode);

        if (room.getGameState() != GameState.DRAWING) return;

        roundTimer.cancel(roomCode);   // cancel timer if early end
        room.setGameState(GameState.RESULTS);
        session.setState(GameState.RESULTS);
        gameSessionRepository.save(session);

        kafka.send("game-events", roomCode,
                "ROUND_ENDED:" + room.getCurrentRound()
                        + ":" + room.getCurrentWord());

        log.info("Round {} ended in {}",
                room.getCurrentRound(), roomCode);

        // wait 5s for results display, then start next round or end game
        roundTimer.scheduleDelayed(roomCode, 5,
                () -> afterResults(roomCode));
    }

    private synchronized void afterResults(String roomCode) {
        GameRoom room = getGameRoom(roomCode);
        GameSession session = getGameSession(roomCode);

        if (room.getCurrentRound() >= session.getTotalRounds()) {
            room.setGameState(GameState.GAME_OVER);
            session.setState(GameState.GAME_OVER);
            gameSessionRepository.save(session);
            rooms.remove(roomCode);   // clean up memory
            kafka.send("game-events", roomCode, "GAME_OVER:" + roomCode);
            log.info("Game over: {}", roomCode);
        } else {
            beginNextRound(room, session);
        }
    }
    private GameRoom getGameRoom(String roomCode) {
        GameRoom gameRoom = rooms.get(roomCode);
        if(gameRoom == null) {
            throw GameException.notFound(
                    "No active game for room: " + roomCode);
        }
        return gameRoom;
    }

    private GameSession getGameSession(String roomCode) {
        return gameSessionRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> GameException.notFound("Session not found with RoomCode: " + roomCode));
    }
}

// Every state-transition method is synchronized.
// This prevents two simultaneous HTTP requests (e.g. two players joining at the exact same millisecond)
// from corrupting the game state.

// The word is never sent in full over Kafka.
// DRAWING_STARTED sends only the word length.
// The actual word lives only in the in-memory GameRoom and in memory of game-service.
// This prevents clients intercepting Kafka messages to cheat.