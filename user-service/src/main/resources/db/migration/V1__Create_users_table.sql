CREATE TABLE users (
                       id VARCHAR(36) PRIMARY KEY,
                       username VARCHAR(50) NOT NULL UNIQUE,
                       email VARCHAR(100) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       total_wins INT DEFAULT 0 NOT NULL,
                       games_played INT DEFAULT 0 NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, username, email, password_hash, total_wins, games_played, created_at)
VALUES
    ('e1b8c280-9273-4f9e-a8f2-3b8c1a9d4f11', 'santrupt29', 'santrupt@test.dev', 'dummy_hash_1', 15, 42, CURRENT_TIMESTAMP),
    ('c9a4d6f1-3b7e-4c8d-9a1f-2e8b5c4d6a7f', 'drawer_pro', 'pro@test.dev', 'dummy_hash_2', 120, 300, CURRENT_TIMESTAMP),
    ('f4b3a2c1-8d7e-4f6c-9b5a-1c2d3e4f5a6b', 'guest_player', 'guest@test.dev', 'dummy_hash_3', 0, 2, CURRENT_TIMESTAMP);