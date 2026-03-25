package com.pm.userservice.service;

import com.pm.userservice.dto.AuthResponse;
import com.pm.userservice.dto.RegisterRequest;
import com.pm.userservice.model.User;
import com.pm.userservice.repository.UserRepository;
import com.pm.userservice.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(@RequestBody RegisterRequest registerRequest) {
        if(userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if(userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new IllegalArgumentException("Email already taken");
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .passwordHash(passwordEncoder.encode(registerRequest.getPassword()))
                .build();

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(
                saved.getId(), saved.getUsername());

        log.info("User registered: {}", saved.getUsername());
        return AuthResponse.builder()
                .token(token)
                .userId(saved.getId())
                .username(saved.getUsername())
                .build();
    }

    public AuthResponse login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPasswordHash()))
            throw new IllegalArgumentException("Invalid credentials");

        String token = jwtService.generateToken(
                user.getId(), user.getUsername());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .build();
    }

}
