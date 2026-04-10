package edu.cit.hisoler.bodubodu.controller;

import edu.cit.hisoler.bodubodu.dto.LoginRequest;
import edu.cit.hisoler.bodubodu.dto.RegisterRequest;
import edu.cit.hisoler.bodubodu.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ✅ REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (RuntimeException e) {
            String msg = e.getMessage();
            if (msg != null && msg.contains("Email already exists")) {
                return ResponseEntity.status(409).body("Email is already registered.");
            }
            return ResponseEntity.status(400).body("Registration failed: " + msg);
        }
    }

    // ✅ LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body("Incorrect email or password.");
        }
    }
}