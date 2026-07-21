package com.digitallanka.institutionalprovisioning.service.impl;

import com.digitallanka.institutionalprovisioning.dto.CreateUserRequestDto;
import com.digitallanka.institutionalprovisioning.dto.UpdateUserRequestDto;
import com.digitallanka.institutionalprovisioning.dto.UserResponseDto;
import com.digitallanka.institutionalprovisioning.entity.Role;
import com.digitallanka.institutionalprovisioning.entity.User;
import com.digitallanka.institutionalprovisioning.exception.DuplicateUserException;
import com.digitallanka.institutionalprovisioning.exception.UserNotFoundException;
import com.digitallanka.institutionalprovisioning.repository.UserRepository;
import com.digitallanka.institutionalprovisioning.service.UserManagementService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponseDto createUser(CreateUserRequestDto request) {
        if (userRepository.existsByNic(request.getNic())) {
            throw new DuplicateUserException("User with NIC '" + request.getNic() + "' already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateUserException("User with Email '" + request.getEmail() + "' already exists");
        }

        User user = new User();
        user.setNic(request.getNic());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());

        // Conditional assignment based on roles to maintain clean state
        if (request.getRole() == Role.ADMIN) {
            user.setDepartment(request.getDepartment());
            user.setBatchNumber(null);
            user.setRank(null);
            user.setPoliceStation(null);
        } else if (request.getRole() == Role.OFFICER) {
            user.setDepartment(null);
            user.setBatchNumber(request.getBatchNumber());
            user.setRank(request.getRank());
            user.setPoliceStation(request.getPoliceStation());
        } else {
            user.setDepartment(null);
            user.setBatchNumber(null);
            user.setRank(null);
            user.setPoliceStation(null);
        }

        User savedUser = userRepository.save(user);
        return convertToDto(savedUser);
    }

    @Override
    public UserResponseDto updateUser(Long id, UpdateUserRequestDto request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        userRepository.findByNic(request.getNic()).ifPresent(existingUser -> {
            if (!existingUser.getId().equals(id)) {
                throw new DuplicateUserException("User with NIC '" + request.getNic() + "' already exists");
            }
        });

        userRepository.findByEmail(request.getEmail()).ifPresent(existingUser -> {
            if (!existingUser.getId().equals(id)) {
                throw new DuplicateUserException("User with Email '" + request.getEmail() + "' already exists");
            }
        });

        user.setNic(request.getNic());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        user.setRole(request.getRole());

        // Conditional assignment based on roles to maintain clean state
        if (request.getRole() == Role.ADMIN) {
            user.setDepartment(request.getDepartment());
            user.setBatchNumber(null);
            user.setRank(null);
            user.setPoliceStation(null);
        } else if (request.getRole() == Role.OFFICER) {
            user.setDepartment(null);
            user.setBatchNumber(request.getBatchNumber());
            user.setRank(request.getRank());
            user.setPoliceStation(request.getPoliceStation());
        } else {
            user.setDepartment(null);
            user.setBatchNumber(null);
            user.setRank(null);
            user.setPoliceStation(null);
        }

        User updatedUser = userRepository.save(user);
        return convertToDto(updatedUser);
    }

    @Override
    public UserResponseDto updateUserRole(Long id, Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        user.setRole(role);
        
        // Clean up role-specific fields if switching roles
        if (role == Role.ADMIN) {
            user.setBatchNumber(null);
            user.setRank(null);
            user.setPoliceStation(null);
        } else if (role == Role.OFFICER) {
            user.setDepartment(null);
        } else {
            user.setDepartment(null);
            user.setBatchNumber(null);
            user.setRank(null);
            user.setPoliceStation(null);
        }

        User updatedUser = userRepository.save(user);
        return convertToDto(updatedUser);
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        // Prevent deletion of system super-admins if necessary, but we will allow it if they request CRUD.
        userRepository.delete(user);
    }

    private UserResponseDto convertToDto(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getNic(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getDepartment(),
                user.getBatchNumber(),
                user.getRank(),
                user.getPoliceStation(),
                user.getCreatedAt()
        );
    }
}
