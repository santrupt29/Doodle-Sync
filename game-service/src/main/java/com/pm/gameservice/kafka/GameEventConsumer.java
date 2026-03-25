package com.pm.gameservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class GameEventConsumer {
    private final KafkaTemplate<String, String> kafkaTemplate;

    @KafkaListener(topics = "game-events", groupId = "game-service-hints")
    public void consume(ConsumerRecord<String, String> record) {
        String value = record.value();
        if (value.startsWith("HINT:")) {
            // re-publish to a dedicated hints topic for WebSocket
            // (Week 3 — for now just log it)
            log.info("Hint received: {}", value);
        }
    }
}
