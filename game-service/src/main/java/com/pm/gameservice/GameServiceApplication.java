package com.pm.gameservice;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.kafka.core.KafkaTemplate;

@SpringBootApplication
@EnableDiscoveryClient
@EnableMongoAuditing    // required for @CreatedDate to auto-fill
public class GameServiceApplication {

    @Bean
    public CommandLineRunner testKafka(
            KafkaTemplate<String, String> kafka) {
        return args -> {
            kafka.send("draw-events", "room-001", "hello-from-game-service");
            System.out.println("Kafka: message sent to draw-events");
        };
    }

    public static void main(String[] args) {
        SpringApplication.run(GameServiceApplication.class, args);
    }

}
