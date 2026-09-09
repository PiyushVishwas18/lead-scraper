package com.leadscraper.backend.controller;

import com.leadscraper.backend.dto.auth.AuthUserResponse;
import com.leadscraper.backend.dto.auth.RegisterRequest;
import com.leadscraper.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.leadscraper.backend.dto.auth.LoginRequest;
import com.leadscraper.backend.dto.auth.LoginResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthUserResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthUserResponse response = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        LoginResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }
}