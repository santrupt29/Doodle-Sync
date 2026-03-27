package com.pm.drawingservice.controllers;

import com.pm.drawingservice.dto.StrokeEvent;
import com.pm.drawingservice.handler.DrawingMessageHandler;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/draw")
@RequiredArgsConstructor
public class DrawingController {
    private final DrawingMessageHandler handler;
    private final org.springframework.data.redis.core.RedisTemplate<String, String> redisTemplate;

    @GetMapping("/health")
    public ResponseEntity<String> drawHealth() {
        return ResponseEntity.ok("Drawing Service Running");
    }

    @GetMapping("/room/{roomCode}/replay")
    public ResponseEntity<List<StrokeEvent>> replay(
            @PathVariable String roomCode) throws Exception {
        return ResponseEntity.ok(handler.getReplay(roomCode));
    }

    @DeleteMapping("/room/{roomCode}/canvas")
    public ResponseEntity<Void> clearCanvas(
            @PathVariable String roomCode) {
        redisTemplate.delete("canvas:" + roomCode);
        return ResponseEntity.noContent().build();
    }

    // Returns the current word for the drawer to see.
    // The word is stored in Redis by game-service during wordChosen().
    @GetMapping("/room/{roomCode}/word")
    public ResponseEntity<String> getCurrentWord(
            @PathVariable String roomCode) {
        String word = redisTemplate.opsForValue().get("word:" + roomCode);
        if (word == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(word);
    }

}
