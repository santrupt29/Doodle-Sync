package com.pm.chatservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    private String type;         // CHAT, CORRECT, WRONG, CLOSE, HINT, SYSTEM
    private String username;
    private String message;
    private String playerId;
    private long timestamp;
}
