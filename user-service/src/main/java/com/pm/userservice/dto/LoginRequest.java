package com.pm.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank
    @Size(min=3, max=50)
    private String username;

    @NotBlank @Size(min=6)
    private String password;
}
