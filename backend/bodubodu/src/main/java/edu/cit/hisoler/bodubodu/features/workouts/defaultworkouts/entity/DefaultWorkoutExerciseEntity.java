package edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "default_workout_exercises")
public class DefaultWorkoutExerciseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long defaultWorkoutExerciseId;

    private Long defaultWorkoutId;

    private Long exerciseId;

    private int sets;
    private int repetitions;
    private int restInterval;

    // GETTERS AND SETTERS

    public Long getDefaultWorkoutExerciseId() {
        return defaultWorkoutExerciseId;
    }

    public void setDefaultWorkoutExerciseId(Long defaultWorkoutExerciseId) {
        this.defaultWorkoutExerciseId = defaultWorkoutExerciseId;
    }

    public Long getDefaultWorkoutId() {
        return defaultWorkoutId;
    }

    public void setDefaultWorkoutId(Long defaultWorkoutId) {
        this.defaultWorkoutId = defaultWorkoutId;
    }

    public Long getExerciseId() {
        return exerciseId;
    }

    public void setExerciseId(Long exerciseId) {
        this.exerciseId = exerciseId;
    }

    public int getSets() {
        return sets;
    }

    public void setSets(int sets) {
        this.sets = sets;
    }

    public int getRepetitions() {
        return repetitions;
    }

    public void setRepetitions(int repetitions) {
        this.repetitions = repetitions;
    }

    public int getRestInterval() {
        return restInterval;
    }

    public void setRestInterval(int restInterval) {
        this.restInterval = restInterval;
    }
}