package com.pm.gameservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(
        name = "word-service"
)

public interface WordServiceClient {

    @GetMapping("/word")
    String getWord(@RequestParam("difficulty") String difficulty,
                   @RequestParam("roomCode") String roomCode,
                   @RequestParam("drawTime") int drawTime);
}



// The name in @FeignClient is how Eureka looks up the service.
// It must exactly match spring.application.name: word-service in word-service's application.yml —
// case-sensitive. No URL, no port — Feign resolves it dynamically via Eureka.
