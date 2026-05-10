package edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.entity.DefaultWorkoutExerciseEntity;

import java.util.List;

@Repository
public interface DefaultWorkoutExerciseRepository
        extends JpaRepository<DefaultWorkoutExerciseEntity, Long> {

    List<DefaultWorkoutExerciseEntity>
        findByDefaultWorkoutId(Long defaultWorkoutId);

    void deleteByDefaultWorkoutId(Long defaultWorkoutId);
}