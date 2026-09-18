package com.smartlearning.controller;

import com.smartlearning.config.JwtAuthFilter.AuthenticatedUser;
import com.smartlearning.dto.CreateAdminRequest;
import com.smartlearning.dto.DashboardStatsDto;
import com.smartlearning.dto.LockUserRequest;
import com.smartlearning.dto.UserDto;
import com.smartlearning.dto.UserUpsertRequest;
import com.smartlearning.service.DashboardService;
import com.smartlearning.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final DashboardService dashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDto> dashboard() {
        return ResponseEntity.ok(dashboardService.stats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> listUsers() {
        return ResponseEntity.ok(userService.listUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody UserUpsertRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    /** Tạo tài khoản ADMIN mới — 1 trong 2 thao tác quản lý user duy nhất mà admin được làm. */
    @PostMapping("/users/admin")
    public ResponseEntity<UserDto> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        return ResponseEntity.ok(userService.createAdmin(request));
    }

    /** Khóa/mở khóa tài khoản — thao tác quản lý user còn lại được phép. */
    @PatchMapping("/users/{id}/enabled")
    public ResponseEntity<UserDto> setEnabled(@AuthenticationPrincipal AuthenticatedUser admin,
                                              @PathVariable Long id,
                                              @Valid @RequestBody LockUserRequest request) {
        if (admin.id().equals(id) && !request.isEnabled()) {
            throw new IllegalArgumentException("Không thể tự khóa tài khoản của chính mình");
        }
        return ResponseEntity.ok(userService.setEnabled(id, request.isEnabled()));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpsertRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}

