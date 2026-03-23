package com.pm.scoreservice.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/score")
public class ScoreController {
    @GetMapping("/health")
    public String scoreHealth() {
        return "Score Service Running";
    }
}
