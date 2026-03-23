package com.pm.scoreservice.kafka;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class KafkaConsumer {
    @KafkaListener(
            topics = "draw-events",
            groupId = "score-service"
    )
    public void consume(ConsumerRecord<String, String> record) {
        log.info("Score-service received from draw-events → key: {}, value: {}",
                record.key(), record.value());
    }
}
