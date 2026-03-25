package com.pm.userservice.controller;

import com.pm.userservice.dto.AuthResponse;
import com.pm.userservice.dto.LoginRequest;
import com.pm.userservice.dto.RegisterRequest;
import com.pm.userservice.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    @GetMapping("/health")
    public String userHealth() {
        return "User Service Running";
    }

    @PostMapping("/auth/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.register(registerRequest));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(
                authService.login(loginRequest.getUsername(),
                        loginRequest.getPassword()));
    }
}
