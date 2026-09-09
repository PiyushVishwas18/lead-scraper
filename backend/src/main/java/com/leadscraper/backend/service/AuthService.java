package com.leadscraper.backend.service;

import com.leadscraper.backend.dto.auth.AuthUserResponse;
import com.leadscraper.backend.dto.auth.RegisterRequest;
import com.leadscraper.backend.entity.Role;
import com.leadscraper.backend.entity.User;
import com.leadscraper.backend.entity.UserRole;
import com.leadscraper.backend.repository.RoleRepository;
import com.leadscraper.backend.repository.UserRepository;
import com.leadscraper.backend.repository.UserRoleRepository;

import com.leadscraper.backend.service.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.leadscraper.backend.dto.auth.LoginRequest;
import com.leadscraper.backend.dto.auth.LoginResponse;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthUserResponse register(RegisterRequest request) {

        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new IllegalStateException("USER role is not configured"));

        Instant now = Instant.now();

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setStatus("ACTIVE");
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        User savedUser = userRepository.save(user);

        UserRole userRoleLink = new UserRole(savedUser, userRole);
        userRoleRepository.save(userRoleLink);

        return new AuthUserResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFirstName(),
                savedUser.getLastName(),
                List.of(userRole.getName()));
    }

    public LoginResponse login(LoginRequest request) {

        String email = request.email().trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("User account is not active");
        }

        String token = jwtService.generateToken(user.getEmail());

        return new LoginResponse(
                token,
                "Bearer",
                3600);
    }
}