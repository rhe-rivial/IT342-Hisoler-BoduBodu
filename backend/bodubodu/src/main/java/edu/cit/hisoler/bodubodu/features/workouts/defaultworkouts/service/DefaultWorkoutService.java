package edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.service;

import edu.cit.hisoler.bodubodu.features.exercises.repository.ExerciseRepository;
import edu.cit.hisoler.bodubodu.features.workouts.CreateWorkoutRequest;
import edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.entity.DefaultWorkoutEntity;
import edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.entity.DefaultWorkoutExerciseEntity;
import edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.repository.DefaultWorkoutExerciseRepository;
import edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.repository.DefaultWorkoutRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DefaultWorkoutService {

    private final DefaultWorkoutRepository workoutRepo;
    private final DefaultWorkoutExerciseRepository workoutExRepo;
    private final ExerciseRepository exerciseRepo;

    public DefaultWorkoutService(
            DefaultWorkoutRepository workoutRepo,
            DefaultWorkoutExerciseRepository workoutExRepo,
            ExerciseRepository exerciseRepo) {

        this.workoutRepo = workoutRepo;
        this.workoutExRepo = workoutExRepo;
        this.exerciseRepo = exerciseRepo;
    }

    // =====================================================
    // GET ALL
    // =====================================================

    public List<Map<String, Object>> getAllWorkouts() {

        List<DefaultWorkoutEntity> workouts = workoutRepo.findAll();

        return workouts.stream().map(w -> {

            Map<String, Object> map = new LinkedHashMap<>();

            map.put("defaultWorkoutId", w.getDefaultWorkoutId());
            map.put("name", w.getName());
            map.put("description", w.getDescription());
            map.put("difficultyLevel", normalizeDifficulty(w.getDifficultyLevel()));
            map.put("createdAt", w.getCreatedAt());

            List<DefaultWorkoutExerciseEntity> exList =
                    workoutExRepo.findByDefaultWorkoutId(
                            w.getDefaultWorkoutId()
                    );

            List<Map<String, Object>> exercises =
                    exList.stream().map(ex -> {

                        Map<String, Object> exMap =
                                new LinkedHashMap<>();

                        exMap.put("exerciseId", ex.getExerciseId());
                        exMap.put("sets", ex.getSets());
                        exMap.put("repetitions", ex.getRepetitions());
                        exMap.put("restInterval", ex.getRestInterval());

                        exerciseRepo.findById(ex.getExerciseId())
                                .ifPresent(e -> {
                                    exMap.put("exerciseName", e.getName());
                                    exMap.put("difficultyLevel", e.getDifficultyLevel());
                                    exMap.put("targetMuscleGroup", e.getTargetMuscleGroup());
                                    exMap.put("video", e.getVideo());
                                });

                        return exMap;

                    }).collect(Collectors.toList());

            map.put("exercises", exercises);

            return map;

        }).collect(Collectors.toList());
    }

    // =====================================================
    // CREATE
    // =====================================================

    @Transactional
    public Map<String, Object> createWorkout(
            CreateWorkoutRequest req) {

        DefaultWorkoutEntity workout =
                new DefaultWorkoutEntity();

        validateRequest(req);

        workout.setName(req.getName().trim());
        workout.setDescription(req.getDescription());
        workout.setDifficultyLevel(normalizeDifficulty(req.getDifficultyLevel()));
        workout.setCreatedAt(LocalDateTime.now());

        DefaultWorkoutEntity saved =
                workoutRepo.save(workout);

        List<Map<String, Object>> savedExercises =
                new ArrayList<>();

        for (CreateWorkoutRequest.ExerciseInput exInput
                : req.getExercises()) {

            DefaultWorkoutExerciseEntity ex =
                    new DefaultWorkoutExerciseEntity();

            ex.setDefaultWorkoutId(saved.getDefaultWorkoutId());
            ex.setExerciseId(exInput.getExerciseId());
            ex.setSets(exInput.getSets());
            ex.setRepetitions(exInput.getRepetitions());
            ex.setRestInterval(exInput.getRestInterval());

            workoutExRepo.save(ex);

            Map<String, Object> exMap =
                    new LinkedHashMap<>();

            exMap.put("exerciseId", exInput.getExerciseId());
            exMap.put("sets", exInput.getSets());
            exMap.put("repetitions", exInput.getRepetitions());
            exMap.put("restInterval", exInput.getRestInterval());

            savedExercises.add(exMap);
        }

        Map<String, Object> result =
                new LinkedHashMap<>();

        result.put("defaultWorkoutId",
                saved.getDefaultWorkoutId());

        result.put("name", saved.getName());
        result.put("description", saved.getDescription());
        result.put("difficultyLevel", saved.getDifficultyLevel());
        result.put("createdAt", saved.getCreatedAt());
        result.put("exercises", savedExercises);

        return result;
    }

    // =====================================================
    // UPDATE
    // =====================================================

    @Transactional
    public Map<String, Object> updateWorkout(
            Long id,
            CreateWorkoutRequest req) {

        DefaultWorkoutEntity workout = workoutRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Default workout not found"));

        validateRequest(req);

        workout.setName(req.getName().trim());
        workout.setDescription(req.getDescription());
        workout.setDifficultyLevel(normalizeDifficulty(req.getDifficultyLevel()));
        workoutRepo.save(workout);

        workoutExRepo.deleteByDefaultWorkoutId(id);

        List<Map<String, Object>> savedExercises =
                new ArrayList<>();

        for (CreateWorkoutRequest.ExerciseInput exInput
                : req.getExercises()) {

            DefaultWorkoutExerciseEntity ex =
                    new DefaultWorkoutExerciseEntity();

            ex.setDefaultWorkoutId(id);
            ex.setExerciseId(exInput.getExerciseId());
            ex.setSets(exInput.getSets());
            ex.setRepetitions(exInput.getRepetitions());
            ex.setRestInterval(exInput.getRestInterval());

            workoutExRepo.save(ex);

            Map<String, Object> exMap =
                    new LinkedHashMap<>();

            exMap.put("exerciseId", exInput.getExerciseId());
            exMap.put("sets", exInput.getSets());
            exMap.put("repetitions", exInput.getRepetitions());
            exMap.put("restInterval", exInput.getRestInterval());

            savedExercises.add(exMap);
        }

        Map<String, Object> result =
                new LinkedHashMap<>();

        result.put("defaultWorkoutId", workout.getDefaultWorkoutId());
        result.put("name", workout.getName());
        result.put("description", workout.getDescription());
        result.put("difficultyLevel", workout.getDifficultyLevel());
        result.put("createdAt", workout.getCreatedAt());
        result.put("exercises", savedExercises);

        return result;
    }

    // =====================================================
    // DELETE
    // =====================================================

    @Transactional
    public void deleteWorkout(Long id) {

        workoutExRepo.deleteByDefaultWorkoutId(id);

        workoutRepo.deleteById(id);
    }

    private void validateRequest(CreateWorkoutRequest req) {
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Workout name is required");
        }
        if (req.getExercises() == null || req.getExercises().isEmpty()) {
            throw new IllegalArgumentException("At least one exercise is required");
        }
        for (CreateWorkoutRequest.ExerciseInput ex : req.getExercises()) {
            exerciseRepo.findById(ex.getExerciseId())
                    .orElseThrow(() -> new RuntimeException("Exercise not found: " + ex.getExerciseId()));
        }
    }

    private String normalizeDifficulty(String difficultyLevel) {
        if (difficultyLevel == null || difficultyLevel.trim().isEmpty()) {
            return "Beginner";
        }
        return difficultyLevel.trim();
    }
}
