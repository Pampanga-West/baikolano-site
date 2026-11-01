package top.gnon.backend.auth;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import top.gnon.backend.user.AppUser;
import top.gnon.backend.user.UserRepository;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AppUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        AppUser user = userRepository.findByEmail(
                email.trim().toLowerCase()
        ).orElseThrow(() ->
                new UsernameNotFoundException("Account not found.")
        );

        boolean approved = user.getApprovalStatus().equals("APPROVED");
        boolean enabled = approved && !user.isBlocked();

        return User.withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().toUpperCase())
                .disabled(!enabled)
                .build();
    }
}