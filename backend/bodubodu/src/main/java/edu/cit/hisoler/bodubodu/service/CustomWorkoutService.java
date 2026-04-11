package edu.cit.hisoler.bodubodu.service;

import edu.cit.hisoler.bodubodu.dto.CreateWorkoutRequest;
import edu.cit.hisoler.bodubodu.entity.CustomWorkoutEntity;
import edu.cit.hisoler.bodubodu.entity.CustomWorkoutExerciseEntity;
import edu.cit.hisoler.bodubodu.entity.ExerciseEntity;
import edu.cit.hisoler.bodubodu.entity.UserEntity;
import edu.cit.hisoler.bodubodu.repository.CustomWorkoutExerciseRepository;
import edu.cit.hisoler.bodubodu.repository.CustomWorkoutRepository;
import edu.cit.hisoler.bodubodu.repository.ExerciseRepository;
import edu.cit.hisoler.bodubodu.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CustomWorkoutService {

    private final CustomWorkoutRepository workoutRepo;
    private final CustomWorkoutExerciseRepository workoutExRepo;
    private final ExerciseRepository exerciseRepo;
    private final UserRepository userRepo;

    public CustomWorkoutService(
            CustomWorkoutRepository workoutRepo,
            CustomWorkoutExerciseRepository workoutExRepo,
            ExerciseRepository exerciseRepo,
            UserRepository userRepo) {
        this.workoutRepo   = workoutRepo;
        this.workoutExRepo = workoutExRepo;
        this.exerciseRepo  = exerciseRepo;
        this.userRepo      = userRepo;
    }

    // ── GET ALL WORKOUTS FOR USER ──────────────────────────────────
    public List<Map<String, Object>> getWorkoutsForUser(String email) {
        UserEntity user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<CustomWorkoutEntity> workouts = workoutRepo.findByUserId(user.getUserId());

        return workouts.stream().map(w -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("customWorkoutId", w.getCustomWorkoutId());
            map.put("name", w.getName());
            map.put("createdAt", w.getCreatedAt());

            List<CustomWorkoutExerciseEntity> exList = workoutExRepo.findByCustomWorkoutId(w.getCustomWorkoutId());
            List<Map<String, Object>> exercises = exList.stream().map(ex -> {
                Map<String, Object> exMap = new LinkedHashMap<>();
                exMap.put("customWorkoutExerciseId", ex.getCustomWorkoutExerciseId());
                exMap.put("exerciseId", ex.getExerciseId());
                exMap.put("sets", ex.getSets());
                exMap.put("repetitions", ex.getRepetitions());
                exMap.put("restInterval", ex.getRestInterval());
                // Include exercise name for display
                exerciseRepo.findById(ex.getExerciseId()).ifPresent(e -> {
                    exMap.put("exerciseName", e.getName());
                    exMap.put("difficultyLevel", e.getDifficultyLevel());
                    exMap.put("targetMuscleGroup", e.getTargetMuscleGroup());
                });
                return exMap;
            }).collect(Collectors.toList());

            map.put("exercises", exercises);
            return map;
        }).collect(Collectors.toList());
    }

    // ── CREATE WORKOUT ─────────────────────────────────────────────
    @Transactional
    public Map<String, Object> createWorkout(String email, CreateWorkoutRequest req) {
        UserEntity user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate name
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Workout name is required");
        }
        if (req.getExercises() == null || req.getExercises().isEmpty()) {
            throw new IllegalArgumentException("At least one exercise is required");
        }

        // Validate all exerciseIds exist
        for (CreateWorkoutRequest.ExerciseInput ex : req.getExercises()) {
            exerciseRepo.findById(ex.getExerciseId())
                .orElseThrow(() -> new RuntimeException("Exercise not found: " + ex.getExerciseId()));
        }

        // Save workout
        CustomWorkoutEntity workout = new CustomWorkoutEntity();
        workout.setUserId(user.getUserId());
        workout.setName(req.getName().trim());
        workout.setCreatedAt(LocalDateTime.now());
        CustomWorkoutEntity saved = workoutRepo.save(workout);

        // Save exercises
        List<Map<String, Object>> savedExercises = new ArrayList<>();
        for (CreateWorkoutRequest.ExerciseInput exInput : req.getExercises()) {
            CustomWorkoutExerciseEntity cwe = new CustomWorkoutExerciseEntity();
            cwe.setCustomWorkoutId(saved.getCustomWorkoutId());
            cwe.setExerciseId(exInput.getExerciseId());
            cwe.setSets(exInput.getSets());
            cwe.setRepetitions(exInput.getRepetitions());
            cwe.setRestInterval(exInput.getRestInterval());
            workoutExRepo.save(cwe);

            Map<String, Object> exMap = new LinkedHashMap<>();
            exMap.put("exerciseId", exInput.getExerciseId());
            exMap.put("sets", exInput.getSets());
            exMap.put("repetitions", exInput.getRepetitions());
            exMap.put("restInterval", exInput.getRestInterval());
            exerciseRepo.findById(exInput.getExerciseId()).ifPresent(e -> exMap.put("exerciseName", e.getName()));
            savedExercises.add(exMap);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("customWorkoutId", saved.getCustomWorkoutId());
        result.put("name", saved.getName());
        result.put("createdAt", saved.getCreatedAt());
        result.put("exercises", savedExercises);
        return result;
    }

    // ── UPDATE WORKOUT ─────────────────────────────────────────────
    @Transactional
    public Map<String, Object> updateWorkout(String email, Long workoutId, CreateWorkoutRequest req) {
        UserEntity user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CustomWorkoutEntity workout = workoutRepo.findById(workoutId)
                .orElseThrow(() -> new RuntimeException("Workout not found"));

        if (!workout.getUserId().equals(user.getUserId())) {
            throw new RuntimeException("Not authorized to edit this workout");
        }

        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Workout name is required");
        }
        if (req.getExercises() == null || req.getExercises().isEmpty()) {
            throw new IllegalArgumentException("At least one exercise is required");
        }

        workout.setName(req.getName().trim());
        workoutRepo.save(workout);

        // Delete old exercises and re-insert
        workoutExRepo.deleteByCustomWorkoutId(workoutId);

        List<Map<String, Object>> savedExercises = new ArrayList<>();
        for (CreateWorkoutRequest.ExerciseInput exInput : req.getExercises()) {
            CustomWorkoutExerciseEntity cwe = new CustomWorkoutExerciseEntity();
            cwe.setCustomWorkoutId(workoutId);
            cwe.setExerciseId(exInput.getExerciseId());
            cwe.setSets(exInput.getSets());
            cwe.setRepetitions(exInput.getRepetitions());
            cwe.setRestInterval(exInput.getRestInterval());
            workoutExRepo.save(cwe);

            Map<String, Object> exMap = new LinkedHashMap<>();
            exMap.put("exerciseId", exInput.getExerciseId());
            exMap.put("sets", exInput.getSets());
            exMap.put("repetitions", exInput.getRepetitions());
            exMap.put("restInterval", exInput.getRestInterval());
            exerciseRepo.findById(exInput.getExerciseId()).ifPresent(e -> exMap.put("exerciseName", e.getName()));
            savedExercises.add(exMap);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("customWorkoutId", workout.getCustomWorkoutId());
        result.put("name", workout.getName());
        result.put("createdAt", workout.getCreatedAt());
        result.put("exercises", savedExercises);
        return result;
    }

    // ── DELETE WORKOUT ─────────────────────────────────────────────
    @Transactional
    public void deleteWorkout(String email, Long workoutId) {
        UserEntity user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CustomWorkoutEntity workout = workoutRepo.findById(workoutId)
                .orElseThrow(() -> new RuntimeException("Workout not found"));

        if (!workout.getUserId().equals(user.getUserId())) {
            throw new RuntimeException("Not authorized to delete this workout");
        }

        workoutExRepo.deleteByCustomWorkoutId(workoutId);
        workoutRepo.deleteById(workoutId);
    }
}