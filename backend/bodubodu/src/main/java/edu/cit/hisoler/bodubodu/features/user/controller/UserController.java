package edu.cit.hisoler.bodubodu.features.user.controller;

import edu.cit.hisoler.bodubodu.features.user.dto.UpdateUserRequest;
import edu.cit.hisoler.bodubodu.features.user.entity.UserEntity;
import edu.cit.hisoler.bodubodu.features.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ── GET /api/user/me ─────────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        UserEntity user = resolveUser(authentication);
        return ResponseEntity.ok(toResponse(user));
    }

    // ── PUT /api/user/me ─────────────────────────────────────────────────────

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(
            Authentication authentication,
            @Valid @RequestBody UpdateUserRequest req) {

        UserEntity user = resolveUser(authentication);

        // ── Name & email ──────────────────────────────────────────────────
        if (req.getFirstName() != null && !req.getFirstName().isBlank()) {
            user.setFirstName(req.getFirstName().trim());
        }
        if (req.getLastName() != null && !req.getLastName().isBlank()) {
            user.setLastName(req.getLastName().trim());
        }
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            // Ensure new email isn't already taken by another account
            String newEmail = req.getEmail().trim().toLowerCase();
            if (!newEmail.equals(user.getEmail())) {
                boolean taken = userRepository.findByEmail(newEmail)
                        .filter(other -> !other.getUserId().equals(user.getUserId()))
                        .isPresent();
                if (taken) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Email is already in use."));
                }
                user.setEmail(newEmail);
            }
        }

        // ── Password change (optional) ────────────────────────────────────
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (req.getCurrentPassword() == null || req.getCurrentPassword().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Current password is required."));
            }
            if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Current password is incorrect."));
            }
            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        }

        userRepository.save(user);
        return ResponseEntity.ok(toResponse(user));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private UserEntity resolveUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /** Shapes a UserEntity into the JSON the frontend expects. */
    private Map<String, Object> toResponse(UserEntity user) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",        user.getUserId());
        m.put("firstName", user.getFirstName());
        m.put("lastName",  user.getLastName());
        m.put("email",     user.getEmail());
        m.put("role",      user.getRole());
        m.put("createdAt", user.getCreatedAt());
        return m;
    }
}