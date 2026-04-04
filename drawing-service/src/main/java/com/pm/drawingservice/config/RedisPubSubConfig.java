package com.pm.drawingservice.config;

import com.pm.drawingservice.pubsub.StrokeBroadcastListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

/**
 * Configures Redis Pub/Sub for stroke fan-out.
 *
 * Subscribes to all channels matching "draw:*" so that any stroke
 * published to "draw:{roomCode}" is picked up and broadcast to
 * STOMP subscribers.
 */
@Configuration
public class RedisPubSubConfig {

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            StrokeBroadcastListener strokeBroadcastListener) {

        RedisMessageListenerContainer container =
                new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(
                strokeBroadcastListener,
                new PatternTopic("draw:*"));
        return container;
    }
}
