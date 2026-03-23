package com.pm.userservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Builder.Default
    private int totalWins = 0;

    @Builder.Default
    private int gamesPlayed = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @PrePersist
    public void generateId() {
        if (this.id == null)
            this.id = java.util.UUID.randomUUID().toString();
    }
}
