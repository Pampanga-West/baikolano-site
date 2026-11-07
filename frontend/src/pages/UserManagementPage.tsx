import { useEffect, useState, type FormEvent } from "react"
import Badge from "../components/Badge"
import Button from "../components/Button"
import Field from "../components/Field"
import Icon from "../components/Icon"
import ModalShell from "../components/ModalShell"
import { userApi } from "../lib/api"
import type { AccountStatus, ManagedUser, PasswordResetRequest, Role } from "../lib/types"

const selectStyle = {
  width: "100%",
  height: "44px",
  padding: "0 13px",
  borderRadius: "9px",
  border: "1px solid #d7d9dd",
  background: "var(--white)",
  color: "var(--ink)",
  fontSize: "14px",
}

function getUserStatus(u: ManagedUser): AccountStatus {
  if (u.approvalStatus === "PENDING") return "PENDING"
  if (u.blocked) return "BLOCKED"
  return "ACTIVE"
}

export default function UserManagementPage({
  role,
  openRights,
}: {
  role: Role
  openRights: (user: ManagedUser) => void
}) {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // Add User Modal State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addFirstName, setAddFirstName] = useState("")
  const [addLastName, setAddLastName] = useState("")
  const [addEmail, setAddEmail] = useState("")
  const [addPassword, setAddPassword] = useState("Temporary123!")
  const [addRole, setAddRole] = useState<Role>("User")
  const [addStatus, setAddStatus] = useState<AccountStatus>("ACTIVE")
  const [addLoading, setAddLoading] = useState(false)

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState<Role>("User")
  const [editStatus, setEditStatus] = useState<AccountStatus>("ACTIVE")
  const [editLoading, setEditLoading] = useState(false)

  // Action in flight
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Password Reset Requests State (Superadmin)
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([])
  const [resetLoading, setResetLoading] = useState(false)
  const [generatingRequestId, setGeneratingRequestId] = useState<string | null>(null)
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null)
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)

  const fetchResetRequests = async () => {
    setResetLoading(true)
    try {
      const list = await userApi.listResetRequests()
      setResetRequests(list)
    } catch {
      // Ignore if unavailable
    } finally {
      setResetLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await userApi.listUsers()
      setUsers(data)
    } catch (err: any) {
      setError(err.message || "Failed to load user accounts.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchResetRequests()
  }, [])

  const handleGenerateResetToken = async (req: PasswordResetRequest) => {
    setGeneratingRequestId(req.id)
    setError(null)
    try {
      const updated = await userApi.generateResetToken(req.id)
      setResetRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setSuccess(
        `Security reset token generated in password_reset_token for ${req.email}: ${updated.securityResetToken}`
      )
    } catch (err: any) {
      setError(err.message || "Failed to generate security reset token.")
    } finally {
      setGeneratingRequestId(null)
    }
  }

  const handleCopyToken = async (req: PasswordResetRequest) => {
    if (!req.securityResetToken) return
    try {
      await navigator.clipboard.writeText(req.securityResetToken)
      setCopiedTokenId(req.id)
      setTimeout(() => setCopiedTokenId(null), 2000)
    } catch {
      // Fallback
    }
  }

  const handleDeleteResetRequest = async (req: PasswordResetRequest) => {
    setDeletingRequestId(req.id)
    setError(null)
    try {
      await userApi.deleteResetRequest(req.id)
      setResetRequests((prev) => prev.filter((r) => r.id !== req.id))
      setSuccess(`Deleted password reset request and token for ${req.email}.`)
    } catch (err: any) {
      setError(err.message || "Failed to delete password reset token.")
    } finally {
      setDeletingRequestId(null)
    }
  }

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!addEmail.trim()) {
      setError("Please provide an email address.")
      return
    }

    setAddLoading(true)
    setError(null)
    try {
      await userApi.addUser({
        firstName: addFirstName.trim(),
        lastName: addLastName.trim(),
        email: addEmail.trim(),
        password: addPassword.trim(),
        role: addRole,
        status: addStatus,
      })
      setSuccess(`Account created for ${addEmail.trim()}.`)
      setIsAddOpen(false)
      setAddFirstName("")
      setAddLastName("")
      setAddEmail("")
      setAddPassword("Temporary123!")
      setAddRole("User")
      setAddStatus("ACTIVE")
      fetchUsers()
    } catch (err: any) {
      setError(err.message || "Failed to add user.")
    } finally {
      setAddLoading(false)
    }
  }

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingUser || !editEmail.trim()) return

    setEditLoading(true)
    setError(null)
    try {
      await userApi.updateUser(editingUser.id, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        role: editRole,
        status: editStatus,
      })
      setSuccess(`Account details updated for ${editEmail.trim()}.`)
      setEditingUser(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || "Failed to update user.")
    } finally {
      setEditLoading(false)
    }
  }

  const handleToggleBlock = async (u: ManagedUser) => {
    setActionLoadingId(u.id)
    setError(null)
    try {
      await userApi.toggleBlockUser(u.id, !u.blocked)
      setSuccess(`Account for ${u.email} was ${u.blocked ? "unblocked" : "blocked"}.`)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || "Failed to change block status.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleApprove = async (u: ManagedUser) => {
    setActionLoadingId(u.id)
    setError(null)
    try {
      await userApi.approveUser(u.id)
      setSuccess(`Account for ${u.email} approved successfully.`)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || "Failed to approve account.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDesignateRole = async (u: ManagedUser, nextRole: Role) => {
    setActionLoadingId(u.id)
    setError(null)
    try {
      await userApi.designateRole(u.id, nextRole)
      setSuccess(`Role for ${u.email} updated to ${nextRole}.`)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || "Failed to update role.")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase()
    const matchesSearch =
      u.email.toLowerCase().includes(query) ||
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.firstName && u.firstName.toLowerCase().includes(query)) ||
      (u.lastName && u.lastName.toLowerCase().includes(query))

    const matchesRole =
      roleFilter === "ALL" || u.role?.toLowerCase() === roleFilter.toLowerCase()

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.approvalStatus === "APPROVED" && !u.blocked) ||
      (statusFilter === "BLOCKED" && u.blocked) ||
      (statusFilter === "PENDING" && u.approvalStatus === "PENDING")

    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className="page">
      <div className="page-heading user-heading">
        <div>
          <span>Administration</span>
          <div className="page-title">User Management</div>
          <p>
            {role === "Admin"
              ? "Admin: manage regular Users only. Superadmin accounts are hidden and cannot be modified."
              : "Manage people, roles, access status, and module permissions."}
          </p>
        </div>
        <Button icon="plus" onClick={() => setIsAddOpen(true)}>
          Add User
        </Button>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <Icon name="lock" />
          <span>
            <b>Notice</b>
            {error}
          </span>
        </div>
      )}

      {success && (
        <div className="info-banner" role="status">
          <Icon name="check" />
          <span>
            <b>Operation completed</b>
            {success}
          </span>
        </div>
      )}

      <div className="management-note">
        <Icon name="shield" />
        <span>
          <b>Role safeguards are active.</b> The last remaining Superadmin
          cannot be disabled or demoted.
        </span>
        <span className="tooltip-wrap">
          Why?
          <i className="tooltip">
            This ensures your organization always retains one account with full
            system access.
          </i>
        </span>
      </div>

      <section className="table-card">
        <div className="table-tools">
          <div className="table-search" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Icon name="search" size={17} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                width: "100%",
                fontSize: "13px",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <option value="ALL">All roles</option>
              {role === "Superadmin" && <option value="Superadmin">Superadmin</option>}
              {role === "Superadmin" && <option value="Admin">Admin</option>}
              <option value="User">User</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px 0" }}>
                    <div className="module-loading">
                      <span></span>
                      Loading user accounts…
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
                    No users match your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.name || ""
                  const initials = (
                    u.firstName && u.lastName
                      ? `${u.firstName[0]}${u.lastName[0]}`
                      : fullName
                      ? fullName.slice(0, 2)
                      : u.email.slice(0, 2)
                  ).toUpperCase()
                  const isBusy = actionLoadingId === u.id
                  const isPending = u.approvalStatus === "PENDING"
                  const isBlocked = u.blocked

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-cell">
                          <span
                            className={`avatar ${
                              u.role === "Superadmin"
                                ? "gold"
                                : u.role === "Admin"
                                ? "blue"
                                : "sage"
                            }`}
                          >
                            {initials}
                          </span>
                          <div>
                            <b>{fullName || u.email.split("@")[0]}</b>
                            <small>{u.role}</small>
                          </div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <Badge kind={u.role.toLowerCase()}>{u.role.toUpperCase()}</Badge>
                      </td>
                      <td>
                        {isPending ? (
                          <Badge kind="pending">PENDING</Badge>
                        ) : isBlocked ? (
                          <Badge kind="blocked">BLOCKED</Badge>
                        ) : (
                          <Badge kind="active">ACTIVE</Badge>
                        )}
                      </td>
                      <td>
                        {u.isProtected ? (
                          <span className="protected-action" tabIndex={0}>
                            Protected
                            <i>The last remaining Superadmin cannot be disabled or demoted.</i>
                          </span>
                        ) : isPending ? (
                          role === "Superadmin" ? (
                            <div className="row-actions">
                              <button
                                className="approve"
                                disabled={isBusy}
                                onClick={() => handleApprove(u)}
                              >
                                {isBusy ? "…" : "Approve"}
                              </button>
                              <button
                                disabled={isBusy}
                                onClick={() => handleDesignateRole(u, "Admin")}
                              >
                                Designate Admin
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(u)
                                  setEditFirstName(u.firstName || "")
                                  setEditLastName(u.lastName || "")
                                  setEditEmail(u.email)
                                  setEditRole(u.role)
                                  setEditStatus(getUserStatus(u))
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <span className="muted">Awaiting Superadmin</span>
                          )
                        ) : (
                          <div className="row-actions">
                            <button
                              className={isBlocked ? "success-link" : "danger-link"}
                              disabled={isBusy}
                              onClick={() => handleToggleBlock(u)}
                            >
                              {isBusy ? "…" : isBlocked ? "Unblock" : "Block"}
                            </button>

                            {role === "Superadmin" && (
                              <button
                                disabled={isBusy}
                                onClick={() =>
                                  handleDesignateRole(
                                    u,
                                    u.role === "Admin" ? "User" : "Admin"
                                  )
                                }
                              >
                                {u.role === "Admin" ? "Set to User" : "Designate Admin"}
                              </button>
                            )}

                            <button onClick={() => openRights(u)}>Rights</button>
                            <button
                              onClick={() => {
                                setEditingUser(u)
                                setEditFirstName(u.firstName || "")
                                setEditLastName(u.lastName || "")
                                setEditEmail(u.email)
                                setEditRole(u.role)
                                setEditStatus(getUserStatus(u))
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing {filteredUsers.length} of {users.length} accounts
          </span>
          <span>
            <button disabled>Previous</button>
            <b>1</b>
            <button disabled>Next</button>
          </span>
        </div>
      </section>

      {/* ==================== PASSWORD RESET REQUESTS (SUPERADMIN) ==================== */}
      {role === "Superadmin" && (
        <section className="table-card" style={{ marginTop: "28px" }}>
          <div className="table-tools">
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)" }}>
                Password Reset Requests
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                Review user reset requests from <code>password_reset_request</code> and generate tokens into{" "}
                <code>password_reset_token</code> to send to users.
              </div>
            </div>
            <Button variant="secondary" onClick={fetchResetRequests} disabled={resetLoading}>
              {resetLoading ? "Refreshing…" : "Refresh Requests"}
            </Button>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Email Address</th>
                  <th>Requested At</th>
                  <th>Status</th>
                  <th>Security Reset Token</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resetLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "28px 0" }}>
                      <div className="module-loading">
                        <span></span>
                        Loading password reset requests…
                      </div>
                    </td>
                  </tr>
                ) : resetRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)" }}>
                      No password reset requests found.
                    </td>
                  </tr>
                ) : (
                  resetRequests.map((req) => {
                    const isGenerating = generatingRequestId === req.id
                    const isDeleting = deletingRequestId === req.id
                    const isCompleted = req.used || req.status === "COMPLETED"
                    const hasToken = Boolean(req.securityResetToken)

                    return (
                      <tr key={req.id}>
                        <td>
                          <b>{req.email}</b>
                        </td>
                        <td>
                          {req.requestedAt
                            ? new Date(req.requestedAt).toLocaleString()
                            : "—"}
                        </td>
                        <td>
                          {isCompleted ? (
                            <Badge kind="active">COMPLETED</Badge>
                          ) : hasToken ? (
                            <Badge kind="admin">TOKEN GENERATED</Badge>
                          ) : (
                            <Badge kind="pending">PENDING</Badge>
                          )}
                        </td>
                        <td>
                          {req.securityResetToken ? (
                            <code
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "var(--ink)",
                              }}
                            >
                              {req.securityResetToken}
                            </code>
                          ) : (
                            <span className="muted">Not generated yet</span>
                          )}
                        </td>
                        <td>
                          <div className="row-actions">
                            {!isCompleted && (
                              <button
                                className="approve"
                                disabled={isGenerating || isDeleting}
                                onClick={() => handleGenerateResetToken(req)}
                              >
                                {isGenerating
                                  ? "Generating…"
                                  : hasToken
                                  ? "Regenerate Token"
                                  : "Generate Token"}
                              </button>
                            )}
                            {hasToken && (
                              <button
                                disabled={isDeleting}
                                onClick={() => handleCopyToken(req)}
                              >
                                {copiedTokenId === req.id ? "Copied!" : "Copy Token"}
                              </button>
                            )}
                            <button
                              className="danger-link"
                              disabled={isGenerating || isDeleting}
                              onClick={() => handleDeleteResetRequest(req)}
                            >
                              {isDeleting ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ==================== ADD USER MODAL ==================== */}
      {isAddOpen && (
        <ModalShell
          title="Add New User"
          subtitle="Provision an account with instant administrator access or user privileges."
          close={() => setIsAddOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSubmit as any} disabled={addLoading}>
                {addLoading ? "Creating…" : "Create Account"}
              </Button>
            </>
          }
        >
          <form onSubmit={handleAddSubmit}>
            <div className="form-grid">
              <Field
                label="First name"
                type="text"
                placeholder="e.g. Juan"
                value={addFirstName}
                onChange={setAddFirstName}
              />
              <Field
                label="Last name"
                type="text"
                placeholder="e.g. Dela Cruz"
                value={addLastName}
                onChange={setAddLastName}
              />
            </div>

            <Field
              label="Email address"
              type="email"
              placeholder="user@company.com"
              value={addEmail}
              onChange={setAddEmail}
            />
            <Field
              label="Temporary password"
              type="text"
              placeholder="Temporary123!"
              value={addPassword}
              onChange={setAddPassword}
            />

            <div className="form-grid">
              <label className="field">
                <span>Role Assignment</span>
                <div className="input-wrap">
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as Role)}
                    disabled={role !== "Superadmin"}
                    style={selectStyle}
                  >
                    <option value="User">User</option>
                    {role === "Superadmin" && <option value="Admin">Admin</option>}
                    {role === "Superadmin" && <option value="Superadmin">Superadmin</option>}
                  </select>
                </div>
              </label>

              <label className="field">
                <span>Account Status</span>
                <div className="input-wrap">
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as AccountStatus)}
                    style={selectStyle}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </label>
            </div>
          </form>
        </ModalShell>
      )}

      {/* ==================== EDIT USER MODAL ==================== */}
      {editingUser && (
        <ModalShell
          title="Edit User Details"
          subtitle={`Update account information, role, and status for ${editingUser.email}.`}
          close={() => setEditingUser(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditSubmit as any} disabled={editLoading}>
                {editLoading ? "Saving…" : "Save Changes"}
              </Button>
            </>
          }
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-grid">
              <Field
                label="First name"
                type="text"
                placeholder="e.g. Juan"
                value={editFirstName}
                onChange={setEditFirstName}
              />
              <Field
                label="Last name"
                type="text"
                placeholder="e.g. Dela Cruz"
                value={editLastName}
                onChange={setEditLastName}
              />
            </div>

            <Field
              label="Email address"
              type="email"
              value={editEmail}
              onChange={setEditEmail}
            />

            <div className="form-grid">
              <label className="field">
                <span>Role Assignment</span>
                <div className="input-wrap">
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                    disabled={role !== "Superadmin"}
                    style={selectStyle}
                  >
                    <option value="User">User</option>
                    {role === "Superadmin" && <option value="Admin">Admin</option>}
                    {role === "Superadmin" && <option value="Superadmin">Superadmin</option>}
                  </select>
                </div>
              </label>

              <label className="field">
                <span>Account Status</span>
                <div className="input-wrap">
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as AccountStatus)}
                    style={selectStyle}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </label>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  )
}
