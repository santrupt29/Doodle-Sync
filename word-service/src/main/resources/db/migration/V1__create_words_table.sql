CREATE TABLE words (
                       id      BIGSERIAL PRIMARY KEY,
                       word    VARCHAR(100) NOT NULL,
                       difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('EASY','MEDIUM','HARD'))
);

INSERT INTO words (word, difficulty) VALUES
                                         ('cat', 'EASY'), ('dog', 'EASY'), ('sun', 'EASY'), ('house', 'EASY'),
                                         ('tree', 'EASY'), ('fish', 'EASY'), ('book', 'EASY'), ('bird', 'EASY'),
                                         ('car', 'EASY'), ('ball', 'EASY'), ('moon', 'EASY'), ('star', 'EASY'),
                                         ('guitar', 'MEDIUM'), ('castle', 'MEDIUM'), ('bridge', 'MEDIUM'),
                                         ('rocket', 'MEDIUM'), ('jungle', 'MEDIUM'), ('mirror', 'MEDIUM'),
                                         ('compass', 'MEDIUM'), ('lantern', 'MEDIUM'), ('umbrella', 'MEDIUM'),
                                         ('telescope', 'HARD'), ('archipelago', 'HARD'), ('kaleidoscope', 'HARD'),
                                         ('labyrinth', 'HARD'), ('hieroglyph', 'HARD'), ('champagne', 'HARD');