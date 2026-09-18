package com.smartlearning.controller;

import com.smartlearning.config.JwtAuthFilter.AuthenticatedUser;
import com.smartlearning.dto.AuthResponse;
import com.smartlearning.dto.LoginRequest;
import com.smartlearning.entity.User;
import com.smartlearning.repository.UserRepository;
import com.smartlearning.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Google login for regular users is NOT handled here — it's Spring Security's
 * built-in OAuth2 flow. The frontend simply sends the browser to
 * GET /oauth2/authorization/google; after Google redirects back,
 * OAuth2LoginSuccessHandler issues a JWT and redirects to the frontend with
 * it in the query string.
 *
 * This controller only covers the traditional admin login and account info.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.adminLogin(request.getUsername(), request.getPassword()));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        User user = userRepository.findById(principal.id())
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().name()
        ));
    }

    /**
     * JWTs are stateless, so "logout" is really just telling the client to
     * discard the token. Endpoint kept for a clean frontend contract (and as
     * the natural place to add token blacklisting later if needed).
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
