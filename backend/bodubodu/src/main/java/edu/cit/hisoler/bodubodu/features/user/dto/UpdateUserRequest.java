package edu.cit.hisoler.bodubodu.features.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * Request body for PUT /api/user/me
 * Password fields are optional — only sent when the user wants to change it.
 */
public class UpdateUserRequest {

    private String firstName;
    private String lastName;

    @Email(message = "Must be a valid email address")
    private String email;

    // Only required when changing password
    private String currentPassword;

    @Size(min = 8, message = "New password must be at least 8 characters")
    private String newPassword;

    // ── Getters & Setters ────────────────────────────────────────────────────

    public String getFirstName()                   { return firstName; }
    public void setFirstName(String firstName)     { this.firstName = firstName; }

    public String getLastName()                    { return lastName; }
    public void setLastName(String lastName)       { this.lastName = lastName; }

    public String getEmail()                       { return email; }
    public void setEmail(String email)             { this.email = email; }

    public String getCurrentPassword()             { return currentPassword; }
    public void setCurrentPassword(String p)       { this.currentPassword = p; }

    public String getNewPassword()                 { return newPassword; }
    public void setNewPassword(String p)           { this.newPassword = p; }
}