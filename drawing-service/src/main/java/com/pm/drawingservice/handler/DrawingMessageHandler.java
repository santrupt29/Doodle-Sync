package com.pm.drawingservice.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pm.drawingservice.dto.StrokeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
@RequiredArgsConstructor
public class DrawingMessageHandler {
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // Client sends stroke to: /app/room.{roomCode}.stroke
    // This method receives it, saves to Redis, and fans out.
    @MessageMapping("/room.{roomCode}.stroke")
    public void handleStroke(
        @DestinationVariable String roomCode,
        @Payload StrokeEvent strokeEvent) {

        strokeEvent.setRoomCode(roomCode);
        strokeEvent.setTimestamp(System.currentTimeMillis());
        try {
            String json = objectMapper.writeValueAsString(strokeEvent);

            // persist to Redis list for late-join replay
            String redisKey = "canvas:" + roomCode;
            redisTemplate.opsForList().rightPush(redisKey, json);

            // publish to Redis Pub/Sub for fan-out broadcast
            redisTemplate.convertAndSend("draw:" + roomCode, json);

            log.debug("Stroke saved — room: {} player: {} seq: {}",
                    roomCode, strokeEvent.getPlayerId(),
                    strokeEvent.getSequenceNum());
        } catch (Exception e) {
            log.error("Failed to process stroke in room {}: {}",
                    roomCode, e.getMessage());
        }
    }

   // REST endpoint: GET /draw/room/{roomCode}/replay
   // Returns all strokes for late-joining players.

    public java.util.List<StrokeEvent> getReplay(String roomCode) throws Exception {
        String redisKey = "canvas:" + roomCode;
        var rawStrokes = redisTemplate.opsForList()
                .range(redisKey, 0, -1);

        if (rawStrokes == null)
            return java.util.List.of();

        var result = new java.util.ArrayList<StrokeEvent>();
        for (String raw : rawStrokes) {
            result.add(objectMapper.readValue(
                    raw, StrokeEvent.class));
        }
        return result;
    }

    public void setCanvasTTL(String roomCode, int drawTimeSeconds) {
        String redisKey = "canvas:" + roomCode;
        redisTemplate.expire(redisKey, java.time.Duration.ofSeconds(drawTimeSeconds+30));
        log.info("Canvas TTL set for room {}: {}s",
                roomCode, drawTimeSeconds + 30);
    }




}
