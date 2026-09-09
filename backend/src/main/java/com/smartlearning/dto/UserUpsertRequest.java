package com.smartlearning.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserUpsertRequest {
    @NotBlank
    private String name;
    @NotBlank
    @Email
    private String email;
    /** Only required when creating a user with traditional login (e.g. an admin). */
    private String password;
    private String role; // "USER" or "ADMIN"
}
