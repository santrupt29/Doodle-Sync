package com.pm.wordservice.repository;

import com.pm.wordservice.model.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface WordRepository extends JpaRepository<Word, Long> {
    @Query(value =
            "SELECT * FROM words WHERE difficulty = :difficulty " +
                    "ORDER BY RANDOM() LIMIT 1",
            nativeQuery = true)
    Word findRandomByDifficulty(String difficulty);
}
