import { useState, type FormEvent } from "react"
import Badge from "../components/Badge"
import Button from "../components/Button"
import Field from "../components/Field"
import Icon from "../components/Icon"
import { useAuth } from "../contexts/AuthContext"
import type { Role } from "../lib/types"

export default function ProfilePage({ role }: { role: Role }) {
  const { user, updateProfile } = useAuth()

  // Personal Info form state
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [lastName, setLastName] = useState(user?.lastName || "")

  // Password sub-form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")

  // Visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Confirmation modal state for password updates
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  // Status feedback
  const [infoLoading, setInfoLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 1. Dedicated Handler for Personal Information Update
  const handleUpdatePersonalInfo = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setInfoLoading(true)

    try {
      const res = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      setSuccess(res.message || "Personal information updated successfully.")
    } catch (err: any) {
      setError(err.message || "Failed to update personal information.")
    } finally {
      setInfoLoading(false)
    }
  }

  // 2. Pre-submit validation for Password Update
  const handlePreSubmitPassword = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!currentPassword) {
      setError("Current password is required to change your password.")
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters long.")
      return
    }
    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.")
      return
    }

    setConfirmModalOpen(true)
  }

  // 3. Execution of Password Update
  const executePasswordUpdate = async () => {
    setError(null)
    setSuccess(null)
    setPasswordLoading(true)

    try {
      const res = await updateProfile({
        currentPassword,
        newPassword,
      })
      setSuccess(res.message || "Password updated successfully.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      setConfirmModalOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please check your current password.")
      setConfirmModalOpen(false)
    } finally {
      setPasswordLoading(false)
    }
  }

  const userInitials =
    (firstName && lastName
      ? (firstName[0] + lastName[0]).toUpperCase()
      : user?.email?.slice(0, 2).toUpperCase()) || "US"

  return (
    <div className="module-page" style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div className="module-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 6px 0" }}>User Profile & Settings</h1>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "14px" }}>
            Manage your personal profile, account credentials, and security preferences.
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          <Icon name="lock" size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#10b981",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          <Icon name="check" size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Account Overview Card */}
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary, #3b82f6), #1d4ed8)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            fontWeight: 700,
          }}
        >
          {userInitials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : user?.email}
            </h2>
            <Badge kind={role.toLowerCase()}>{role.toUpperCase()}</Badge>
          </div>
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>
            {user?.email} • Status: <span style={{ color: "#10b981", fontWeight: 600 }}>Active</span>
          </div>
        </div>
      </div>

      {/* Section 1: Personal Information Form */}
      <form
        onSubmit={handleUpdatePersonalInfo}
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px 0" }}>Personal Information</h3>
          <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
            Update your display and registered name.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field
            label="First Name"
            placeholder="e.g. John"
            value={firstName}
            onChange={setFirstName}
          />
          <Field
            label="Last Name"
            placeholder="e.g. Doe"
            value={lastName}
            onChange={setLastName}
          />
        </div>

        <div style={{ marginTop: "16px", marginBottom: "20px" }}>
          <label className="field" style={{ opacity: 0.85 }}>
            <span>Email Address (Read-only)</span>
            <div className="input-wrap">
              <input
                type="email"
                value={user?.email || ""}
                disabled
                style={{ cursor: "not-allowed", backgroundColor: "rgba(0,0,0,0.05)" }}
              />
            </div>
          </label>
        </div>

        {/* Dedicated Save Button for Personal Information */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            kind="primary"
            disabled={infoLoading}
            style={{ minWidth: "180px" }}
          >
            {infoLoading ? "Updating info…" : "Update Profile Info"}
          </Button>
        </div>
      </form>

      {/* Section 2: Change Password Form */}
      <form
        onSubmit={handlePreSubmitPassword}
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px 0" }}>Change Password</h3>
          <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
            Ensure your account is using a long and random password to stay secure.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Field
            label="Current Password"
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Enter your existing password"
            value={currentPassword}
            onChange={setCurrentPassword}
            end={
              <button
                type="button"
                className="field-action"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                <Icon name={showCurrentPassword ? "eyeOff" : "eye"} />
              </button>
            }
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={setNewPassword}
              end={
                <button
                  type="button"
                  className="field-action"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showNewPassword ? "eyeOff" : "eye"} />
                </button>
              }
            />
            <Field
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmNewPassword}
              onChange={setConfirmNewPassword}
              end={
                <button
                  type="button"
                  className="field-action"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showConfirmPassword ? "eyeOff" : "eye"} />
                </button>
              }
            />
          </div>

          {/* Dedicated Save Button for Password Change */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <Button
              type="submit"
              kind="outline"
              disabled={passwordLoading}
              style={{ minWidth: "180px" }}
            >
              {passwordLoading ? "Updating password…" : "Update Password"}
            </Button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal for Password Updates */}
      {confirmModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm Password Change"
            style={{ maxWidth: "460px" }}
          >
            <button
              className="icon-button modal-close"
              onClick={() => setConfirmModalOpen(false)}
              aria-label="Close"
            >
              <Icon name="x" />
            </button>
            <div className="auth-heading">
              <div className="modal-title">Confirm Password Change</div>
              <p>Are you sure you want to change your password?</p>
            </div>

            <div style={{ margin: "20px 0", fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
              Updating your password will immediately invalidate your old password. Subsequent logins will require your newly set password.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <Button
                kind="outline"
                onClick={() => setConfirmModalOpen(false)}
                disabled={passwordLoading}
              >
                Cancel
              </Button>
              <Button
                kind="primary"
                onClick={executePasswordUpdate}
                disabled={passwordLoading}
              >
                {passwordLoading ? "Confirming…" : "Yes, Update Password"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
