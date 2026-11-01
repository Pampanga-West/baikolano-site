// EXPECTED SEQUENCE OF BAZINGA EVENTS
// PROCESS              ERROR CODE
// Invalid email        400
// Password too short	400
// Missing email	      400
// Missing password	   400
// Valid input          201
// Duplicate email	   409

(async () => {
    const API = "http://localhost:8080/api/auth";

    // Get a CSRF token.
    async function getCsrf() {
        const response = await fetch(`${API}/csrf`, {
            credentials: "include"
        });

        return await response.json();
    }

    // Test registration with different inputs.
    async function testRegistration(name, email, password) {
        const csrf = await getCsrf();

        const response = await fetch(`${API}/register`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrf.token
            },
            body: JSON.stringify({ email, password })
        });

        let result;

        try {
            result = await response.json();
        } catch {
            result = "No JSON response";
        }

        console.log(
            `${name}:`,
            response.status,
            result
        );
    }

    console.log("=== REGISTRATION VALIDATION TESTS ===");

    await testRegistration(
        "Invalid email",
        "not-an-email",
        "testpassword123"
    );

    await testRegistration(
        "Password too short",
        "shortpassword@example.com",
        "123"
    );

    await testRegistration(
        "Missing email",
        "",
        "testpassword123"
    );

    await testRegistration(
        "Missing password",
        "missingpassword@example.com",
        ""
    );

    await testRegistration(
        "Valid input",
        "validation-test@example.com",
        "testpassword123"
    );

    await testRegistration(
        "Duplicate email",
        "validation-test@example.com",
        "testpassword123"
    );

    console.log("=== TESTS FINISHED ===");
})();