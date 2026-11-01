// EXPECTED SEQUENCE OF EVENTS BAZINGA
// Login         200
// Before logout 200
// Logout        200
// After logout  401

(async () => {
    const API = "http://localhost:8080/api/auth";

    // Helper: obtain a CSRF token.
    async function getCsrf() {
        const response = await fetch(`${API}/csrf`, {
            credentials: "include"
        });

        return await response.json();
    }

    // 1. Get CSRF token.
    const csrf = await getCsrf();

    // 2. Log in.
    const login = await fetch(`${API}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrf.token
        },
        body: JSON.stringify({
            email: "test@example.com",
            password: "testpassword123"
        })
    });

    console.log("LOGIN:", login.status, await login.json());

    // 3. Check session.
    const before = await fetch(`${API}/me`, {
        credentials: "include"
    });

    console.log("BEFORE LOGOUT:", before.status, await before.json());

    // 4. Get a fresh CSRF token.
    const freshCsrf = await getCsrf();

    // 5. Log out.
    const logout = await fetch(`${API}/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
            "X-CSRF-TOKEN": freshCsrf.token
        }
    });

    console.log("LOGOUT:", logout.status, await logout.json());

    // 6. Check session again.
    const after = await fetch(`${API}/me`, {
        credentials: "include"
    });

    console.log("AFTER LOGOUT:", after.status, await after.json());
})();