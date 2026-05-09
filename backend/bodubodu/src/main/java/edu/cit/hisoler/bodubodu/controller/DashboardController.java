package edu.cit.hisoler.bodubodu.controller;

import edu.cit.hisoler.bodubodu.entity.UserEntity;
import edu.cit.hisoler.bodubodu.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final UserRepository userRepository;

    public DashboardController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * GET /api/dashboard/stats
     * Returns summary stats for the logged-in user.
     *
     * Once you have WorkoutSession / WorkoutLog entities, replace the
     * placeholder values below with real repository queries.
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication authentication) {
        String email = authentication.getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ── Replace these with real queries when you have a WorkoutSession table ──
        int totalWorkouts    = 0; // e.g. workoutSessionRepo.countByUser(user)
        int workoutsThisWeek = 0; // e.g. workoutSessionRepo.countByUserAndDateAfter(user, startOfWeek)
        int totalMinutes     = 0; // e.g. workoutSessionRepo.sumDurationByUser(user)
        int currentStreak    = 0; // calculate from session dates
        // ─────────────────────────────────────────────────────────────────────────

        return ResponseEntity.ok(Map.of(
                "totalWorkouts",    totalWorkouts,
                "workoutsThisWeek", workoutsThisWeek,
                "totalMinutes",     totalMinutes,
                "currentStreak",    currentStreak
        ));
    }

    /**
     * GET /api/dashboard/recent-workouts
     * Returns the user's 5 most recent workout sessions.
     *
     * Replace the empty list with a real repository query once you have
     * a WorkoutSession / WorkoutLog entity.
     */
    @GetMapping("/recent-workouts")
    public ResponseEntity<?> getRecentWorkouts(Authentication authentication) {
        // e.g. return ResponseEntity.ok(
        //   workoutSessionRepo.findTop5ByUserOrderByCompletedAtDesc(user)
        // );
        return ResponseEntity.ok(java.util.List.of());
    }
}