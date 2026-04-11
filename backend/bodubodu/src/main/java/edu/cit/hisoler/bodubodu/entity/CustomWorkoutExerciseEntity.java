package edu.cit.hisoler.bodubodu.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "custom_workout_exercises")
public class CustomWorkoutExerciseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long customWorkoutExerciseId;

    private Long customWorkoutId;
    private Long exerciseId;

    private int sets;
    private int repetitions;
    private int restInterval;

    // GETTERS AND SETTERS

    public Long getCustomWorkoutExerciseId() {
        return customWorkoutExerciseId;
    }

    public void setCustomWorkoutExerciseId(Long customWorkoutExerciseId) {
        this.customWorkoutExerciseId = customWorkoutExerciseId;
    }

    public Long getCustomWorkoutId() {
        return customWorkoutId;
    }

    public void setCustomWorkoutId(Long customWorkoutId) {
        this.customWorkoutId = customWorkoutId;
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