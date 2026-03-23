package com.pm.gameservice.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CreateRoomResponse {
    private String sessionId;
    private String roomCode;
    private String state;
    private int maxPlayers;
    private int totalRounds;
    private int drawTimeSeconds;
    private LocalDateTime createdAt;
}
