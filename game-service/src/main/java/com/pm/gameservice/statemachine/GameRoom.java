package com.pm.gameservice.statemachine;

import com.pm.gameservice.model.GameState;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.concurrent.ScheduledFuture;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class GameRoom {
    private final String sessionId;
    private final String roomCode;

    private volatile GameState gameState = GameState.WAITING;
    private volatile int currentRound = 0;
    private volatile String currentWord;
    private volatile String currentDrawerId;
    private volatile int correctGuessCount = 0;

    private volatile ScheduledFuture<?> timerFuture; // holds the scheduled timer future so we can cancel it

    public synchronized void resetRoundCounters() {
        this.correctGuessCount = 0;
        this.currentWord = null;
        this.currentDrawerId = null;
    }

}
