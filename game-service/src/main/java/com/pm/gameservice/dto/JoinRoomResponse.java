package com.pm.gameservice.dto;

import com.pm.gameservice.model.GameSession;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class JoinRoomResponse {
    private String sessionId;
    private String roomCode;
    private String state;
    private List<GameSession.Player> players;
    private int maxPlayers;
    private int totalRounds;
}
