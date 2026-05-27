package edu.cit.hisoler.bodubodu.features.workouts.customworkouts.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.cit.hisoler.bodubodu.features.workouts.customworkouts.entity.CustomWorkoutEntity;

import java.util.List;

@Repository
public interface CustomWorkoutRepository extends JpaRepository<CustomWorkoutEntity, Long> {
    @Query(value = "SELECT * FROM custom_workouts WHERE user_id = :userId ORDER BY created_at DESC", nativeQuery = true)
    List<CustomWorkoutEntity> findByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT COUNT(*) FROM custom_workouts WHERE user_id = :userId", nativeQuery = true)
    long countByUserId(@Param("userId") Long userId);
}
