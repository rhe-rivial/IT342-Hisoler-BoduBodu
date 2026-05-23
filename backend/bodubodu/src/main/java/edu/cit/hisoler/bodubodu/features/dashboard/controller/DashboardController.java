package edu.cit.hisoler.bodubodu.features.dashboard.controller;

import edu.cit.hisoler.bodubodu.features.user.entity.UserEntity;
import edu.cit.hisoler.bodubodu.features.user.repository.UserRepository;
import edu.cit.hisoler.bodubodu.features.workouts.history.entity.WorkoutSessionEntity;
import edu.cit.hisoler.bodubodu.features.workouts.history.repository.WorkoutSessionRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final UserRepository userRepository;
    private final WorkoutSessionRepository sessionRepository;

    public DashboardController(UserRepository userRepository,
                               WorkoutSessionRepository sessionRepository) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
    }

    // ── GET /api/dashboard/stats ─────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication authentication) {
        UserEntity user = resolveUser(authentication);

        long totalWorkouts = sessionRepository.countByUser(user);

        // Start of current week (Monday 00:00)
        LocalDateTime startOfWeek = LocalDate.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .atStartOfDay();
        long workoutsThisWeek = sessionRepository.countByUserAndCompletedAtAfter(user, startOfWeek);

        int totalMinutes   = sessionRepository.sumDurationByUser(user);
        int totalExercises = sessionRepository.sumExercisesByUser(user);

        // Streak calculation — uses JPQL query, no native SQL
        List<LocalDateTime> timestamps = sessionRepository.findAllCompletedAtByUser(user);
        int[] streaks = calculateStreaks(timestamps);

        return ResponseEntity.ok(Map.of(
                "totalWorkouts",    totalWorkouts,
                "workoutsThisWeek", workoutsThisWeek,
                "totalMinutes",     totalMinutes,
                "totalExercises",   totalExercises,
                "currentStreak",    streaks[0],
                "longestStreak",    streaks[1]
        ));
    }

    // ── GET /api/dashboard/recent-workouts ───────────────────────────────────

    @GetMapping("/recent-workouts")
    public ResponseEntity<?> getRecentWorkouts(
            Authentication authentication,
            @RequestParam(defaultValue = "5") int limit) {

        UserEntity user = resolveUser(authentication);
        List<WorkoutSessionEntity> sessions = sessionRepository.findRecentByUser(user, limit);

        List<Map<String, Object>> result = sessions.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",          s.getId());
            m.put("workoutName", s.getWorkoutName());
            m.put("workoutType", s.getCustomWorkoutId() != null ? "CUSTOM" : "DEFAULT");
            m.put("defaultWorkoutId", s.getDefaultWorkoutId());
            m.put("customWorkoutId",  s.getCustomWorkoutId());
            m.put("duration",    s.getDuration());
            m.put("exercises",   s.getExercises());
            m.put("completedAt", s.getCompletedAt());
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // ── POST /api/dashboard/log-workout ─────────────────────────────────────
    // Called by the frontend when a user finishes a workout.

    @PostMapping("/log-workout")
    public ResponseEntity<?> logWorkout(
            Authentication authentication,
            @RequestBody LogWorkoutRequest req) {

        UserEntity user = resolveUser(authentication);

        WorkoutSessionEntity session = new WorkoutSessionEntity();
        session.setUser(user);
        session.setWorkoutName(req.workoutName());
        session.setDuration(req.duration());
        session.setExercises(req.exercises());
        session.setDefaultWorkoutId(req.defaultWorkoutId());
        session.setCustomWorkoutId(req.customWorkoutId());
        session.setCompletedAt(
                req.completedAt() != null ? req.completedAt() : LocalDateTime.now()
        );

        WorkoutSessionEntity saved = sessionRepository.save(session);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Workout logged."));
    }

    // ── Request record ───────────────────────────────────────────────────────

    public record LogWorkoutRequest(
            String workoutName,
            Integer duration,
            Integer exercises,
            Long defaultWorkoutId,
            Long customWorkoutId,
            LocalDateTime completedAt
    ) {}

    // ── Helpers ──────────────────────────────────────────────────────────────

    private UserEntity resolveUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Given all completedAt timestamps for a user (any order),
     * deduplicates to distinct calendar dates and returns [currentStreak, longestStreak].
     */
    private int[] calculateStreaks(List<LocalDateTime> timestamps) {
        if (timestamps == null || timestamps.isEmpty()) return new int[]{0, 0};

        // Deduplicate to distinct LocalDates, sorted newest first
        List<LocalDate> dates = timestamps.stream()
                .map(LocalDateTime::toLocalDate)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .toList();

        LocalDate today     = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        // Current streak: must include today or yesterday to be "active"
        int current = 0;
        if (!dates.isEmpty() && (dates.get(0).equals(today) || dates.get(0).equals(yesterday))) {
            LocalDate expected = dates.get(0);
            for (LocalDate d : dates) {
                if (d.equals(expected)) {
                    current++;
                    expected = expected.minusDays(1);
                } else {
                    break;
                }
            }
        }

        // Longest streak: scan all dates
        int longest = Math.max(1, current);
        int run     = 1;
        for (int i = 1; i < dates.size(); i++) {
            if (dates.get(i).equals(dates.get(i - 1).minusDays(1))) {
                run++;
                longest = Math.max(longest, run);
            } else {
                run = 1;
            }
        }

        return new int[]{current, longest};
    }
}
