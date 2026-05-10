package edu.cit.hisoler.bodubodu.features.exercises.controller;

import edu.cit.hisoler.bodubodu.features.exercises.entity.ExerciseEntity;
import edu.cit.hisoler.bodubodu.features.exercises.repository.ExerciseRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class ExerciseController {

    private final ExerciseRepository exerciseRepo;

    public ExerciseController(ExerciseRepository exerciseRepo) {
        this.exerciseRepo = exerciseRepo;
    }

    // =====================================================
    // PUBLIC
    // =====================================================

    @GetMapping("/api/v1/exercises")
    public ResponseEntity<List<ExerciseEntity>> getAllExercises() {
        return ResponseEntity.ok(exerciseRepo.findAll());
    }

    @GetMapping("/api/v1/exercises/{id}")
    public ResponseEntity<?> getExerciseById(@PathVariable Long id) {

        return exerciseRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // =====================================================
    // ADMIN
    // =====================================================

    @PostMapping("/api/admin/exercises")
    public ResponseEntity<?> createExercise(
            @RequestBody ExerciseEntity exercise) {

        ExerciseEntity saved = exerciseRepo.save(exercise);

        return ResponseEntity.status(201).body(saved);
    }

    @PutMapping("/api/admin/exercises/{id}")
    public ResponseEntity<?> updateExercise(
            @PathVariable Long id,
            @RequestBody ExerciseEntity updatedExercise) {

        return exerciseRepo.findById(id)
                .map(exercise -> {

                    exercise.setName(updatedExercise.getName());
                    exercise.setDescription(updatedExercise.getDescription());
                    exercise.setDifficultyLevel(updatedExercise.getDifficultyLevel());
                    exercise.setTargetMuscleGroup(updatedExercise.getTargetMuscleGroup());
                    exercise.setVideo(updatedExercise.getVideo());
                    exercise.setImage(updatedExercise.getImage());

                    exerciseRepo.save(exercise);

                    return ResponseEntity.ok(exercise);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/admin/exercises/{id}")
    public ResponseEntity<?> deleteExercise(
            @PathVariable Long id) {

        if (!exerciseRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        exerciseRepo.deleteById(id);

        return ResponseEntity.ok(
                Map.of("message", "Exercise deleted successfully")
        );
    }
}