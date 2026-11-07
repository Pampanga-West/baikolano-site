export type Role = "Superadmin" | "Admin" | "User"
export type AccountStatus = "ACTIVE" | "PENDING" | "BLOCKED"
export type AuthView = "login" | "register" | "reset" | "new-password" | null
export type AppView = "landing" | "dashboard" | "customers" | "products" | "hr" | "sales" | "reports" | "users" | "audit" | "profile"

export function normalizeRole(rawRole?: string | null): Role {
  if (!rawRole) return "User"
  const normalized = rawRole.trim().toLowerCase()
  if (normalized === "superadmin") return "Superadmin"
  if (normalized === "admin") return "Admin"
  return "User"
}

export type IconName =
  | "arrow"
  | "briefcase"
  | "building"
  | "check"
  | "chevron"
  | "dashboard"
  | "eye"
  | "eyeOff"
  | "google"
  | "lock"
  | "logout"
  | "mail"
  | "menu"
  | "package"
  | "plus"
  | "report"
  | "search"
  | "settings"
  | "shield"
  | "sparkle"
  | "users"
  | "x"

export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: Role
  approvalStatus?: "PENDING" | "APPROVED"
  blocked?: boolean
  createdAt?: string
}

export interface AuthResponse {
  message: string
  id?: string
  email?: string
  approvalStatus?: string
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

// Sprint 1 Planned User Management Types (S1-DEV-05, S1-DEV-06, S1-DEV-07)
export interface ManagedUser {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  role: Role
  approvalStatus: "PENDING" | "APPROVED"
  blocked: boolean
  isProtected?: boolean
  createdAt?: string
}

export interface UserPermission {
  id: string
  userId: string
  module: string
  action: string
  granted: boolean
}

export interface PasswordResetRequest {
  id: string
  userId: string | null
  email: string
  securityResetToken: string | null
  status: "PENDING" | "TOKEN_GENERATED" | "COMPLETED" | string
  used: boolean
  requestedAt: string
  expiresAt: string | null
  completedAt: string | null
}

