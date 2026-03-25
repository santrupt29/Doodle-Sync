package com.pm.wordservice.controller;

import com.pm.wordservice.model.Word;
import com.pm.wordservice.repository.WordRepository;
import com.pm.wordservice.service.HintService;
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
    private final HintService hintService;

    @GetMapping("/health")
    public ResponseEntity<String> wordHealth() {
        return ResponseEntity.ok("Word Service Running");
    }

    @GetMapping
    public ResponseEntity<String> getWord(@RequestParam(defaultValue = "MEDIUM") String difficulty,
                                          @RequestParam(required = false) String roomCode,
                                          @RequestParam(defaultValue = "90") int drawTime) {
        log.info("Word requested for difficulty: {}", difficulty);

        Word word = wordRepository.findRandomByDifficulty(
                difficulty.toUpperCase());

        String w = (word != null) ? word.getWord().toUpperCase() : "HOUSE";

        if (roomCode != null && !roomCode.isBlank())
            hintService.startHints(roomCode, w, drawTime);

        return ResponseEntity.ok(w);
    }




}
