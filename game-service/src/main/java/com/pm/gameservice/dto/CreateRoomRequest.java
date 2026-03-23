package com.pm.gameservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateRoomRequest {

    @NotBlank(message = "userId is required")
    private String userId;

    @NotBlank(message = "username is required")
    private String username;

    @Min(value = 2, message = "minimum 2 players")
    @Max(value = 8, message = "maximum 8 players")
    private int maxPlayers = 8;

    @Min(value = 2, message = "minimum 2 rounds")
    @Max(value = 6, message = "maximum 6 rounds")
    private int totalRounds = 3;

    @Min(value = 60, message = "minimum 60 seconds draw time")
    @Max(value = 120, message = "maximum 120 seconds draw time")
    private int drawTimeSeconds = 90;
}
