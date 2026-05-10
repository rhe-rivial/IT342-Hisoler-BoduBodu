package edu.cit.hisoler.bodubodu.features.workouts.history.repository;

import edu.cit.hisoler.bodubodu.features.user.entity.UserEntity;
import edu.cit.hisoler.bodubodu.features.workouts.history.entity.WorkoutSessionEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSessionEntity, Long> {

    // ── Basic queries ────────────────────────────────────────────────────────

    List<WorkoutSessionEntity> findByUserOrderByCompletedAtDesc(UserEntity user);

    List<WorkoutSessionEntity> findTop5ByUserOrderByCompletedAtDesc(UserEntity user);

    long countByUser(UserEntity user);

    long countByUserAndCompletedAtAfter(UserEntity user, LocalDateTime after);

    // ── Aggregates ───────────────────────────────────────────────────────────

    @Query("SELECT COALESCE(SUM(s.duration), 0) FROM WorkoutSessionEntity s WHERE s.user = :user")
    int sumDurationByUser(@Param("user") UserEntity user);

    @Query("SELECT COALESCE(SUM(s.exercises), 0) FROM WorkoutSessionEntity s WHERE s.user = :user")
    int sumExercisesByUser(@Param("user") UserEntity user);

    // ── Streak helpers ───────────────────────────────────────────────────────

    /**
     * Returns all completedAt timestamps for a user, newest first.
     * The streak calculation in DashboardController converts these to
     * LocalDate and deduplicates — no native SQL needed, no linter issues.
     */
    @Query("SELECT s.completedAt FROM WorkoutSessionEntity s WHERE s.user = :user ORDER BY s.completedAt DESC")
    List<LocalDateTime> findAllCompletedAtByUser(@Param("user") UserEntity user);

    // ── Recent with optional limit ───────────────────────────────────────────

    @Query("SELECT s FROM WorkoutSessionEntity s WHERE s.user = :user ORDER BY s.completedAt DESC LIMIT :limit")
    List<WorkoutSessionEntity> findRecentByUser(@Param("user") UserEntity user,
                                                @Param("limit") int limit);
}