package top.gnon.backend.auth;

public record RegisterRequest(
        String email,
        String password
) {
}