package com.pm.userservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Issues short-lived, one-time-use tickets for WebSocket authentication.
 *
 * Flow:
 *  1. Client calls POST /user/auth/ws-ticket with JWT (validated by gateway)
 *  2. Gateway forwards with X-User-Id and X-Username headers
 *  3. This endpoint generates a UUID ticket, stores in Redis with 30s TTL
 *  4. Client passes the ticket as a query param during WebSocket handshake
 *  5. Drawing/Chat service interceptor validates and deletes the ticket
 *
 * Why ticket-based auth?
 *  Browsers cannot send Authorization headers during WebSocket upgrade.
 *  A ticket is a one-time proxy for the JWT, scoped to a 30s window.
 */
@RestController
@RequestMapping("/user/auth")
@RequiredArgsConstructor
@Slf4j
public class WsTicketController {

    private final StringRedisTemplate redisTemplate;

    private static final Duration TICKET_TTL = Duration.ofSeconds(30);

    @PostMapping("/ws-ticket")
    public ResponseEntity<Map<String, String>> issueTicket(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Username") String username) {

        String ticket = UUID.randomUUID().toString();
        String value = userId + ":" + username;

        redisTemplate.opsForValue().set(
                "ws-ticket:" + ticket, value, TICKET_TTL);

        log.info("WS ticket issued for user {} ({}), expires in {}s",
                username, userId, TICKET_TTL.getSeconds());

        return ResponseEntity.ok(Map.of("ticket", ticket));
    }
}
