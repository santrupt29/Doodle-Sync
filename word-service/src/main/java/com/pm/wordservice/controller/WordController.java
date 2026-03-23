package com.pm.wordservice.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/word")
public class WordController {
    @GetMapping("/health")
    public String wordHealth() {
        return "Word Service Running";
    }
}
