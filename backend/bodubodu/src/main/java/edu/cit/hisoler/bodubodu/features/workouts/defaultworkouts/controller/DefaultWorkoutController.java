package edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.controller;

import edu.cit.hisoler.bodubodu.features.workouts.CreateWorkoutRequest;
import edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.service.DefaultWorkoutService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class DefaultWorkoutController {

    private final DefaultWorkoutService service;

    public DefaultWorkoutController(
            DefaultWorkoutService service) {

        this.service = service;
    }

    // =====================================================
    // PUBLIC
    // =====================================================

    @GetMapping("/api/v1/default-workouts")
    public ResponseEntity<?> getAll() {

        return ResponseEntity.ok(
                service.getAllWorkouts()
        );
    }

    // =====================================================
    // ADMIN
    // =====================================================

    @PostMapping("/api/admin/default-workouts")
    public ResponseEntity<?> create(
            @RequestBody CreateWorkoutRequest req) {

        try {
            return ResponseEntity.status(201)
                    .body(service.createWorkout(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/api/admin/default-workouts/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody CreateWorkoutRequest req) {

        try {
            return ResponseEntity.ok(
                    service.updateWorkout(id, req)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/api/admin/default-workouts/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id) {

        service.deleteWorkout(id);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Default workout deleted successfully"
                )
        );
    }
}
