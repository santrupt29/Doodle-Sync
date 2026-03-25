package com.pm.wordservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class HintService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ScheduledExecutorService scheduler =
            Executors.newScheduledThreadPool(20);
    private final ConcurrentHashMap<String, ScheduledFuture<?>> hintTasks =
            new ConcurrentHashMap<>();

    public void startHints(String roomCode, String word,
                           int drawTimeSeconds) {
        stopHints(roomCode);
        char[] revealed = new char[word.length()];
        Arrays.fill(revealed, '_');

        List<Integer> positions = new ArrayList<>();
        for (int i = 0; i < word.length(); i++) positions.add(i);
        Collections.shuffle(positions);

        int maxHints = Math.max(0, (drawTimeSeconds / 15) - 1);
        int hintCount = Math.min(maxHints, positions.size());

        for (int i = 0; i < hintCount; i++) {
            final int hintIndex = i;
            final int pos = positions.get(i);

            ScheduledFuture<?> scheduledFuture = scheduler.schedule(() -> {
                revealed[pos] = word.charAt(pos);
                String hint = new String(revealed);
                log.info("Hint for room {}: {}", roomCode, hint);
                kafkaTemplate.send("game-events", roomCode,
                        "HINT:" + roomCode + ":" + hint);
            }, 15L * (hintIndex + 1), TimeUnit.SECONDS);

            hintTasks.put(roomCode + "-hint-" + i, scheduledFuture);
        }

        log.info("Started {} hints for room {} (word len={})",
                hintCount, roomCode, word.length());

    }

    public void stopHints(String roomCode) {
        hintTasks.entrySet().removeIf(e -> {
            if(e.getKey().startsWith(roomCode)) {
                e.getValue().cancel(false);
                return true;
            }
            return false;
        });
    }


}
