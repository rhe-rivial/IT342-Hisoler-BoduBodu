package edu.cit.hisoler.bodubodu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "custom_workouts")
public class CustomWorkoutEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long customWorkoutId;

    private Long userId;
    private String name;
    private LocalDateTime createdAt = LocalDateTime.now();

    // GETTERS AND SETTERS

    public Long getCustomWorkoutId() {
        return customWorkoutId;
    }

    public void setCustomWorkoutId(Long customWorkoutId) {
        this.customWorkoutId = customWorkoutId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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
