package com.pm.gameservice.timer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.*;

@Component
@Slf4j
public class RoundTimer {

    // One thread per active room - max 50 concurrent games
    private final ScheduledExecutorService scheduler =
            Executors.newScheduledThreadPool(50);

    private final ConcurrentHashMap<String, ScheduledFuture<?>> timers =
            new ConcurrentHashMap<>();

    public void start(String roomCode, int seconds, Runnable onTimeout) {
        cancel(roomCode);
        ScheduledFuture<?> future = scheduler.schedule(
                () -> {
                    try {
                        log.info("Timer fired for room: {}", roomCode);
                        onTimeout.run();
                    } catch (Exception e) {
                        log.error("Timer callback failed for {}: {}",
                                roomCode, e.getMessage());
                    } finally {
                        timers.remove(roomCode);
                    }
                },
                seconds, TimeUnit.SECONDS
        );

        timers.put(roomCode, future);
        log.info("Timer started for room {} — {}s", roomCode, seconds);
    }

    // Delay for result screen
    public void scheduleDelayed(String roomCode,
                                int seconds,
                                Runnable task) {
        ScheduledFuture<?> future = scheduler.schedule(
                () -> {
                    try { task.run(); }
                    catch (Exception e) {
                        log.error("Delayed task failed for {}: {}",
                                roomCode, e.getMessage());
                    } finally {
                        timers.remove(roomCode);
                    }
                },
                seconds, TimeUnit.SECONDS
        );
        timers.put(roomCode, future);
    }


    public void cancel(String roomCode) {
        ScheduledFuture<?> existing = timers.remove(roomCode);
        if (existing != null && !existing.isDone()) {
            existing.cancel(false); // cancel(false) not cancel(true).
            // true would interrupt a thread mid-execution —
            // dangerous if the callback is mid-way through a MongoDB write.
            // false means "don't start if not started yet, but let it finish if already running."
            log.info("Timer cancelled for room: {}", roomCode);
        }
    }

    @jakarta.annotation.PreDestroy
    public void shutdown() {
        scheduler.shutdownNow();
        log.info("RoundTimer scheduler shut down");
    }
//    @PreDestroy calls shutdownNow() when Spring shuts down —
//    prevents thread leaks during development restarts.
//    Without it, orphaned timer threads accumulate across IntelliJ hot-reloads.
}
