package edu.cit.hisoler.bodubodu.controller;

import edu.cit.hisoler.bodubodu.dto.CreateWorkoutRequest;
import edu.cit.hisoler.bodubodu.service.CustomWorkoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/custom-workouts")
public class CustomWorkoutController {

    private final CustomWorkoutService service;

    public CustomWorkoutController(CustomWorkoutService service) {
        this.service = service;
    }

    // GET /api/user/custom-workouts
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMyWorkouts(Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(service.getWorkoutsForUser(email));
    }

    // POST /api/user/custom-workouts
    @PostMapping
    public ResponseEntity<?> createWorkout(
            Authentication auth,
            @RequestBody CreateWorkoutRequest req) {
        try {
            String email = auth.getName();
            Map<String, Object> result = service.createWorkout(email, req);
            return ResponseEntity.status(201).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    // PUT /api/user/custom-workouts/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateWorkout(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody CreateWorkoutRequest req) {
        try {
            String email = auth.getName();
            Map<String, Object> result = service.updateWorkout(email, id, req);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    // DELETE /api/user/custom-workouts/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWorkout(
            Authentication auth,
            @PathVariable Long id) {
        try {
            String email = auth.getName();
            service.deleteWorkout(email, id);
            return ResponseEntity.ok(Map.of("message", "Workout deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }
}