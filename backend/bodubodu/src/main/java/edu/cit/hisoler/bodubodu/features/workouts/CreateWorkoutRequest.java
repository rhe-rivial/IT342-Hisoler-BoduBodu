package edu.cit.hisoler.bodubodu.features.workouts;

import java.util.List;

public class CreateWorkoutRequest {

    private String name;
    private String description;
    private String difficultyLevel;
    private List<ExerciseInput> exercises;

    public static class ExerciseInput {
        private Long exerciseId;
        private int sets;
        private int repetitions;
        private int restInterval;
        private int exerciseOrder;

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

        public int getExerciseOrder() {
            return exerciseOrder;
        }

        public void setExerciseOrder(int exerciseOrder) {
            this.exerciseOrder = exerciseOrder;
        }
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDifficultyLevel() {
        return difficultyLevel;
    }

    public void setDifficultyLevel(String difficultyLevel) {
        this.difficultyLevel = difficultyLevel;
    }

    public List<ExerciseInput> getExercises() {
        return exercises;
    }

    public void setExercises(List<ExerciseInput> exercises) {
        this.exercises = exercises;
    }
}
