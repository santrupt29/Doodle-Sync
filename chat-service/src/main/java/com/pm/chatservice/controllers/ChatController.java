package com.pm.chatservice.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chat")
public class ChatController {
    @GetMapping("/health")
    public String chatHealth() {
        return "Chat Server Running";
    }
}
