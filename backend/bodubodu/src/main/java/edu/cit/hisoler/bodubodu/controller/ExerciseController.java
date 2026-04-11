package edu.cit.hisoler.bodubodu.controller;

import edu.cit.hisoler.bodubodu.entity.ExerciseEntity;
import edu.cit.hisoler.bodubodu.repository.ExerciseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/exercises")
public class ExerciseController {

    private final ExerciseRepository exerciseRepo;

    public ExerciseController(ExerciseRepository exerciseRepo) {
        this.exerciseRepo = exerciseRepo;
    }

    // GET /api/v1/exercises  — public, no token needed
    @GetMapping
    public ResponseEntity<List<ExerciseEntity>> getAllExercises() {
        return ResponseEntity.ok(exerciseRepo.findAll());
    }

    // GET /api/v1/exercises/{id}  — public
    @GetMapping("/{id}")
    public ResponseEntity<?> getExerciseById(@PathVariable Long id) {
        return exerciseRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}