package com.pm.drawingservice.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/draw")
public class DrawingController {
    @GetMapping("/health")
    public String drawHealth() {
        return "Drawing Service Running";
    }
}
