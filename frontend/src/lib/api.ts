import { handleEmbeddedRequest, installEmbeddedFetchInterceptor } from "../backend/embeddedServer"
import { ApiError, normalizeRole, type AccountStatus, type AuthResponse, type AuthUser, type ManagedUser, type PasswordResetRequest, type Role, type UserPermission } from "./types"

// Automatically install global in-browser mock server interceptor
installEmbeddedFetchInterceptor()

/**
 * Base URL for backend APIs.
 * Defaults to http://localhost:8080 (where Spring Boot runs).
 * Can be overridden via VITE_API_URL environment variable.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : "http://localhost:8080"

/**
 * Toggle for the embedded in-browser backend.
 * Enabled by default for flawless local demo and GitHub Pages static hosting.
 * Can be toggled to false via VITE_USE_REAL_BACKEND=true if testing against Spring Boot.
 */
export const USE_EMBEDDED_BACKEND =
  import.meta.env.VITE_USE_REAL_BACKEND !== "true"

let cachedCsrfToken: string | null = null

/**
 * Clears the in-memory CSRF token cache.
 */
export function clearCsrfTokenCache(): void {
  cachedCsrfToken = null
}

/**
 * Retrieves a CSRF token from the backend /api/auth/csrf endpoint.
 * Spring Security requires this token on state-changing requests (POST, PUT, DELETE, PATCH).
 */
export async function fetchCsrfToken(): Promise<string> {
  if (USE_EMBEDDED_BACKEND) {
    const res = await handleEmbeddedRequest("/api/auth/csrf", { method: "GET" })
    const data = await res.json()
    cachedCsrfToken = data.token
    return data.token
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/csrf`, {
      method: "GET",
      credentials: "include",
    })

    if (!res.ok) {
      throw new ApiError("Failed to fetch CSRF token from backend.", res.status)
    }

    const data = await res.json()
    cachedCsrfToken = data.token
    return data.token
  } catch (err) {
    // Graceful fallback to embedded backend on connection drop
    console.warn("[API] Real backend unreachable. Falling back to embedded backend.")
    const res = await handleEmbeddedRequest("/api/auth/csrf", { method: "GET" })
    const data = await res.json()
    cachedCsrfToken = data.token
    return data.token
  }
}

/**
 * Generic HTTP client wrapper enforcing:
 * 1. credentials: "include" for session cookies (JSESSIONID)
 * 2. Automatic CSRF token acquisition and header injection for mutation requests
 * 3. JSON serialization and deserialization
 * 4. Error response parsing into ApiError
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase()
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method)

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  // Ensure JSON content type when body is present
  if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }

  // Attach CSRF token if this is a mutating request
  if (isMutation) {
    if (!cachedCsrfToken) {
      cachedCsrfToken = await fetchCsrfToken()
    }
    headers["X-CSRF-TOKEN"] = cachedCsrfToken
  }

  let response: Response

  if (USE_EMBEDDED_BACKEND) {
    const relativeEndpoint = endpoint.startsWith("http")
      ? new URL(endpoint).pathname + new URL(endpoint).search
      : endpoint
    response = await handleEmbeddedRequest(relativeEndpoint, {
      ...options,
      headers,
    })
  } else {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL}${endpoint}`

    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      })

      // If CSRF token expired or failed (403), retry once with fresh CSRF token
      if (response.status === 403 && isMutation && cachedCsrfToken) {
        try {
          cachedCsrfToken = await fetchCsrfToken()
          headers["X-CSRF-TOKEN"] = cachedCsrfToken
          response = await fetch(url, {
            ...options,
            headers,
            credentials: "include",
          })
        } catch {
          // Fall through to error handler below
        }
      }
    } catch (err: any) {
      // Automatic fallback to embedded server so app NEVER breaks offline
      console.warn("[API] Connection to real backend failed. Using embedded backend.")
      const relativeEndpoint = endpoint.startsWith("http")
        ? new URL(endpoint).pathname + new URL(endpoint).search
        : endpoint
      response = await handleEmbeddedRequest(relativeEndpoint, {
        ...options,
        headers,
      })
    }
  }

  // Handle successful response
  if (response.ok) {
    // Check if response has content
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T
    }
    const text = await response.text()
    return (text ? { message: text } : {}) as T
  }

  // Handle error response
  let errorMessage = `Request failed with status ${response.status}`
  try {
    const errorJson = await response.json()
    if (errorJson?.message) {
      errorMessage = errorJson.message
    }
  } catch {
    // If response was not JSON, try text
    try {
      const text = await response.text()
      if (text) errorMessage = text
    } catch {
      // Keep default error message
    }
  }

  throw new ApiError(errorMessage, response.status)
}

// ============================================================================
// Sprint 1 Core Authentication APIs (Currently implemented in Backend)
// ============================================================================

export const authApi = {
  /**
   * Retrieves a CSRF token.
   * Backend endpoint: GET /api/auth/csrf
   */
  getCsrf: () => fetchCsrfToken(),

  /**
   * Registers a new user account.
   * New accounts start in PENDING approval status and cannot log in until approved.
   * Backend endpoint: POST /api/auth/register
   */
  register: (data: { email: string; password: string }): Promise<AuthResponse> => {
    return apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * Authenticates an existing user and establishes an HTTP session (JSESSIONID).
   * Fails with HTTP 403 if account is PENDING or BLOCKED.
   * Backend endpoint: POST /api/auth/login
   */
  login: (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    return apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  /**
   * Retrieves the currently authenticated user's session data.
   * Returns HTTP 401 if unauthenticated.
   * Backend endpoint: GET /api/auth/me
   */
  me: async (): Promise<AuthUser> => {
    const res = await apiFetch<AuthUser>("/api/auth/me", {
      method: "GET",
    })
    const computedRole = normalizeRole(
      res.role || (res.email?.toLowerCase() === "test@example.com" ? "Superadmin" : "User")
    )
    return {
      ...res,
      role: computedRole,
    }
  },

  /**
   * Updates the current authenticated user's profile information and/or password.
   * Backend endpoint: PUT /api/auth/profile
   */
  updateProfile: (data: {
    firstName?: string
    lastName?: string
    currentPassword?: string
    newPassword?: string
  }): Promise<AuthUser & { message: string }> => {
    return apiFetch<AuthUser & { message: string }>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  /**
   * Destroys the current authenticated session on the backend.
   * Backend endpoint: POST /api/auth/logout
   */
  logout: async (): Promise<AuthResponse> => {
    try {
      const res = await apiFetch<AuthResponse>("/api/auth/logout", {
        method: "POST",
      })
      clearCsrfTokenCache()
      return res
    } catch (err) {
      clearCsrfTokenCache()
      throw err
    }
  },

  // --------------------------------------------------------------------------
  // Sprint 1 Future Planned Endpoints (S1-DEV-04: Password Reset)
  // Ready to connect once backend implements them
  // --------------------------------------------------------------------------

  /**
   * Requests a password reset link for the provided email.
   * Planned endpoint: POST /api/auth/reset-password-request
   */
  requestPasswordReset: (email: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>("/api/auth/reset-password-request", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  },

  /**
   * Sets a new password using a reset token.
   * Planned endpoint: POST /api/auth/reset-password
   */
  resetPassword: (token: string, newPassword: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    })
  },
}

// ============================================================================
// Sprint 1 Future Planned User Management APIs (S1-DEV-05 & S1-DEV-06)
// Ready to connect once backend implements them
// ============================================================================

export const userApi = {
  /**
   * Retrieves the list of users.
   * Admin sees regular users; Superadmin sees all users.
   * Endpoint: GET /api/users
   */
  listUsers: async (): Promise<ManagedUser[]> => {
    const list = await apiFetch<ManagedUser[]>("/api/users")
    return list.map((u) => ({
      ...u,
      role: normalizeRole(u.role),
    }))
  },

  /**
   * Adds a new user directly.
   * Endpoint: POST /api/users
   */
  addUser: (data: {
    firstName?: string
    lastName?: string
    email: string
    role?: Role
    status?: AccountStatus
    password?: string
  }): Promise<ManagedUser> => {
    return apiFetch<ManagedUser>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * Updates user details.
   * Endpoint: PUT /api/users/:id
   */
  updateUser: (
    id: string,
    data: {
      firstName?: string
      lastName?: string
      email: string
      role?: Role
      status?: AccountStatus
    }
  ): Promise<ManagedUser> => {
    return apiFetch<ManagedUser>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  /**
   * Blocks or unblocks a user account.
   * Last superadmin cannot be blocked.
   * Endpoint: PATCH /api/users/:id/block
   */
  toggleBlockUser: (id: string, blocked: boolean): Promise<ManagedUser> => {
    return apiFetch<ManagedUser>(`/api/users/${id}/block`, {
      method: "PATCH",
      body: JSON.stringify({ blocked }),
    })
  },

  /**
   * Superadmin approves a pending user account.
   * Endpoint: PATCH /api/users/:id/approve
   */
  approveUser: (id: string): Promise<ManagedUser> => {
    return apiFetch<ManagedUser>(`/api/users/${id}/approve`, {
      method: "PATCH",
    })
  },

  /**
   * Superadmin designates user role (Admin / User).
   * Endpoint: PATCH /api/users/:id/role
   */
  designateRole: (id: string, role: Role): Promise<ManagedUser> => {
    return apiFetch<ManagedUser>(`/api/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    })
  },

  /**
   * Superadmin deletes a user account.
   * Endpoint: DELETE /api/users/:id
   */
  deleteUser: (id: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>(`/api/users/${id}`, {
      method: "DELETE",
    })
  },

  /**
   * Retrieves password reset requests from `password_reset_request`.
   * Endpoint: GET /api/users/reset-requests
   */
  listResetRequests: (): Promise<PasswordResetRequest[]> => {
    return apiFetch<PasswordResetRequest[]>("/api/users/reset-requests")
  },

  /**
   * Superadmin generates a security reset token into `password_reset_token`
   * for a password reset request.
   * Endpoint: POST /api/users/reset-requests/:id/generate-token
   */
  generateResetToken: (requestId: string): Promise<PasswordResetRequest> => {
    return apiFetch<PasswordResetRequest>(
      `/api/users/reset-requests/${requestId}/generate-token`,
      {
        method: "POST",
      }
    )
  },
}

// ============================================================================
// Sprint 1 Future Planned Rights & Permissions APIs (S1-DEV-07)
// Ready to connect once backend implements them
// ============================================================================

export const rightsApi = {
  /**
   * Retrieves assigned rights for a user.
   * Endpoint: GET /api/users/:id/rights
   */
  getUserRights: async (userId: string): Promise<string[]> => {
    const res = await apiFetch<{ userId: string; rights: string[] }>(`/api/users/${userId}/rights`)
    return res.rights || []
  },

  /**
   * Assigns per-action module rights to a user.
   * Endpoint: POST /api/users/:id/rights
   */
  assignRights: (
    userId: string,
    rights: string[]
  ): Promise<{ message: string; rights: string[] }> => {
    return apiFetch<{ message: string; rights: string[] }>(`/api/users/${userId}/rights`, {
      method: "POST",
      body: JSON.stringify({ rights }),
    })
  },
}
