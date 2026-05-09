package edu.cit.hisoler.bodubodu.repository;

import edu.cit.hisoler.bodubodu.entity.DefaultWorkoutExerciseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DefaultWorkoutExerciseRepository
        extends JpaRepository<DefaultWorkoutExerciseEntity, Long> {

    List<DefaultWorkoutExerciseEntity>
        findByDefaultWorkoutId(Long defaultWorkoutId);

    void deleteByDefaultWorkoutId(Long defaultWorkoutId);
}