package com.atlas.domain.auth;

import com.atlas.common.exception.BusinessRuleException;
import com.atlas.domain.auth.dto.AuthResponse;
import com.atlas.domain.auth.dto.LoginRequest;
import com.atlas.domain.auth.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessRuleException("Email already registered: " + request.email());
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.OPERATOR);

        userRepository.save(user);

        return new AuthResponse(
                jwtService.generateToken(user),
                user.getEmail(),
                user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        // Throws BadCredentialsException if credentials are wrong —
        // caught by GlobalExceptionHandler and mapped to 401.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessRuleException("User not found"));

        return new AuthResponse(
                jwtService.generateToken(user),
                user.getEmail(),
                user.getRole().name());
    }
}
