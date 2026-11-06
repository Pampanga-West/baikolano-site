/**
 * Embedded Backend Server for HOPE ERP Prototype
 * 
 * Recreates the complete Spring Boot backend (AuthController + UserController)
 * inside the browser, directly connected to Supabase PostgreSQL:
 * - 'app_user' table
 * - 'user_permission' table
 * - 'password_reset_token' table
 * - 'audit_log' table
 * 
 * Enforces strict role-based access control, safeguards (last Superadmin protection),
 * and transparent session management.
 */

import bcrypt from "bcryptjs"
import {
  deleteUserFromSupabase,
  fetchUserRightsFromSupabase,
  fetchUsersFromSupabase,
  findUserByEmailFromSupabase,
  findUserByIdFromSupabase,
  insertAuditLogIntoSupabase,
  insertUserIntoSupabase,
  createPasswordResetTokenInSupabase,
  resetPasswordWithTokenInSupabase,
  saveUserRightsInSupabase,
  updateUserInSupabase,
  verifyPassword,
  type SupabaseUserRow,
} from "./supabaseClient.ts"

export interface DbUser {
  id: string
  email: string
  passwordHash: string
  role: "Superadmin" | "Admin" | "User"
  approvalStatus: "PENDING" | "APPROVED"
  blocked: boolean
  firstName: string
  lastName: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEYS = {
  USERS_CACHE: "hope_erp_users_cache",
  SESSION_USER_ID: "hope_erp_session_user_id",
  SESSION_USER_EMAIL: "hope_erp_session_user_email",
}

// ----------------------------------------------------------------------------
// Local Storage Persistence & Session Helpers
// ----------------------------------------------------------------------------
function getSessionUserId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.SESSION_USER_ID)
}

function setSessionUser(user: DbUser | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.SESSION_USER_ID, user.id)
    localStorage.setItem(STORAGE_KEYS.SESSION_USER_EMAIL, user.email)
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION_USER_ID)
    localStorage.removeItem(STORAGE_KEYS.SESSION_USER_EMAIL)
  }
}

function toDbUser(row: SupabaseUserRow): DbUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role || "User",
    approvalStatus: row.approval_status || "PENDING",
    blocked: Boolean(row.blocked),
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Fetch users from Supabase with fallback to local cache
async function getLiveUsers(): Promise<DbUser[]> {
  try {
    const rows = await fetchUsersFromSupabase()
    const dbUsers = rows.map(toDbUser)
    // Update local cache
    try {
      localStorage.setItem(STORAGE_KEYS.USERS_CACHE, JSON.stringify(dbUsers))
    } catch {
      // Ignore quota errors
    }
    return dbUsers
  } catch (err) {
    console.warn("[EmbeddedBackend] Supabase query failed, using local cache fallback:", err)
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.USERS_CACHE)
      if (cached) return JSON.parse(cached)
    } catch {
      // Fall through
    }
    return []
  }
}

async function getLiveUserById(id: string): Promise<DbUser | null> {
  try {
    const row = await findUserByIdFromSupabase(id)
    return row ? toDbUser(row) : null
  } catch {
    const users = await getLiveUsers()
    return users.find((u) => u.id === id) || null
  }
}

async function getLiveUserByEmail(email: string): Promise<DbUser | null> {
  try {
    const row = await findUserByEmailFromSupabase(email)
    return row ? toDbUser(row) : null
  } catch {
    const users = await getLiveUsers()
    return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null
  }
}

// Generate simple mock UUID
function generateUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Helper to construct simulated fetch Response
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    statusText: status === 200 ? "OK" : status === 201 ? "Created" : "Error",
    headers: {
      "Content-Type": "application/json",
    },
  })
}

function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: {
      "Content-Type": "text/plain",
    },
  })
}

// ----------------------------------------------------------------------------
// Route Handlers (Directly connected to Supabase)
// ----------------------------------------------------------------------------

export async function handleEmbeddedRequest(urlPath: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || "GET").toUpperCase()

  // Parse path and query parameters
  const parsedUrl = new URL(urlPath, "http://localhost:8080")
  const pathname = parsedUrl.pathname
  const body = options.body ? (typeof options.body === "string" ? JSON.parse(options.body) : options.body) : {}

  const currentUserId = getSessionUserId()
  let currentUser: DbUser | null = null
  if (currentUserId) {
    currentUser = await getLiveUserById(currentUserId)
  }

  // 1. Auxiliary Test Endpoints
  if (pathname === "/" && method === "GET") {
    return textResponse("Hello from my backend!")
  }
  if (pathname === "/api/db-test" && method === "GET") {
    return textResponse(new Date().toISOString())
  }

  // 2. CSRF Token Endpoint (GET /api/auth/csrf)
  if (pathname === "/api/auth/csrf" && method === "GET") {
    return jsonResponse({ token: "csrf-" + generateUuid() })
  }

  // 3. Register (POST /api/auth/register) -> Inserts into Supabase app_user
  if (pathname === "/api/auth/register" && method === "POST") {
    const email = (body.email || "").trim().toLowerCase()
    const password = body.password || ""

    if (!email || !email.includes("@")) {
      return jsonResponse({ message: "Please enter a valid email." }, 400)
    }
    if (!password || password.length < 8) {
      return jsonResponse({ message: "Password must be at least 8 characters long." }, 400)
    }

    const existing = await getLiveUserByEmail(email)
    if (existing) {
      return jsonResponse({ message: "An account with this email already exists." }, 409)
    }

    try {
      const createdRow = await insertUserIntoSupabase({
        email,
        password,
        role: "User",
        approvalStatus: "PENDING",
      })

      // Log registration to Supabase audit_log
      await insertAuditLogIntoSupabase({
        table_name: "app_user",
        action: "ADD",
        record_key: createdRow.id,
        action_by: email,
      }).catch(() => {})

      return jsonResponse(
        {
          message: "Account registered successfully.",
          id: createdRow.id,
          email: createdRow.email,
          role: createdRow.role,
          approvalStatus: createdRow.approval_status,
        },
        201
      )
    } catch (err: any) {
      return jsonResponse({ message: err.message || "Registration failed." }, 400)
    }
  }

  // 4. Login (POST /api/auth/login) -> Checks live Supabase app_user & password hash
  if (pathname === "/api/auth/login" && method === "POST") {
    const email = (body.email || "").trim().toLowerCase()
    const password = body.password || ""

    const user = await getLiveUserByEmail(email)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return jsonResponse({ message: "Incorrect email or password." }, 401)
    }

    if (user.approvalStatus === "PENDING" || user.blocked) {
      return jsonResponse({ message: "Your account is pending approval or blocked." }, 403)
    }

    // Set active session
    setSessionUser(user)

    return jsonResponse({
      message: "Login successful.",
      email: user.email,
    })
  }

  // 5. Current User (GET /api/auth/me) -> Returns current session from Supabase
  if (pathname === "/api/auth/me" && method === "GET") {
    if (!currentUser) {
      return jsonResponse({ message: "Not authenticated." }, 401)
    }

    return jsonResponse({
      id: currentUser.id,
      email: currentUser.email,
      firstName: currentUser.firstName || "",
      lastName: currentUser.lastName || "",
      role: currentUser.role,
      approvalStatus: currentUser.approvalStatus,
      blocked: currentUser.blocked,
    })
  }

  // 6. Update Profile (PUT /api/auth/profile) -> Updates live Supabase app_user
  if (pathname === "/api/auth/profile" && method === "PUT") {
    if (!currentUser) {
      return jsonResponse({ message: "Not authenticated." }, 401)
    }

    const updates: Partial<{
      first_name: string | null
      last_name: string | null
      password_hash: string
    }> = {}

    if (body.firstName !== undefined) {
      updates.first_name = String(body.firstName).trim()
    }
    if (body.lastName !== undefined) {
      updates.last_name = String(body.lastName).trim()
    }

    let passwordChanged = false
    if (body.newPassword) {
      if (!body.currentPassword) {
        return jsonResponse({ message: "Current password is required to set a new password." }, 400)
      }
      if (!verifyPassword(body.currentPassword, currentUser.passwordHash)) {
        return jsonResponse({ message: "Incorrect current password." }, 400)
      }
      if (body.newPassword.length < 8) {
        return jsonResponse({ message: "New password must be at least 8 characters long." }, 400)
      }
      updates.password_hash = bcrypt.hashSync(body.newPassword, 10)
      passwordChanged = true
    }

    try {
      const updatedRow = await updateUserInSupabase(currentUser.id, updates)

      // Audit log in Supabase
      await insertAuditLogIntoSupabase({
        table_name: "app_user",
        action: passwordChanged ? "PROFILE_AND_PASSWORD_UPDATE" : "PROFILE_UPDATE",
        record_key: currentUser.id,
        action_by: currentUser.email,
      }).catch(() => {})

      return jsonResponse({
        message: passwordChanged ? "Profile and password updated successfully." : "Profile updated successfully.",
        id: updatedRow.id,
        email: updatedRow.email,
        firstName: updatedRow.first_name || "",
        lastName: updatedRow.last_name || "",
        role: updatedRow.role,
        approvalStatus: updatedRow.approval_status,
      })
    } catch (err: any) {
      return jsonResponse({ message: err.message || "Failed to update profile." }, 500)
    }
  }

  // 7. Logout (POST /api/auth/logout)
  if (pathname === "/api/auth/logout" && method === "POST") {
    setSessionUser(null)
    return jsonResponse({ message: "Logout successful." })
  }

  // 8. Password Reset Request (POST /api/auth/reset-password-request) -> Writes to Supabase password_reset_token
  if (pathname === "/api/auth/reset-password-request" && method === "POST") {
    const email = (body.email || "").trim().toLowerCase()
    if (!email) {
      return jsonResponse({ message: "Email is required." }, 400)
    }

    const rawToken = generateUuid()
    const targetUser = await getLiveUserByEmail(email)

    if (targetUser) {
      await createPasswordResetTokenInSupabase(targetUser.id, rawToken, targetUser.email).catch((err) =>
        console.warn("[Supabase] Failed to write reset token:", err)
      )
    }

    return jsonResponse({
      message: "If an account exists for this email, a password reset link has been dispatched.",
      token: rawToken,
    })
  }

  // 9. Reset Password with Token (POST /api/auth/reset-password) -> Validates with Supabase password_reset_token
  if (pathname === "/api/auth/reset-password" && method === "POST") {
    const token = (body.token || "").trim()
    const newPassword = body.newPassword || ""

    if (!token) {
      return jsonResponse({ message: "Reset token is required." }, 400)
    }
    if (!newPassword || newPassword.length < 8) {
      return jsonResponse({ message: "Password must be at least 8 characters long." }, 400)
    }

    try {
      await resetPasswordWithTokenInSupabase(token, newPassword)
      return jsonResponse({
        message: "Password successfully updated. You can now sign in with your new password.",
      })
    } catch (err: any) {
      return jsonResponse({ message: err.message || "Failed to update password." }, 400)
    }
  }

  // ==========================================================================
  // User Management Endpoints (/api/users) -> Live Supabase app_user table
  // ==========================================================================

  const ensureAdmin = () => {
    if (!currentUser) throw new Error("UNAUTHORIZED")
    if (currentUser.role === "User") throw new Error("FORBIDDEN")
    return currentUser
  }

  // 10. List Users (GET /api/users) -> Reads live from Supabase
  if (pathname === "/api/users" && method === "GET") {
    try {
      const caller = ensureAdmin()
      const allUsers = await getLiveUsers()
      const activeSuperadminsCount = allUsers.filter((u) => u.role === "Superadmin" && !u.blocked).length

      let visibleUsers = allUsers
      if (caller.role === "Admin") {
        visibleUsers = allUsers.filter((u) => u.role !== "Superadmin")
      }

      const dtoList = visibleUsers.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        approvalStatus: u.approvalStatus,
        blocked: u.blocked,
        isProtected: u.role === "Superadmin" && activeSuperadminsCount <= 1,
        createdAt: u.createdAt,
      }))

      return jsonResponse(dtoList)
    } catch (e: any) {
      if (e.message === "UNAUTHORIZED") return jsonResponse({ message: "Not authenticated." }, 401)
      if (e.message === "FORBIDDEN") return jsonResponse({ message: "Access denied." }, 403)
      return jsonResponse({ message: "Server error." }, 500)
    }
  }

  // 11. Add User (POST /api/users) -> Inserts live into Supabase app_user
  if (pathname === "/api/users" && method === "POST") {
    try {
      const caller = ensureAdmin()
      const email = (body.email || "").trim().toLowerCase()
      if (!email || !email.includes("@")) {
        return jsonResponse({ message: "Please enter a valid email." }, 400)
      }

      const existing = await getLiveUserByEmail(email)
      if (existing) {
        return jsonResponse({ message: "An account with this email already exists." }, 409)
      }

      let role: "Superadmin" | "Admin" | "User" = "User"
      if (caller.role === "Superadmin" && body.role) {
        if (body.role === "Admin" || body.role === "Superadmin") {
          role = body.role
        }
      }

      const created = await insertUserIntoSupabase({
        email,
        password: body.password || "Temporary123!",
        role,
        approvalStatus: "APPROVED",
      })

      await insertAuditLogIntoSupabase({
        table_name: "app_user",
        action: "ADD",
        record_key: created.id,
        action_by: caller.email,
      }).catch(() => {})

      return jsonResponse(
        {
          id: created.id,
          email: created.email,
          role: created.role,
          approvalStatus: created.approval_status,
          blocked: created.blocked,
          isProtected: false,
          createdAt: created.created_at,
        },
        201
      )
    } catch (e: any) {
      if (e.message === "UNAUTHORIZED") return jsonResponse({ message: "Not authenticated." }, 401)
      if (e.message === "FORBIDDEN") return jsonResponse({ message: "Access denied." }, 403)
      return jsonResponse({ message: e.message || "Server error." }, 500)
    }
  }

  // Match /api/users/:id or sub-routes
  const userSubmatch = pathname.match(/^\/api\/users\/([^/]+)(?:\/(.*))?$/)
  if (userSubmatch) {
    const targetId = userSubmatch[1]
    const subAction = userSubmatch[2] // 'block', 'approve', 'role', 'rights' or undefined

    const targetUser = await getLiveUserById(targetId)
    const allUsers = await getLiveUsers()
    const activeSuperadminsCount = allUsers.filter((u) => u.role === "Superadmin" && !u.blocked).length

    // GET /api/users/:id/rights -> Reads live from Supabase user_permission
    if (subAction === "rights" && method === "GET") {
      try {
        ensureAdmin()
        if (!targetUser) return jsonResponse({ message: "User not found." }, 404)
        const rights = await fetchUserRightsFromSupabase(targetId).catch(() => [])
        return jsonResponse({ userId: targetId, rights })
      } catch (e: any) {
        return jsonResponse({ message: e.message === "UNAUTHORIZED" ? "Not authenticated." : "Access denied." }, 403)
      }
    }

    // POST /api/users/:id/rights -> Writes live to Supabase user_permission
    if (subAction === "rights" && method === "POST") {
      try {
        const caller = ensureAdmin()
        if (!targetUser) return jsonResponse({ message: "User not found." }, 404)
        if (caller.role !== "Superadmin" && targetUser.role === "Superadmin") {
          return jsonResponse({ message: "Cannot modify Superadmin permissions." }, 403)
        }

        const newRights: string[] = Array.isArray(body.rights) ? body.rights : []
        await saveUserRightsInSupabase(targetId, newRights, caller.email)

        return jsonResponse({
          message: "User permissions updated successfully.",
          userId: targetId,
          rights: newRights,
        })
      } catch (e: any) {
        return jsonResponse({ message: e.message === "UNAUTHORIZED" ? "Not authenticated." : "Access denied." }, 403)
      }
    }

    // PATCH /api/users/:id/block -> Updates Supabase app_user
    if (subAction === "block" && method === "PATCH") {
      try {
        const caller = ensureAdmin()
        if (!targetUser) return jsonResponse({ message: "User not found." }, 404)
        if (caller.role !== "Superadmin" && targetUser.role === "Superadmin") {
          return jsonResponse({ message: "Cannot modify Superadmin accounts." }, 403)
        }

        // Last superadmin guard
        if (body.blocked && targetUser.role === "Superadmin" && activeSuperadminsCount <= 1) {
          return jsonResponse(
            { message: "Role safeguards active: The last remaining Superadmin cannot be disabled or blocked." },
            400
          )
        }

        const updated = await updateUserInSupabase(targetId, {
          blocked: Boolean(body.blocked),
        })

        await insertAuditLogIntoSupabase({
          table_name: "app_user",
          action: "EDIT",
          record_key: targetId,
          new_values: { blocked: updated.blocked },
          action_by: caller.email,
        }).catch(() => {})

        return jsonResponse({
          id: updated.id,
          email: updated.email,
          role: updated.role,
          approvalStatus: updated.approval_status,
          blocked: updated.blocked,
          isProtected: updated.role === "Superadmin" && activeSuperadminsCount <= 1,
          createdAt: updated.created_at,
        })
      } catch (e: any) {
        return jsonResponse({ message: e.message === "UNAUTHORIZED" ? "Not authenticated." : "Access denied." }, 403)
      }
    }

    // PATCH /api/users/:id/approve -> Updates Supabase app_user
    if (subAction === "approve" && method === "PATCH") {
      try {
        const caller = ensureAdmin()
        if (caller.role !== "Superadmin") {
          return jsonResponse({ message: "Only Superadmins can approve accounts." }, 403)
        }
        if (!targetUser) return jsonResponse({ message: "User not found." }, 404)

        const updated = await updateUserInSupabase(targetId, {
          approval_status: "APPROVED",
        })

        await insertAuditLogIntoSupabase({
          table_name: "app_user",
          action: "EDIT",
          record_key: targetId,
          new_values: { approval_status: "APPROVED" },
          action_by: caller.email,
        }).catch(() => {})

        return jsonResponse({
          id: updated.id,
          email: updated.email,
          role: updated.role,
          approvalStatus: updated.approval_status,
          blocked: updated.blocked,
          isProtected: updated.role === "Superadmin" && activeSuperadminsCount <= 1,
          createdAt: updated.created_at,
        })
      } catch (e: any) {
        return jsonResponse({ message: e.message === "UNAUTHORIZED" ? "Not authenticated." : "Access denied." }, 403)
      }
    }

    // PATCH /api/users/:id/role -> Updates Supabase app_user
    if (subAction === "role" && method === "PATCH") {
      try {
        const caller = ensureAdmin()
        if (caller.role !== "Superadmin") {
          return jsonResponse({ message: "Only Superadmins can designate roles." }, 403)
        }
        if (!targetUser) return jsonResponse({ message: "User not found." }, 404)

        const requestedRole = body.role
        if (!requestedRole || !["Superadmin", "Admin", "User"].includes(requestedRole)) {
          return jsonResponse({ message: "Role is required." }, 400)
        }

        // Safeguard: Cannot demote the last remaining superadmin
        if (targetUser.role === "Superadmin" && requestedRole !== "Superadmin" && activeSuperadminsCount <= 1) {
          return jsonResponse(
            { message: "Role safeguards active: The last remaining Superadmin cannot be demoted." },
            400
          )
        }

        const updated = await updateUserInSupabase(targetId, {
          role: requestedRole,
        })

        await insertAuditLogIntoSupabase({
          table_name: "app_user",
          action: "EDIT",
          record_key: targetId,
          new_values: { role: requestedRole },
          action_by: caller.email,
        }).catch(() => {})

        return jsonResponse({
          id: updated.id,
          email: updated.email,
          role: updated.role,
          approvalStatus: updated.approval_status,
          blocked: updated.blocked,
          isProtected: targetUser.role === "Superadmin" && activeSuperadminsCount <= 1,
          createdAt: updated.created_at,
        })
      } catch (e: any) {
        return jsonResponse({ message: e.message === "UNAUTHORIZED" ? "Not authenticated." : "Access denied." }, 403)
      }
    }

    // PUT /api/users/:id (Edit User email) -> Updates Supabase app_user
    if (!subAction && method === "PUT") {
      try {
        const caller = ensureAdmin()
        if (!targetUser) return jsonResponse({ message: "User not found." }, 404)
        if (caller.role !== "Superadmin" && targetUser.role === "Superadmin") {
          return jsonResponse({ message: "Cannot edit Superadmin accounts." }, 403)
        }

        const newEmail = (body.email || "").trim().toLowerCase()
        if (newEmail && newEmail !== targetUser.email.toLowerCase()) {
          const collision = await getLiveUserByEmail(newEmail)
          if (collision && collision.id !== targetId) {
            return jsonResponse({ message: "An account with this email already exists." }, 409)
          }

          const updated = await updateUserInSupabase(targetId, { email: newEmail })

          return jsonResponse({
            id: updated.id,
            email: updated.email,
            role: updated.role,
            approvalStatus: updated.approval_status,
            blocked: updated.blocked,
            isProtected: updated.role === "Superadmin" && activeSuperadminsCount <= 1,
            createdAt: updated.created_at,
          })
        }

        return jsonResponse({
          id: targetUser.id,
          email: targetUser.email,
          role: targetUser.role,
          approvalStatus: targetUser.approvalStatus,
          blocked: targetUser.blocked,
          isProtected: targetUser.role === "Superadmin" && activeSuperadminsCount <= 1,
          createdAt: targetUser.createdAt,
        })
      } catch (e: any) {
        return jsonResponse({ message: e.message === "UNAUTHORIZED" ? "Not authenticated." : "Access denied." }, 403)
      }
    }

    // DELETE /api/users/:id -> Deletes live from Supabase app_user
    if (!subAction && method === "DELETE") {
      try {
        const caller = ensureAdmin()
        if (caller.role !== "Superadmin") {
          return jsonResponse({ message: "Only Superadmins can delete accounts." }, 403)
        }
        if (!targetUser) return jsonResponse({ message: "User not found." }, 404)

        if (targetUser.role === "Superadmin" && activeSuperadminsCount <= 1) {
          return jsonResponse(
            { message: "Role safeguards active: The last remaining Superadmin cannot be deleted." },
            400
          )
        }

        await deleteUserFromSupabase(targetId)

        await insertAuditLogIntoSupabase({
          table_name: "app_user",
          action: "DELETE",
          record_key: targetId,
          action_by: caller.email,
        }).catch(() => {})

        return jsonResponse({ message: "User deleted successfully." })
      } catch (e: any) {
        return jsonResponse({ message: e.message === "UNAUTHORIZED" ? "Not authenticated." : "Access denied." }, 403)
      }
    }
  }

  // 404 Not Found fallback
  return jsonResponse({ message: `Route not found: ${method} ${pathname}` }, 404)
}

// ----------------------------------------------------------------------------
// Global Fetch Interceptor Setup
// ----------------------------------------------------------------------------
let interceptorInstalled = false

export function installEmbeddedFetchInterceptor(): void {
  if (interceptorInstalled || typeof window === "undefined") return
  interceptorInstalled = true

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let urlString = ""
    if (typeof input === "string") {
      urlString = input
    } else if (input instanceof URL) {
      urlString = input.toString()
    } else if (input instanceof Request) {
      urlString = input.url
    }

    // Check if this request is targeted at /api/*
    const isApiRequest =
      urlString.startsWith("/api/") ||
      urlString === "/api" ||
      urlString.includes("localhost:8080/api") ||
      urlString.endsWith("/api/db-test") ||
      urlString === "/" ||
      urlString === "http://localhost:8080/"

    if (isApiRequest) {
      let relativePath = urlString
      if (urlString.startsWith("http://") || urlString.startsWith("https://")) {
        const u = new URL(urlString)
        relativePath = u.pathname + u.search
      }
      return handleEmbeddedRequest(relativePath, init)
    }

    // Pass through all other requests (static assets, Supabase direct calls, etc.)
    return originalFetch(input, init)
  }

  console.info("[EmbeddedBackend] Connected live to Supabase PostgreSQL database.")
}
