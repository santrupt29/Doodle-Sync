package com.pm.gameservice.repository;

import com.pm.gameservice.model.GameSession;
import com.pm.gameservice.model.GameState;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameSessionRepository extends MongoRepository<GameSession, String> {

    Optional<GameSession> findByRoomCode(String roomCode);

    boolean existsByRoomCode(String roomCode);

    List<GameSession> findByStateAndMaxPlayersGreaterThan(
            GameState state, int minPlayers);  // Find all rooms a player can join

    @Query("{ 'players.userId': ?0 }")
    List<GameSession> findByPlayerId(String userId);  // Find all games a specific user has played in

    long countByState(GameState state);

}
