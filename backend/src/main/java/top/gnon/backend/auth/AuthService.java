package top.gnon.backend.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import top.gnon.backend.user.AppUser;
import top.gnon.backend.user.UserRepository;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AppUser register(String email, String password) {

        if (email == null || password == null) {
            throw new IllegalArgumentException(
                    "Email and password are required."
            );
        }

        email = email.trim().toLowerCase(Locale.ROOT);

        if (email.isBlank()
                || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Please enter a valid email.");
        }

        if (password.length() < 8) {
            throw new IllegalArgumentException(
                    "Password must be at least 8 characters long."
            );
        }

        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException(
                    "Password is too long."
            );
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalStateException(
                    "An account with this email already exists."
            );
        }

        String hashedPassword = passwordEncoder.encode(password);

        AppUser user = new AppUser(email, hashedPassword);

        return userRepository.save(user);
    }
}