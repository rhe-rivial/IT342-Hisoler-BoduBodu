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

        workout.setName(req.getName());
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
        result.put("createdAt", saved.getCreatedAt());
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
}