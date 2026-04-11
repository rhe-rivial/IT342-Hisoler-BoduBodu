package edu.cit.hisoler.bodubodu.dto;

import java.util.List;

public class CreateWorkoutRequest {

    private String name;
    private List<ExerciseInput> exercises;

    public static class ExerciseInput {
        private Long exerciseId;
        private int sets;
        private int repetitions;
        private int restInterval;

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<ExerciseInput> getExercises() {
        return exercises;
    }

    public void setExercises(List<ExerciseInput> exercises) {
        this.exercises = exercises;
    }
}
