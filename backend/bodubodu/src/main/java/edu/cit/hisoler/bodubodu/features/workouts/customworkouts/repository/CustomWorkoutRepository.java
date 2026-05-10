package edu.cit.hisoler.bodubodu.features.workouts.customworkouts.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.cit.hisoler.bodubodu.features.workouts.customworkouts.entity.CustomWorkoutEntity;

import java.util.List;

@Repository
public interface CustomWorkoutRepository extends JpaRepository<CustomWorkoutEntity, Long> {
    List<CustomWorkoutEntity> findByUserId(Long userId);
}