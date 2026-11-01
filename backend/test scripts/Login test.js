// Logs in with the given email and password
// NOTE: account has to be approved before being able to login, check the supabase

(async () => {
    // Get a CSRF token from our backend.
    const csrfResponse = await fetch(
        "http://localhost:8080/api/auth/csrf",
        { credentials: "include" }
    );

    const csrf = await csrfResponse.json();

    console.log("CSRF token:", csrf.token);

    // Send the registration request.
    const response = await fetch(
        "http://localhost:8080/api/auth/register",
        {
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
        }
    );

    // Display the result.
    const result = await response.json();

    console.log("HTTP Status:", response.status);
    console.log("Response:", result);
})();