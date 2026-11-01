# Backend API Documentation
**Project:** HOPE Website  
**Backend:** Java + Spring Boot  
**Database:** Supabase PostgreSQL  
**Authentication:** Spring Security + BCrypt + HTTP Sessions  
**API Version:** Initial Development Version  
**Status:** Core Authentication APIs Implemented

---

## 1. Overview

This backend provides REST API endpoints for the HOPE website.

Its current responsibilities include:

- User registration
- User login and authentication
- Session management
- User information retrieval
- User logout
- Password hashing and validation
- Account approval restrictions

The backend uses Supabase PostgreSQL as its database provider. Supabase Auth is not used; authentication is handled entirely by the Java backend.

### Development server

| Service | Address |
|---|---|
| Backend | `http://localhost:8080` |
| React + Vite frontend | `http://localhost:5173` |
| API base path | `/api/auth` |

---

## 2. Authentication System

The backend uses **server-side HTTP sessions** rather than JWT authentication.

After a successful login:

1. The backend verifies the user's email and password.
2. Spring Security creates an authenticated session.
3. The browser receives a session cookie (`JSESSIONID`).
4. Subsequent requests send that cookie automatically when configured with `credentials: "include"`.
5. The backend uses the session to identify the authenticated user.

The frontend should never store or manually manage the user's password or password hash.

### Account approval

Newly registered accounts have the status:

`PENDING`

Pending accounts cannot log in.

Only accounts with:

- `approval_status = APPROVED`
- `blocked = false`

are permitted to authenticate.

Currently, account approval is managed directly through the database. An administrative approval API has not yet been implemented.

---

## 3. API Endpoint Reference

All current authentication endpoints use:

`/api/auth`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/csrf` | Retrieve CSRF token | Public |
| POST | `/register` | Register a new account | Public |
| POST | `/login` | Authenticate a user | Public |
| GET | `/me` | Retrieve current user | Session required |
| POST | `/logout` | Log out current user | Public endpoint, CSRF required |

All POST requests require a valid CSRF token.

### 3.1 GET `/api/auth/csrf`

Retrieves a CSRF token required for requests that modify server-side state.

**Request:** No body required.

**Successful response: HTTP 200**

```json
{
  "token": "your-csrf-token"
}
```

The returned token must be included in the `X-CSRF-TOKEN` header of subsequent POST requests.

The browser must also retain and send its session cookies.

### 3.2 POST `/api/auth/register`

Creates a new user account.

**Request headers:**

```http
Content-Type: application/json
X-CSRF-TOKEN: your-csrf-token
```

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "my-secure-password"
}
```

**Successful response: HTTP 201 Created**

```json
{
  "message": "Account registered successfully.",
  "id": "generated-user-uuid",
  "email": "user@example.com",
  "approvalStatus": "PENDING"
}
```

**Validation rules:**

- Email is required.
- Email must have a valid format.
- Email cannot exceed 255 characters.
- Password is required.
- Password must contain at least 8 characters.
- Password must not exceed BCrypt's 72-byte limit.

Email addresses are trimmed and converted to lowercase before being stored.

Passwords are hashed using BCrypt before database insertion. Plain-text passwords are never stored.

**Possible responses:**

| Status | Meaning |
|---|---|
| 201 | Account successfully created |
| 400 | Invalid registration information |
| 409 | Email address already registered |
| 403 | CSRF verification failed |

Registration does not automatically log the user in.

### 3.3 POST `/api/auth/login`

Authenticates an existing account and creates a server-side session.

**Request headers:**

```http
Content-Type: application/json
X-CSRF-TOKEN: your-csrf-token
```

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "my-secure-password"
}
```

**Successful response: HTTP 200 OK**

```json
{
  "message": "Login successful.",
  "email": "user@example.com"
}
```

On success, the backend creates an authenticated session and sends a session cookie.

**Possible responses:**

| Status | Meaning |
|---|---|
| 200 | Login successful |
| 400 | Invalid request information |
| 401 | Incorrect email or password |
| 403 | Account pending approval or blocked |
| 403 | CSRF verification failed |

The frontend must preserve the session cookie for subsequent requests.

### 3.4 GET `/api/auth/me`

Retrieves information about the currently authenticated user.

No request body is necessary.

**Request:**

```http
GET /api/auth/me
```

The browser must send its session cookie.

**Successful response: HTTP 200 OK**

```json
{
  "id": "generated-user-uuid",
  "email": "user@example.com",
  "role": "Superadmin",
  "approvalStatus": "APPROVED",
  "blocked": false
}
```

**Unauthenticated response: HTTP 401 Unauthorized**

```json
{
  "message": "Not authenticated."
}
```

This endpoint is useful when the frontend initially loads and needs to determine whether a user is already logged in.

It should be called when initializing the React application's authentication state.

### 3.5 POST `/api/auth/logout`

Destroys the current authenticated session.

**Request headers:**

```http
X-CSRF-TOKEN: your-csrf-token
```

No request body is necessary.

**Successful response: HTTP 200 OK**

```json
{
  "message": "Logout successful."
}
```

The backend invalidates the existing session and clears the associated security context.

Calling `/me` afterward should return HTTP 401.

**Possible responses:**

| Status | Meaning |
|---|---|
| 200 | Logout successful |
| 403 | CSRF verification failed |

---

## 4. Frontend Integration Requirements

The frontend must use the following settings when communicating with the backend.

### Include credentials

Every request that needs to retain or use the session must include:

```javascript
credentials: "include"
```

This is necessary because the backend uses HTTP session cookies.

### CSRF protection

Before making a POST request, retrieve a CSRF token:

```javascript
const csrfResponse = await fetch(
    "http://localhost:8080/api/auth/csrf",
    {
        credentials: "include"
    }
);

const csrf = await csrfResponse.json();
```

Then include it in the request headers:

```javascript
headers: {
    "Content-Type": "application/json",
    "X-CSRF-TOKEN": csrf.token
}
```

### Example: Registering a user

```javascript
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
            email: "user@example.com",
            password: "my-secure-password"
        })
    }
);

const result = await response.json();

console.log(response.status, result);
```

### CORS configuration

During development, the backend currently allows:

`http://localhost:5173`

Allowed methods:

- GET
- POST
- PUT
- PATCH
- DELETE
- OPTIONS

Allowed headers:

- Content-Type
- X-CSRF-TOKEN

Credentials are enabled.

If the frontend uses another origin or port, the backend CORS configuration must be updated.

---

## 5. Database Structure

The authentication system currently uses the following table:

### `app_user`

| Column | Type | Description |
|---|---|---|
| id | UUID | Unique user identifier |
| email | VARCHAR(255) | Unique email address |
| password_hash | VARCHAR(255) | BCrypt password hash |
| role | VARCHAR(20) | User role ('Superadmin', 'Admin', 'User') |
| approval_status | VARCHAR(20) | Account approval status |
| blocked | BOOLEAN | Whether the account is blocked |
| created_at | TIMESTAMPTZ | Account creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

Supported approval statuses currently include:

- `PENDING`
- `APPROVED`

The database schema is managed through Flyway migrations.

The backend uses Spring Data JPA for database operations.

---

## 6. Security Notes

The following security measures are currently implemented:

- BCrypt password hashing with work factor 12.
- Server-side HTTP sessions.
- CSRF protection enabled.
- CORS restricted to the configured development frontend origin.
- Session ID rotation after successful login.
- Database uniqueness constraint on email addresses.
- Pending and blocked account restrictions.
- Password hashes are never returned through authentication API responses.

**Important development notes:**

- Never expose database credentials in frontend code.
- Never send database passwords or service-role credentials to the browser.
- Do not disable CSRF protection to resolve frontend request errors.
- Do not manually store passwords in localStorage or sessionStorage.
- Production deployment must use HTTPS and appropriately configured secure cookies and CORS origins.

---

## 7. Sprint 1 Implemented Features

The following features have been fully implemented and connected for Sprint 1:

- **Administrative User Management (`/api/users`):**
  - `GET /api/users`: List users (Admins see regular users only; Superadmin accounts hidden from Admins).
  - `POST /api/users`: Add user directly.
  - `PUT /api/users/{id}`: Update user email.
  - `PATCH /api/users/{id}/block`: Block and unblock user accounts.
  - `PATCH /api/users/{id}/approve`: Superadmin approval of pending registrations.
  - `PATCH /api/users/{id}/role`: Superadmin designation of Admin and User roles.
  - `DELETE /api/users/{id}`: Delete user accounts.
  - **Last-Superadmin Guard:** Server-side safeguard preventing demoting, disabling, or deleting the last remaining Superadmin.
- **Module Rights & Permissions (`/api/users/{id}/rights`):**
  - `GET /api/users/{id}/rights`: Retrieve assigned rights across the 36-right catalog.
  - `POST /api/users/{id}/rights`: Assign per-action rights with audit logging into `audit_log`.
- **Password Reset Flow (`/api/auth/reset-password-request` & `/api/auth/reset-password`):**
  - SHA-256 hashed one-time tokens with 1-hour expiration and single-use flags stored in `password_reset_token`.
  - Full audit trail recorded in `audit_log`.

---

## 8. Current Technology Stack

| Component | Technology |
|---|---|
| Backend language | Java |
| Backend framework | Spring Boot |
| API architecture | REST |
| Authentication | Spring Security |
| Password hashing | BCrypt |
| Session management | HTTP Sessions |
| Database | PostgreSQL |
| Database provider | Supabase |
| ORM | Spring Data JPA |
| Database migrations | Flyway |
| Frontend | React + Vite |

---

**Documentation status:** Reflects the authentication API implemented and tested during initial backend development. Endpoint behavior and validation details should be updated as implementation evolves.

**Base URL:** `http://localhost:8080/api/auth`
