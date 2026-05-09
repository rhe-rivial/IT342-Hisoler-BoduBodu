package edu.cit.hisoler.bodubodu.controller;

import edu.cit.hisoler.bodubodu.dto.CreateWorkoutRequest;
import edu.cit.hisoler.bodubodu.service.DefaultWorkoutService;

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

        return ResponseEntity.status(201)
                .body(service.createWorkout(req));
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