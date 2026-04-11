package edu.cit.hisoler.bodubodu.repository;

import edu.cit.hisoler.bodubodu.entity.CustomWorkoutExerciseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomWorkoutExerciseRepository extends JpaRepository<CustomWorkoutExerciseEntity, Long> {
    List<CustomWorkoutExerciseEntity> findByCustomWorkoutId(Long customWorkoutId);
    void deleteByCustomWorkoutId(Long customWorkoutId);
}