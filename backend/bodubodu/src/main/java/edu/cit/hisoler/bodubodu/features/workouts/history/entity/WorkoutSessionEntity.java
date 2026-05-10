package edu.cit.hisoler.bodubodu.features.workouts.history.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import edu.cit.hisoler.bodubodu.features.user.entity.UserEntity;

/**
 * Represents a single completed workout session for a user.
 * This is the source of truth for all dashboard/progress stats.
 *
 * A session can reference either a DefaultWorkout or a CustomWorkout.
 * Both workoutName and the foreign-key id are stored so the name
 * is preserved even if the workout is later deleted.
 */
@Entity
@Table(name = "workout_sessions")
public class WorkoutSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user who completed this session
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // Human-readable name snapshot (kept even if source workout is deleted)
    @Column(nullable = false)
    private String workoutName;

    // Optional FK to the source workout (nullable — user may delete it later)
    private Long defaultWorkoutId;
    private Long customWorkoutId;

    // Duration in minutes
    private Integer duration;

    // Number of exercises completed in this session
    private Integer exercises;

    // When the session was finished
    @Column(nullable = false)
    private LocalDateTime completedAt = LocalDateTime.now();

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId()                        { return id; }
    public void setId(Long id)                 { this.id = id; }

    public UserEntity getUser()                { return user; }
    public void setUser(UserEntity user)       { this.user = user; }

    public String getWorkoutName()             { return workoutName; }
    public void setWorkoutName(String n)       { this.workoutName = n; }

    public Long getDefaultWorkoutId()          { return defaultWorkoutId; }
    public void setDefaultWorkoutId(Long id)   { this.defaultWorkoutId = id; }

    public Long getCustomWorkoutId()           { return customWorkoutId; }
    public void setCustomWorkoutId(Long id)    { this.customWorkoutId = id; }

    public Integer getDuration()               { return duration; }
    public void setDuration(Integer duration)  { this.duration = duration; }

    public Integer getExercises()              { return exercises; }
    public void setExercises(Integer exercises){ this.exercises = exercises; }

    public LocalDateTime getCompletedAt()              { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt){ this.completedAt = completedAt; }
}