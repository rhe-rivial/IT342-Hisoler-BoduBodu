package edu.cit.hisoler.bodubodu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name")
    private String firstname;

    @Column(name = "last_name")
    private String lastname;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;
    private String role;
    private LocalDateTime createdAt = LocalDateTime.now();

    // GETTERS AND SETTERS

    public Long getUserId()               { return id; }
    public void setUserId(Long userId)    { this.id = userId; }

    public String getFirstName()              { return firstname; }
    public void setFirstName(String firstname){ this.firstname = firstname; }

    public String getLastName()               { return lastname; }
    public void setLastName(String lastname)  { this.lastname = lastname; }

    public String getEmail()              { return email; }
    public void setEmail(String email)    { this.email = email; }

    public String getPassword()           { return password; }
    public void setPassword(String pw)    { this.password = pw; }

    public String getRole()               { return role; }
    public void setRole(String role)      { this.role = role; }

    public LocalDateTime getCreatedAt()              { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt){ this.createdAt = createdAt; }
}