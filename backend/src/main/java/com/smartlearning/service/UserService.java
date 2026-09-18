package com.smartlearning.service;

import com.smartlearning.config.JwtUtil;
import com.smartlearning.dto.AuthResponse;
import com.smartlearning.dto.CreateAdminRequest;
import com.smartlearning.dto.UserDto;
import com.smartlearning.dto.UserUpsertRequest;
import com.smartlearning.entity.Role;
import com.smartlearning.entity.User;
import com.smartlearning.exception.AccountLockedException;
import com.smartlearning.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse adminLogin(String username, String rawPassword) {
        String email = username.contains("@") ? username : username + "@smartlearning.local";

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (user.getRole() != Role.ADMIN || user.getPassword() == null
                || !passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        if (!user.isEnabled()) {
            throw new AccountLockedException("Tài khoản đã bị khóa");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(user.getId(), token, user.getName(), user.getEmail(), user.getRole().name());
    }

    public List<UserDto> listUsers() {
        return userRepository.findAll().stream().map(this::toDto).toList();
    }

    public UserDto createUser(UserUpsertRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(req.getPassword() != null ? passwordEncoder.encode(req.getPassword()) : null)
                .role(req.getRole() != null ? Role.valueOf(req.getRole()) : Role.USER)
                .build();
        return toDto(userRepository.save(user));
    }

    /** Admin quản lý tài khoản: theo yêu cầu chỉ được KHÓA/MỞ và TẠO admin mới — không sửa/xóa tự do. */
    public UserDto createAdmin(CreateAdminRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }
        User admin = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(Role.ADMIN)
                .enabled(true)
                .build();
        return toDto(userRepository.save(admin));
    }

    public UserDto setEnabled(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy người dùng"));
        user.setEnabled(enabled);
        return toDto(userRepository.save(user));
    }

    public UserDto updateUser(Long id, UserUpsertRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        user.setName(req.getName());
        user.setEmail(req.getEmail());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        if (req.getRole() != null) {
            user.setRole(Role.valueOf(req.getRole()));
        }
        return toDto(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    private UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.isEnabled(), u.getCreatedAt());
    }
}
