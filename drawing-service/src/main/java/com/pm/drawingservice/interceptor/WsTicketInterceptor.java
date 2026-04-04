package com.pm.drawingservice.interceptor;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/**
 * Validates one-time-use tickets during WebSocket handshake.
 *
 * The ticket was issued by user-service (POST /user/auth/ws-ticket)
 * and stored in Redis with a 30s TTL.
 *
 * On successful validation:
 *  - userId and username are stored in session attributes
 *  - ticket is deleted from Redis (one-time use)
 *
 * On failure:
 *  - handshake is rejected (returns false)
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class WsTicketInterceptor implements HandshakeInterceptor {

    private final StringRedisTemplate redisTemplate;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        String ticket = UriComponentsBuilder
                .fromUri(request.getURI())
                .build()
                .getQueryParams()
                .getFirst("ticket");

        if (ticket == null || ticket.isBlank()) {
            log.warn("WS handshake rejected — no ticket provided");
            return false;
        }

        String redisKey = "ws-ticket:" + ticket;
        String value = redisTemplate.opsForValue().getAndDelete(redisKey);

        if (value == null) {
            log.warn("WS handshake rejected — invalid or expired ticket");
            return false;
        }

        // value format: "userId:username"
        String[] parts = value.split(":", 2);
        attributes.put("userId", parts[0]);
        attributes.put("username", parts.length > 1 ? parts[1] : "unknown");

        log.info("WS handshake authenticated — user: {} ({})",
                parts.length > 1 ? parts[1] : "unknown", parts[0]);
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // no-op
    }
}
