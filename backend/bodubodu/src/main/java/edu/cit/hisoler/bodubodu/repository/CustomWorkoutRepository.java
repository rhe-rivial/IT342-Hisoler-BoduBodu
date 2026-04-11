package edu.cit.hisoler.bodubodu.repository;

import edu.cit.hisoler.bodubodu.entity.CustomWorkoutEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomWorkoutRepository extends JpaRepository<CustomWorkoutEntity, Long> {
    List<CustomWorkoutEntity> findByUserId(Long userId);
}