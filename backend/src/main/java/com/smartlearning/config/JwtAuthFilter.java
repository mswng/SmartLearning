package com.smartlearning.config;

import com.smartlearning.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtUtil.isValid(token)) {
                Long userId = jwtUtil.getUserId(token);
                String email = jwtUtil.getEmail(token);
                String role = jwtUtil.getRole(token);

                // Kiểm tra "enabled" ngay trong request thay vì chỉ tin vào JWT,
                // để admin khóa tài khoản có hiệu lực NGAY LẬP TỨC — không phải
                // đợi tới khi JWT cũ (còn hạn tới 24h) hết hạn. Chấp nhận đánh
                // đổi 1 query DB/request để đổi lấy việc khóa tài khoản hoạt
                // động đúng như admin mong đợi.
                boolean stillEnabled = userId != null
                        && userRepository.findById(userId).map(u -> u.isEnabled()).orElse(false);

                if (stillEnabled) {
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                    var authToken = new UsernamePasswordAuthenticationToken(
                            new AuthenticatedUser(userId, email, role), null, authorities);

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
                // else: không set Authentication -> Spring Security tự trả 401/403
                // cho các endpoint yêu cầu đăng nhập, coi như request ẩn danh.
            }
        }

        filterChain.doFilter(request, response);
    }

    /** Lightweight principal placed in the SecurityContext. */
    public record AuthenticatedUser(Long id, String email, String role) {}
}
