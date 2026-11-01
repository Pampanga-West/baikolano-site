import { useEffect, useState, type FormEvent } from "react"
import Badge from "../components/Badge"
import Button from "../components/Button"
import Field from "../components/Field"
import Icon from "../components/Icon"
import ModalShell from "../components/ModalShell"
import { userApi } from "../lib/api"
import type { ManagedUser, Role } from "../lib/types"

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
  const [addEmail, setAddEmail] = useState("")
  const [addPassword, setAddPassword] = useState("Temporary123!")
  const [addRole, setAddRole] = useState<Role>("User")
  const [addLoading, setAddLoading] = useState(false)

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [editEmail, setEditEmail] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  // Action in flight
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

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
  }, [])

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
        email: addEmail.trim(),
        password: addPassword.trim(),
        role: addRole,
      })
      setSuccess(`Account created for ${addEmail.trim()}.`)
      setIsAddOpen(false)
      setAddEmail("")
      setAddPassword("Temporary123!")
      setAddRole("User")
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
      await userApi.updateUser(editingUser.id, { email: editEmail.trim() })
      setSuccess(`User email updated to ${editEmail.trim()}.`)
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
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()))

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
              placeholder="Search users by email..."
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
                  const initials = u.email.slice(0, 2).toUpperCase()
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
                            <b>{u.email.split("@")[0]}</b>
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
                                setEditEmail(u.email)
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

            {role === "Superadmin" && (
              <label className="field" style={{ marginTop: "12px", display: "block" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                  Role Assignment
                </span>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as Role)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    fontSize: "13px",
                  }}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Superadmin">Superadmin</option>
                </select>
              </label>
            )}
          </form>
        </ModalShell>
      )}

      {/* ==================== EDIT USER MODAL ==================== */}
      {editingUser && (
        <ModalShell
          title="Edit User Details"
          subtitle={`Update email address for ${editingUser.email}.`}
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
            <Field
              label="Email address"
              type="email"
              value={editEmail}
              onChange={setEditEmail}
            />
          </form>
        </ModalShell>
      )}
    </div>
  )
}
