package com.smartlearning.config;

import com.smartlearning.entity.Role;
import com.smartlearning.entity.User;
import com.smartlearning.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.default-username:admin}")
    private String defaultUsername;

    @Value("${app.admin.default-password:admin123}")
    private String defaultPassword;

    @Override
    public void run(String... args) {
        // "username" for the admin is stored in the email column so the same
        // users table / login-lookup path works for both admins and OAuth users.
        String adminEmail = defaultUsername.contains("@") ? defaultUsername : defaultUsername + "@smartlearning.local";

        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = User.builder()
                    .name("System Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(defaultPassword))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
        }
    }
}
