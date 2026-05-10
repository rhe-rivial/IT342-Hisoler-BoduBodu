package edu.cit.hisoler.bodubodu.features.workouts.history.controller;

import edu.cit.hisoler.bodubodu.features.user.entity.UserEntity;
import edu.cit.hisoler.bodubodu.features.user.repository.UserRepository;
import edu.cit.hisoler.bodubodu.features.workouts.history.entity.WorkoutSessionEntity;
import edu.cit.hisoler.bodubodu.features.workouts.history.repository.WorkoutSessionRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * GET /api/workout-history
 *
 * Returns the full workout history for the authenticated user,
 * newest first. The frontend (Progress.jsx) uses this to populate
 * the calendar, recent workouts list, and weekly bar charts.
 */
@RestController
@RequestMapping("/api/workout-history")
@CrossOrigin(origins = "*")
public class WorkoutHistoryController {

    private final UserRepository userRepository;
    private final WorkoutSessionRepository sessionRepository;

    public WorkoutHistoryController(UserRepository userRepository,
                                    WorkoutSessionRepository sessionRepository) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
    }

    @GetMapping
    public ResponseEntity<?> getHistory(Authentication authentication) {
        UserEntity user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<WorkoutSessionEntity> sessions =
                sessionRepository.findByUserOrderByCompletedAtDesc(user);

        List<Map<String, Object>> result = sessions.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",          s.getId());
            m.put("workoutName", s.getWorkoutName());
            m.put("duration",    s.getDuration());
            m.put("exercises",   s.getExercises());
            m.put("completedAt", s.getCompletedAt());
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }
}