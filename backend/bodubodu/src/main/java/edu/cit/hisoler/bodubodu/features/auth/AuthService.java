package edu.cit.hisoler.bodubodu.features.auth;

import java.util.Collections;
import java.util.UUID;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import edu.cit.hisoler.bodubodu.features.auth.dto.GoogleAuthRequest;
import edu.cit.hisoler.bodubodu.features.auth.dto.LoginRequest;
import edu.cit.hisoler.bodubodu.features.auth.dto.RegisterRequest;
import edu.cit.hisoler.bodubodu.features.user.entity.UserEntity;
import edu.cit.hisoler.bodubodu.features.user.repository.UserRepository;
import edu.cit.hisoler.bodubodu.security.JwtService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String googleClientId;

    public AuthService(UserRepository userRepository,
                    PasswordEncoder passwordEncoder,
                    JwtService jwtService,
                    @Value("${google.client-id:}") String googleClientId) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleClientId = googleClientId;
    }

    // ✅ REGISTER
    public String register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists.");
        }

        UserEntity user = new UserEntity();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("ROLE_USER");

        userRepository.save(user);

        return "User registered successfully.";
    }

    // ✅ LOGIN
    public String login(LoginRequest request) {

        UserEntity user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        return jwtService.generateToken(user.getEmail(), user.getRole());
    }

    public String googleAuth(GoogleAuthRequest request) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new RuntimeException("Google authentication is not configured.");
        }

        GoogleIdToken.Payload payload = verifyGoogleCredential(request.getCredential());
        String email = payload.getEmail();

        if (email == null || email.isBlank() || !Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new RuntimeException("Google account email could not be verified.");
        }

        UserEntity user = userRepository.findByEmail(email)
            .orElseGet(() -> createGoogleUser(payload));

        return jwtService.generateToken(user.getEmail(), user.getRole());
    }

    private GoogleIdToken.Payload verifyGoogleCredential(String credential) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken == null) {
                throw new RuntimeException("Invalid Google credential.");
            }

            return idToken.getPayload();
        } catch (Exception e) {
            throw new RuntimeException("Invalid Google credential.");
        }
    }

    private UserEntity createGoogleUser(GoogleIdToken.Payload payload) {
        UserEntity user = new UserEntity();
        user.setEmail(payload.getEmail());
        user.setFirstName(readGoogleClaim(payload, "given_name", "Google"));
        user.setLastName(readGoogleClaim(payload, "family_name", "User"));
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setRole("ROLE_USER");
        return userRepository.save(user);
    }

    private String readGoogleClaim(GoogleIdToken.Payload payload, String key, String fallback) {
        Object value = payload.get(key);
        if (value instanceof String) {
            String stringValue = (String) value;
            if (!stringValue.isBlank()) {
                return stringValue;
            }
        }
        return fallback;
    }
}
