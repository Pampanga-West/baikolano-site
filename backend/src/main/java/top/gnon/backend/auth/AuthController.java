package top.gnon.backend.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import top.gnon.backend.user.AppUser;
import top.gnon.backend.user.UserRepository;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    public AuthController(
            AuthService authService,
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            org.springframework.jdbc.core.JdbcTemplate jdbc
    ) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbc = jdbc;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        try {
            AppUser user = authService.register(
                    request.email(),
                    request.password()
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Account registered successfully.",
                            "id", user.getId(),
                            "email", user.getEmail(),
                            "role", user.getRole(),
                            "approvalStatus", user.getApprovalStatus()
                    ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", e.getMessage()));

        } catch (IllegalStateException | DataIntegrityViolationException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "message", "An account with this email already exists."
                    ));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            request.email(),
                            request.password()
                    )
            );

            // Change the session ID after successful authentication.
            new ChangeSessionIdAuthenticationStrategy()
                    .onAuthentication(authentication, httpRequest, httpResponse);

            SecurityContext context =
                    SecurityContextHolder.createEmptyContext();

            context.setAuthentication(authentication);

            SecurityContextHolder.setContext(context);

            // Save the authenticated user into the HTTP session.
            securityContextRepository.saveContext(
                    context,
                    httpRequest,
                    httpResponse
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message", "Login successful.",
                            "email", authentication.getName()
                    )
            );

        } catch (DisabledException e) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message", "Your account is pending approval or blocked."
                    ));

        } catch (BadCredentialsException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message", "Incorrect email or password."
                    ));
        }
    }

    @GetMapping("/csrf")
    public Map<String, String> getCsrfToken(CsrfToken csrfToken) {
        return Map.of(
                "token", csrfToken.getToken()
        );
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            Authentication authentication
    ) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated."));
        }

        return userRepository.findByEmail(authentication.getName())
                .map(user -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", user.getId());
                    map.put("email", user.getEmail());
                    map.put("firstName", user.getFirstName() != null ? user.getFirstName() : "");
                    map.put("lastName", user.getLastName() != null ? user.getLastName() : "");
                    map.put("role", user.getRole());
                    map.put("approvalStatus", user.getApprovalStatus());
                    map.put("blocked", user.isBlocked());
                    return ResponseEntity.ok(map);
                })
                .orElseGet(() -> ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Account not found.")));
    }

    public record ProfileUpdateRequest(
            String firstName,
            String lastName,
            String currentPassword,
            String newPassword
    ) {}

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody ProfileUpdateRequest req,
            Authentication authentication
    ) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated."));
        }

        AppUser user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found."
                ));

        if (req.firstName() != null) {
            user.setFirstName(req.firstName().trim());
        }
        if (req.lastName() != null) {
            user.setLastName(req.lastName().trim());
        }

        boolean passwordChanged = false;
        if (req.newPassword() != null && !req.newPassword().isBlank()) {
            if (req.currentPassword() == null || req.currentPassword().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Current password is required to set a new password."));
            }
            if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Incorrect current password."));
            }
            if (req.newPassword().length() < 8) {
                return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 8 characters long."));
            }
            if (req.newPassword().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
                return ResponseEntity.badRequest().body(Map.of("message", "New password is too long."));
            }

            user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
            passwordChanged = true;
        }

        AppUser saved = userRepository.save(user);

        // Audit log entry (safe fallback so audit failures never break profile updates)
        try {
            String auditAction = passwordChanged ? "EDIT" : "EDIT";
            jdbc.update(
                    "INSERT INTO audit_log (table_name, action, record_key, action_by, action_at) VALUES ('app_user', ?, ?, ?, CURRENT_TIMESTAMP)",
                    auditAction, saved.getId().toString(), saved.getEmail()
            );
        } catch (Exception ex) {
            // Log warning but allow profile update to succeed
            System.err.println("Could not write to audit_log during profile update: " + ex.getMessage());
        }

        java.util.Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("message", passwordChanged ? "Profile and password updated successfully." : "Profile updated successfully.");
        resp.put("id", saved.getId());
        resp.put("email", saved.getEmail());
        resp.put("firstName", saved.getFirstName() != null ? saved.getFirstName() : "");
        resp.put("lastName", saved.getLastName() != null ? saved.getLastName() : "");
        resp.put("role", saved.getRole());
        resp.put("approvalStatus", saved.getApprovalStatus());

        return ResponseEntity.ok(resp);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        SecurityContextLogoutHandler logoutHandler =
                new SecurityContextLogoutHandler();

        logoutHandler.logout(request, response, authentication);

        return ResponseEntity.ok(
                Map.of("message", "Logout successful.")
        );
    }

    public record ResetPasswordRequestDto(String email) {}
    public record ResetPasswordDto(String token, String newPassword) {}

    /**
     * S1-DEV-04: Password reset request
     */
    @PostMapping("/reset-password-request")
    public ResponseEntity<?> requestPasswordReset(@RequestBody ResetPasswordRequestDto req) {
        if (req.email() == null || req.email().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }
        String email = req.email().trim().toLowerCase(java.util.Locale.ROOT);
        java.util.Optional<AppUser> userOpt = userRepository.findByEmail(email);

        String rawToken = java.util.UUID.randomUUID().toString();
        if (userOpt.isPresent()) {
            AppUser user = userOpt.get();
            String hashed = hashToken(rawToken);

            jdbc.update(
                    "INSERT INTO password_reset_token (user_id, token_hash, expiry_at, used) " +
                    "VALUES (?, ?, CURRENT_TIMESTAMP + INTERVAL '1 hour', FALSE)",
                    user.getId(), hashed
            );

            jdbc.update(
                    "INSERT INTO audit_log (table_name, action, record_key, action_by, action_at) " +
                    "VALUES ('app_user', 'PASSWORD_RESET_REQUEST', ?, ?, CURRENT_TIMESTAMP)",
                    user.getId().toString(), email
            );
        }

        return ResponseEntity.ok(Map.of(
                "message", "If an account exists for this email, a password reset link has been dispatched.",
                "token", rawToken
        ));
    }

    /**
     * S1-DEV-04: Reset password with token
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordDto req) {
        if (req.token() == null || req.token().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Reset token is required."));
        }
        if (req.newPassword() == null || req.newPassword().length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 8 characters long."));
        }
        if (req.newPassword().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password is too long."));
        }

        String hashedToken = hashToken(req.token().trim());
        java.util.List<java.util.Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, user_id, expiry_at, used FROM password_reset_token " +
                "WHERE token_hash = ? AND used = FALSE AND expiry_at > CURRENT_TIMESTAMP",
                hashedToken
        );

        if (rows.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Link expired or already used. Request a new secure link."
            ));
        }

        java.util.Map<String, Object> tokenRow = rows.get(0);
        java.util.UUID tokenId = (java.util.UUID) tokenRow.get("id");
        java.util.UUID userId = (java.util.UUID) tokenRow.get("user_id");

        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "User account not found."
                ));

        // Update password
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);

        // Mark token used (expired/reused prevention S1-TST-02)
        jdbc.update("UPDATE password_reset_token SET used = TRUE WHERE id = ?", tokenId);

        // Audit log
        jdbc.update(
                "INSERT INTO audit_log (table_name, action, record_key, action_by, action_at) " +
                "VALUES ('app_user', 'PASSWORD_RESET_SUCCESS', ?, ?, CURRENT_TIMESTAMP)",
                userId.toString(), user.getEmail()
        );

        return ResponseEntity.ok(Map.of(
                "message", "Password successfully updated. You can now sign in with your new password."
        ));
    }

    private String hashToken(String token) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}