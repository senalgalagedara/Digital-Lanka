package com.digitallanka.institutionalprovisioning.service.impl;

import com.digitallanka.institutionalprovisioning.dto.CreateRegistrationRequestDto;
import com.digitallanka.institutionalprovisioning.dto.RegistrationRequestResponseDto;
import com.digitallanka.institutionalprovisioning.entity.RegistrationRequest;
import com.digitallanka.institutionalprovisioning.entity.Role;
import com.digitallanka.institutionalprovisioning.entity.User;
import com.digitallanka.institutionalprovisioning.exception.DuplicateUserException;
import com.digitallanka.institutionalprovisioning.exception.UserNotFoundException;
import com.digitallanka.institutionalprovisioning.repository.RegistrationRequestRepository;
import com.digitallanka.institutionalprovisioning.repository.UserRepository;
import com.digitallanka.institutionalprovisioning.service.RegistrationRequestService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RegistrationRequestServiceImpl implements RegistrationRequestService {

    private final RegistrationRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationRequestServiceImpl(RegistrationRequestRepository requestRepository,
                                           UserRepository userRepository,
                                           PasswordEncoder passwordEncoder) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public RegistrationRequestResponseDto createRequest(CreateRegistrationRequestDto requestDto) {
        // 1. Check if user already exists
        if (userRepository.existsByNic(requestDto.getNic())) {
            throw new DuplicateUserException("User with NIC '" + requestDto.getNic() + "' already exists");
        }

        if (userRepository.existsByEmail(requestDto.getEmail())) {
            throw new DuplicateUserException("User with Email '" + requestDto.getEmail() + "' already exists");
        }

        // 2. Check if a pending registration request already exists
        if (requestRepository.existsByNicAndStatus(requestDto.getNic(), "PENDING")) {
            throw new DuplicateUserException("A pending registration request already exists for NIC '" + requestDto.getNic() + "'");
        }

        if (requestRepository.existsByEmailAndStatus(requestDto.getEmail(), "PENDING")) {
            throw new DuplicateUserException("A pending registration request already exists for Email '" + requestDto.getEmail() + "'");
        }

        // 3. Create request entity
        RegistrationRequest req = new RegistrationRequest();
        req.setNic(requestDto.getNic());
        req.setFullName(requestDto.getFullName());
        req.setEmail(requestDto.getEmail());
        req.setPassword(passwordEncoder.encode(requestDto.getPassword()));
        req.setRole(requestDto.getRole());
        req.setStatus("PENDING");

        if (requestDto.getRole() == Role.ADMIN) {
            req.setDepartment(requestDto.getDepartment());
        } else if (requestDto.getRole() == Role.OFFICER) {
            req.setBatchNumber(requestDto.getBatchNumber());
            req.setRank(requestDto.getRank());
            req.setPoliceStation(requestDto.getPoliceStation());
        }

        RegistrationRequest savedReq = requestRepository.save(req);
        return convertToDto(savedReq);
    }

    @Override
    public List<RegistrationRequestResponseDto> getAllRequests() {
        return requestRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RegistrationRequestResponseDto approveRequest(Long id) {
        RegistrationRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Registration request not found with id: " + id));

        if (!"PENDING".equals(req.getStatus())) {
            throw new IllegalStateException("Registration request is already " + req.getStatus());
        }

        // Check again if user exists (to prevent concurrency issues)
        if (userRepository.existsByNic(req.getNic())) {
            throw new DuplicateUserException("User with NIC '" + req.getNic() + "' already exists");
        }

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new DuplicateUserException("User with Email '" + req.getEmail() + "' already exists");
        }

        // Create new User
        User user = new User();
        user.setNic(req.getNic());
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setPassword(req.getPassword()); // already encoded
        user.setRole(req.getRole());

        if (req.getRole() == Role.ADMIN) {
            user.setDepartment(req.getDepartment());
        } else if (req.getRole() == Role.OFFICER) {
            user.setBatchNumber(req.getBatchNumber());
            user.setRank(req.getRank());
            user.setPoliceStation(req.getPoliceStation());
        }

        userRepository.save(user);

        // Update request status
        req.setStatus("APPROVED");
        RegistrationRequest savedReq = requestRepository.save(req);

        return convertToDto(savedReq);
    }

    @Override
    @Transactional
    public RegistrationRequestResponseDto rejectRequest(Long id) {
        RegistrationRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Registration request not found with id: " + id));

        if (!"PENDING".equals(req.getStatus())) {
            throw new IllegalStateException("Registration request is already " + req.getStatus());
        }

        req.setStatus("REJECTED");
        RegistrationRequest savedReq = requestRepository.save(req);

        return convertToDto(savedReq);
    }

    private RegistrationRequestResponseDto convertToDto(RegistrationRequest req) {
        return new RegistrationRequestResponseDto(
                req.getId(),
                req.getNic(),
                req.getFullName(),
                req.getEmail(),
                req.getRole(),
                req.getDepartment(),
                req.getBatchNumber(),
                req.getRank(),
                req.getPoliceStation(),
                req.getStatus(),
                req.getCreatedAt()
        );
    }
}
