package edu.cit.hisoler.bodubodu.features.workouts.customworkouts.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.cit.hisoler.bodubodu.features.workouts.customworkouts.entity.CustomWorkoutExerciseEntity;

import java.util.List;

@Repository
public interface CustomWorkoutExerciseRepository extends JpaRepository<CustomWorkoutExerciseEntity, Long> {
    List<CustomWorkoutExerciseEntity> findByCustomWorkoutId(Long customWorkoutId);
    void deleteByCustomWorkoutId(Long customWorkoutId);
}