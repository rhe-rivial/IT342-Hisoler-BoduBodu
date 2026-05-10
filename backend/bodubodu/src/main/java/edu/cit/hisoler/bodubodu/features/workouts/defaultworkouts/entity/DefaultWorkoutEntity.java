package edu.cit.hisoler.bodubodu.features.workouts.defaultworkouts.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "default_workouts")
public class DefaultWorkoutEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long defaultWorkoutId;

    private String name;

    private LocalDateTime createdAt = LocalDateTime.now();

    // GETTERS AND SETTERS

    public Long getDefaultWorkoutId() {
        return defaultWorkoutId;
    }

    public void setDefaultWorkoutId(Long defaultWorkoutId) {
        this.defaultWorkoutId = defaultWorkoutId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}