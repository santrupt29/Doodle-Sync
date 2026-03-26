package com.pm.drawingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StrokeEvent {

    private String roomCode;
    private String playerId;

    // Line
    private double x1;
    private double y1;
    private double x2;
    private double y2;

    // Brush
    private String color;
    private int width;
    private boolean isEraser;

    private long timestamp;
    private int sequenceNum; // sequenceNum is a client-side counter that increments per stroke.
                            // When a late-joining player replays strokes from Redis, they can sort by sequenceNum
                            // to guarantee correct draw order even if network reordering occurred.

}
