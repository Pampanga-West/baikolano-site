package top.gnon.backend.user;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    public UserController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            org.springframework.jdbc.core.JdbcTemplate jdbc
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbc = jdbc;
    }

    public record UserDto(
            UUID id,
            String email,
            String role,
            String approvalStatus,
            boolean blocked,
            boolean isProtected,
            OffsetDateTime createdAt
    ) {}

    public record CreateUserRequest(
            String email,
            String password,
            String role
    ) {}

    public record BlockRequest(
            boolean blocked
    ) {}

    public record RoleRequest(
            String role
    ) {}

    public record UpdateUserRequest(
            String email
    ) {}

    public record RightsRequest(
            List<String> rights
    ) {}

    private AppUser getCaller(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated.");
        }
        AppUser caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Caller account not found."));

        if ("User".equalsIgnoreCase(caller.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. Administrator privileges required.");
        }
        return caller;
    }

    private UserDto toDto(AppUser user, long activeSuperadmins) {
        boolean isProtected = "Superadmin".equalsIgnoreCase(user.getRole()) && activeSuperadmins <= 1;
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getApprovalStatus(),
                user.isBlocked(),
                isProtected,
                user.getCreatedAt()
        );
    }

    /**
     * S1-DEV-05: List users
     * - Admins see regular Users only (Superadmin accounts are completely hidden).
     * - Superadmins see all accounts.
     */
    @GetMapping
    public List<UserDto> listUsers(Authentication auth) {
        AppUser caller = getCaller(auth);
        long activeSuperadmins = userRepository.countByRoleAndBlockedFalse("Superadmin");

        List<AppUser> list;
        if ("Superadmin".equalsIgnoreCase(caller.getRole())) {
            list = userRepository.findAllByOrderByCreatedAtDesc();
        } else {
            // Admin only sees regular users
            list = userRepository.findByRoleNotOrderByCreatedAtDesc("Superadmin");
        }

        return list.stream()
                .map(u -> toDto(u, activeSuperadmins))
                .toList();
    }

    /**
     * S1-DEV-05: Add a new user directly
     */
    @PostMapping
    public ResponseEntity<?> addUser(@RequestBody CreateUserRequest request, Authentication auth) {
        AppUser caller = getCaller(auth);

        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please enter a valid email."));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "An account with this email already exists."));
        }

        String rawPassword = (request.password() != null && !request.password().isBlank())
                ? request.password()
                : "Temporary123!";

        String role = "User";
        if ("Superadmin".equalsIgnoreCase(caller.getRole()) && request.role() != null) {
            String r = request.role().trim();
            if ("Admin".equalsIgnoreCase(r)) role = "Admin";
            else if ("Superadmin".equalsIgnoreCase(r)) role = "Superadmin";
        }

        AppUser newUser = new AppUser(email, passwordEncoder.encode(rawPassword), role);
        newUser.setApprovalStatus("APPROVED"); // Directly added by administrator is approved

        AppUser saved = userRepository.save(newUser);
        long activeSuperadmins = userRepository.countByRoleAndBlockedFalse("Superadmin");

        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved, activeSuperadmins));
    }

    /**
     * S1-DEV-05: Edit user details (email)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable UUID id,
            @RequestBody UpdateUserRequest request,
            Authentication auth
    ) {
        AppUser caller = getCaller(auth);
        AppUser target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        if (!"Superadmin".equalsIgnoreCase(caller.getRole()) && "Superadmin".equalsIgnoreCase(target.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot edit Superadmin accounts.");
        }

        if (request.email() != null && !request.email().isBlank()) {
            String newEmail = request.email().trim().toLowerCase(Locale.ROOT);
            if (!newEmail.equals(target.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("message", "An account with this email already exists."));
                }
                target.setEmail(newEmail);
            }
        }

        AppUser saved = userRepository.save(target);
        long activeSuperadmins = userRepository.countByRoleAndBlockedFalse("Superadmin");
        return ResponseEntity.ok(toDto(saved, activeSuperadmins));
    }

    /**
     * S1-DEV-05 & S1-DEV-06: Block or Unblock user
     * - Last Superadmin cannot be blocked.
     * - Admin cannot block Superadmins.
     */
    @PatchMapping("/{id}/block")
    public ResponseEntity<?> toggleBlock(
            @PathVariable UUID id,
            @RequestBody BlockRequest request,
            Authentication auth
    ) {
        AppUser caller = getCaller(auth);
        AppUser target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        if (!"Superadmin".equalsIgnoreCase(caller.getRole()) && "Superadmin".equalsIgnoreCase(target.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot modify Superadmin accounts.");
        }

        // Last Superadmin Guard
        if (request.blocked() && "Superadmin".equalsIgnoreCase(target.getRole())) {
            long activeSuperadmins = userRepository.countByRoleAndBlockedFalse("Superadmin");
            if (activeSuperadmins <= 1) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Role safeguards active: The last remaining Superadmin cannot be disabled or blocked."
                ));
            }
        }

        target.setBlocked(request.blocked());
        AppUser saved = userRepository.save(target);

        long activeSuperadmins = userRepository.countByRoleAndBlockedFalse("Superadmin");
        return ResponseEntity.ok(toDto(saved, activeSuperadmins));
    }

    /**
     * S1-DEV-06: Superadmin approves pending user
     */
    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> approveUser(
            @PathVariable UUID id,
            Authentication auth
    ) {
        AppUser caller = getCaller(auth);
        if (!"Superadmin".equalsIgnoreCase(caller.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Superadmins can approve accounts.");
        }

        AppUser target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        target.setApprovalStatus("APPROVED");
        AppUser saved = userRepository.save(target);

        long activeSuperadmins = userRepository.countByRoleAndBlockedFalse("Superadmin");
        return ResponseEntity.ok(toDto(saved, activeSuperadmins));
    }

    /**
     * S1-DEV-06: Superadmin designates user role (Admin / User)
     * - Last Superadmin cannot be demoted.
     */
    @PatchMapping("/{id}/role")
    public ResponseEntity<?> changeRole(
            @PathVariable UUID id,
            @RequestBody RoleRequest request,
            Authentication auth
    ) {
        AppUser caller = getCaller(auth);
        if (!"Superadmin".equalsIgnoreCase(caller.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Superadmins can designate roles.");
        }

        AppUser target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        String requestedRole = request.role();
        if (requestedRole == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role is required."));
        }

        String validRole;
        if ("Superadmin".equalsIgnoreCase(requestedRole)) validRole = "Superadmin";
        else if ("Admin".equalsIgnoreCase(requestedRole)) validRole = "Admin";
        else validRole = "User";

        // Last Superadmin Guard: prevent demoting the last superadmin
        if ("Superadmin".equalsIgnoreCase(target.getRole()) && !"Superadmin".equalsIgnoreCase(validRole)) {
            long activeSuperadmins = userRepository.countByRoleAndBlockedFalse("Superadmin");
            if (activeSuperadmins <= 1) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Role safeguards active: The last remaining Superadmin cannot be demoted."
                ));
            }
        }

        target.setRole(validRole);
        AppUser saved = userRepository.save(target);

        long activeSuperadmins = userRepository.countByRoleAndBlockedFalse("Superadmin");
        return ResponseEntity.ok(toDto(saved, activeSuperadmins));
    }

    /**
     * Superadmin deletes a user account
     * - Last Superadmin cannot be deleted.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable UUID id,
            Authentication auth
    ) {
        AppUser caller = getCaller(auth);
        if (!"Superadmin".equalsIgnoreCase(caller.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Superadmins can delete accounts.");
        }

        AppUser target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        // Last Superadmin Guard
        if ("Superadmin".equalsIgnoreCase(target.getRole())) {
            long activeSuperadmins = userRepository.countByRoleAndBlockedFalse("Superadmin");
            if (activeSuperadmins <= 1) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Role safeguards active: The last remaining Superadmin cannot be deleted."
                ));
            }
        }

        userRepository.delete(target);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully."));
    }

    /**
     * S1-DEV-07: Get user assigned rights
     */
    @GetMapping("/{id}/rights")
    public ResponseEntity<?> getUserRights(
            @PathVariable UUID id,
            Authentication auth
    ) {
        getCaller(auth);
        userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        List<String> rights = jdbc.query(
                "SELECT permission_name FROM user_permission WHERE user_id = ? AND granted = TRUE AND deleted_at IS NULL",
                (rs, rowNum) -> rs.getString("permission_name"),
                id
        );

        return ResponseEntity.ok(Map.of(
                "userId", id,
                "rights", rights
        ));
    }

    /**
     * S1-DEV-07: Assign per-action rights by module & log in audit_log
     */
    @PostMapping("/{id}/rights")
    public ResponseEntity<?> assignUserRights(
            @PathVariable UUID id,
            @RequestBody RightsRequest request,
            Authentication auth
    ) {
        AppUser caller = getCaller(auth);
        AppUser target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        if (!"Superadmin".equalsIgnoreCase(caller.getRole()) && "Superadmin".equalsIgnoreCase(target.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot modify Superadmin permissions.");
        }

        List<String> newRights = request.rights() != null ? request.rights() : List.of();

        // 1. Fetch current rights for audit trail
        List<String> oldRights = jdbc.query(
                "SELECT permission_name FROM user_permission WHERE user_id = ? AND granted = TRUE AND deleted_at IS NULL",
                (rs, rowNum) -> rs.getString("permission_name"),
                id
        );

        // 2. Remove previous rights
        jdbc.update("DELETE FROM user_permission WHERE user_id = ?", id);

        // 3. Insert new rights
        for (String r : newRights) {
            if (r != null && !r.isBlank()) {
                jdbc.update(
                        "INSERT INTO user_permission (user_id, permission_name, granted) VALUES (?, ?, TRUE)",
                        id, r.trim()
                );
            }
        }

        // 4. Log change in audit_log (S1-DEV-07 & S1-DBA-06)
        String oldJson = "{\"rights\":" + toJsonArray(oldRights) + "}";
        String newJson = "{\"rights\":" + toJsonArray(newRights) + "}";

        jdbc.update(
                "INSERT INTO audit_log (table_name, action, record_key, old_values, new_values, action_by, action_at) " +
                "VALUES ('user_permission', 'UPDATE', ?, ?::jsonb, ?::jsonb, ?, CURRENT_TIMESTAMP)",
                id.toString(), oldJson, newJson, caller.getEmail()
        );

        return ResponseEntity.ok(Map.of(
                "message", "User permissions updated successfully.",
                "userId", id,
                "rights", newRights
        ));
    }

    private String toJsonArray(List<String> items) {
        if (items == null || items.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(items.get(i).replace("\"", "\\\"")).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }
}
