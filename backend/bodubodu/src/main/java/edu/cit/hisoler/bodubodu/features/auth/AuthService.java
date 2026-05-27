package edu.cit.hisoler.bodubodu.features.auth;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import edu.cit.hisoler.bodubodu.features.auth.dto.ForgotPasswordRequest;
import edu.cit.hisoler.bodubodu.features.auth.dto.GoogleAuthRequest;
import edu.cit.hisoler.bodubodu.features.auth.dto.LoginRequest;
import edu.cit.hisoler.bodubodu.features.auth.dto.RegisterRequest;
import edu.cit.hisoler.bodubodu.features.auth.dto.ResetPasswordRequest;
import edu.cit.hisoler.bodubodu.features.user.entity.UserEntity;
import edu.cit.hisoler.bodubodu.features.user.repository.UserRepository;
import edu.cit.hisoler.bodubodu.security.JwtService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String googleClientId;
    private final JavaMailSender mailSender;
    private final String resetPasswordUrl;
    private final String mailFrom;

    public AuthService(UserRepository userRepository,
                    PasswordEncoder passwordEncoder,
                    JwtService jwtService,
                    JavaMailSender mailSender,
                    @Value("${google.client-id:}") String googleClientId,
                    @Value("${app.reset-password-url:http://localhost:3000/reset-password}") String resetPasswordUrl,
                    @Value("${spring.mail.properties.mail.smtp.from:no-reply@bodubodu.app}") String mailFrom) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleClientId = googleClientId;
        this.mailSender = mailSender;
        this.resetPasswordUrl = resetPasswordUrl;
        this.mailFrom = mailFrom;
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

    public void sendPasswordResetEmail(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setPasswordResetToken(token);
            user.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusMinutes(30));
            userRepository.save(user);

            sendResetEmail(user, token);
        });
    }

    public void resetPassword(ResetPasswordRequest request) {
        UserEntity user = userRepository.findByPasswordResetToken(request.getToken())
            .orElseThrow(() -> new RuntimeException("Invalid or expired password reset link."));

        LocalDateTime expiresAt = user.getPasswordResetTokenExpiresAt();
        if (expiresAt == null || expiresAt.isBefore(LocalDateTime.now())) {
            user.setPasswordResetToken(null);
            user.setPasswordResetTokenExpiresAt(null);
            userRepository.save(user);
            throw new RuntimeException("Invalid or expired password reset link.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        userRepository.save(user);
    }

    private void sendResetEmail(UserEntity user, String token) {
        String resetLink = resetPasswordUrl + "?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(user.getEmail());
        message.setSubject("Reset your BoduBodu password");
        message.setText(
            "Hi " + user.getFirstName() + ",\n\n" +
            "We received a request to reset your BoduBodu password.\n\n" +
            "Reset your password here:\n" + resetLink + "\n\n" +
            "This link expires in 30 minutes. If you did not request this, you can ignore this email.\n\n" +
            "BoduBodu"
        );
        mailSender.send(message);
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
