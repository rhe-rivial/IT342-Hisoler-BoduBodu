package edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.entity.DefaultWorkoutEntity;

@Repository
public interface DefaultWorkoutRepository
        extends JpaRepository<DefaultWorkoutEntity, Long> {
}