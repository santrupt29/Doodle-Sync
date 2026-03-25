package com.pm.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@Slf4j
@Order(-1)
public class JwtAuthFilter implements GlobalFilter {

    @Value("${jwt.secret}")
    private String secret;

    private static final List<String> WHITELIST = List.of(
            "/user/auth/register",
            "/user/auth/login",
            "/actuator/health",
            "/ws"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange,
                             GatewayFilterChain chain) {

        String path = exchange.getRequest()
                .getURI().getPath();

        // skip auth for whitelisted paths
        boolean isWhitelisted = WHITELIST.stream()
                .anyMatch(path::startsWith);
        if (isWhitelisted) return chain.filter(exchange);

        // extract Authorization header
        String authHeader = exchange.getRequest()
                .getHeaders()
                .getFirst("Authorization");

        if (authHeader == null
                || !authHeader.startsWith("Bearer ")) {
            return reject(exchange, "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(secret.getBytes())
                            instanceof javax.crypto.SecretKey sk ? sk :
                            (javax.crypto.SecretKey) Keys.hmacShaKeyFor(
                                    secret.getBytes()))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // forward userId + username as headers to downstream services
            ServerHttpRequest mutated = exchange.getRequest()
                    .mutate()
                    .header("X-User-Id", claims.getSubject())
                    .header("X-Username",
                            claims.get("username", String.class))
                    .build();

            return chain.filter(
                    exchange.mutate().request(mutated).build());

        } catch (JwtException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return reject(exchange, "Invalid or expired token");
        }
    }

    private Mono<Void> reject(ServerWebExchange exchange,
                              String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }
}



// The filter adds X-User-Id and X-Username headers before forwarding the request downstream.
// Your game-service, chat-service etc. can read these headers directly instead of decoding the JWT themselves —
// only the gateway ever touches JWT logic.

// The JWT secret in api-gateway and user-service must be identical —
// both read from the same JWT_SECRET env var. user-service signs with it,
// api-gateway verifies with it. If they differ, every token is rejected with 401.