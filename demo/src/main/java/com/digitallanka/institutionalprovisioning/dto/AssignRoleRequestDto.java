package com.digitallanka.institutionalprovisioning.dto;

import com.digitallanka.institutionalprovisioning.entity.Role;
import jakarta.validation.constraints.NotNull;

public class AssignRoleRequestDto {

    @NotNull(message = "Role is required")
    private Role role;

    // Getters and Setters
    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
