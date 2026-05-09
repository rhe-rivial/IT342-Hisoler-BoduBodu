package edu.cit.hisoler.bodubodu.repository;

import edu.cit.hisoler.bodubodu.entity.DefaultWorkoutEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DefaultWorkoutRepository
        extends JpaRepository<DefaultWorkoutEntity, Long> {
}