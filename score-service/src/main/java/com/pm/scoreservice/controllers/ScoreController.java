package com.pm.scoreservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/score")
@RequiredArgsConstructor
public class ScoreController {

    private final RedisTemplate<String, String> redisTemplate;

    @GetMapping("/health")
    public String scoreHealth() {
        return "Score Service Running";
    }

    @GetMapping("/room/{roomCode}/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> leaderboard(@PathVariable String roomCode) {
        String key = "scores:" + roomCode;
        Set<ZSetOperations
                        .TypedTuple<String>> entries =
                redisTemplate.opsForZSet()
                        .reverseRangeWithScores(key, 0, -1);

        if (entries == null || entries.isEmpty())
            return ResponseEntity.ok(List.of());

        List<Map<String, Object>> leaderboardList = new ArrayList<>();
        int rank = 1;
        for (var entry : entries) {
            if(entry.getValue() == null || entry.getScore() == null)
                return ResponseEntity.ok(List.of());
            leaderboardList.add(Map.of(
                    "rank", rank++,
                    "userId", entry.getValue(),
                    "score", entry.getScore().intValue()
            ));
        }

        return ResponseEntity.ok(leaderboardList);
    }


}
