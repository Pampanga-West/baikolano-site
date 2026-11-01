package top.gnon.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<AppUser, UUID> {

    // Find an account using its email address.
    Optional<AppUser> findByEmail(String email);

    // Check whether an email is already registered.
    boolean existsByEmail(String email);

    // Find all users ordered by creation date descending.
    List<AppUser> findAllByOrderByCreatedAtDesc();

    // Find users excluding a specific role (e.g. for Admins who cannot see Superadmins).
    List<AppUser> findByRoleNotOrderByCreatedAtDesc(String role);

    // Count active non-blocked users with a specific role (for last-superadmin guard).
    long countByRoleAndBlockedFalse(String role);

    // Count all users with a specific role.
    long countByRole(String role);
}
