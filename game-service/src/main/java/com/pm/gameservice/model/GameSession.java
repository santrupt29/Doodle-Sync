package com.pm.gameservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "game_sessions")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GameSession {

    @Id
    private String id;

    @Indexed(unique = true)
    private String roomCode;  // XK92PL

    private GameState state;

    @Builder.Default
    private List<Player> players = new ArrayList<>();

    @Builder.Default
    private List<Round> rounds = new ArrayList<>();

    private int maxPlayers;
    private int totalRounds;
    private int drawTimeSeconds;
    private String hostUserId;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Player {
        private String userId;
        private String username;
        private int score;
        private boolean isDrawing;
        private boolean isHost;
        private boolean isConnected;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Round {
        private int roundNumber;
        private String word;
        private String drawerId;
        @Builder.Default
        private List<String> correctGuessers = new ArrayList<>();
        private LocalDateTime startedAt;
        private LocalDateTime endedAt;
    }
}
