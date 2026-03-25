package com.pm.gameservice.service;

import com.pm.gameservice.client.WordServiceClient;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
@RequiredArgsConstructor
public class WordFetchService {
    private final WordServiceClient wordClient;

    private static final String[] EASY_FALLBACKS =
            {"CAT", "DOG", "SUN", "HOUSE", "FISH"};
    private static final String[] MEDIUM_FALLBACKS =
            {"GUITAR", "CASTLE", "BRIDGE", "ROCKET", "MIRROR"};
    private static final String[] HARD_FALLBACKS =
            {"TELESCOPE", "LABYRINTH", "KALEIDOSCOPE"};

    @CircuitBreaker(name = "word-service", fallbackMethod = "fallbackWord")
    @TimeLimiter(name = "word-service")
    @Retry(name = "word-service")
    public CompletableFuture<String> fetchWord(String difficulty) {
        return CompletableFuture.supplyAsync(() -> {
            String word = wordClient.getWord(difficulty);
            log.info("Word fetched from word-service: {}", word);
            return word;
        });
    }

    // fallback -> when circuit is OPEN or call times out
    public CompletableFuture<String> fallbackWord(
            String difficulty, Throwable t) {

        log.warn("word-service unavailable ({}), using fallback. Cause: {}",
                difficulty, t.getMessage());

        String[] pool = switch (difficulty.toUpperCase()) {
            case "EASY" -> EASY_FALLBACKS;
            case "HARD" -> HARD_FALLBACKS;
            default    -> MEDIUM_FALLBACKS;
        };

        String fallback = pool[(int)(Math.random() * pool.length)];
        log.info("Fallback word selected: {}", fallback);
        return CompletableFuture.completedFuture(fallback);
    }
}


// @TimeLimiter requires CompletableFuture as the return type —
// it cannot wrap a plain synchronous method.
// This is why fetchWord returns CompletableFuture<String> even though
// the underlying Feign call is synchronous.