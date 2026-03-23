package com.pm.gameservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Bean
    public NewTopic gameEventsTopic() {
        return TopicBuilder.name("game-events")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic drawEventsTopic() {
        return TopicBuilder.name("draw-events")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic chatEventsTopic() {
        return TopicBuilder.name("chat-events")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic scoreEventsTopic() {
        return TopicBuilder.name("score-events")
                .partitions(3)
                .replicas(1)
                .build();
    }

}
