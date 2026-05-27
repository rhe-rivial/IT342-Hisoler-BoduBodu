package edu.cit.hisoler.bodubodu.features.workouts.customworkouts.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.cit.hisoler.bodubodu.features.workouts.customworkouts.entity.CustomWorkoutExerciseEntity;

import java.util.List;

@Repository
public interface CustomWorkoutExerciseRepository extends JpaRepository<CustomWorkoutExerciseEntity, Long> {
    List<CustomWorkoutExerciseEntity> findByCustomWorkoutId(Long customWorkoutId);

    @Query(value = "SELECT * FROM custom_workout_exercises WHERE custom_workout_id = :customWorkoutId ORDER BY custom_workout_exercise_id ASC", nativeQuery = true)
    List<CustomWorkoutExerciseEntity> findOrderedByCustomWorkoutId(@Param("customWorkoutId") Long customWorkoutId);

    void deleteByCustomWorkoutId(Long customWorkoutId);
}
