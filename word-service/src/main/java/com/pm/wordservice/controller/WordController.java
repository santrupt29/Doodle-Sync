package com.pm.wordservice.controller;

import com.pm.wordservice.model.Word;
import com.pm.wordservice.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/word")
@RequiredArgsConstructor
@Slf4j
public class WordController {
    private final WordRepository wordRepository;

    @GetMapping("/health")
    public ResponseEntity<String> wordHealth() {
        return ResponseEntity.ok("Word Service Running");
    }

    @GetMapping
    public ResponseEntity<String> getWord(@RequestParam(defaultValue = "MEDIUM") String difficulty) {
        log.info("Word requested for difficulty: {}", difficulty);

        Word word = wordRepository.findRandomByDifficulty(
                difficulty.toUpperCase());

        if (word == null)
            return ResponseEntity.ok("HOUSE");

        return ResponseEntity.ok(word.getWord().toUpperCase());
    }




}
