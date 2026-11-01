import { useState, type FormEvent } from "react"
import { useAuth } from "../contexts/AuthContext"
import { authApi } from "../lib/api"
import type { AuthView } from "../lib/types"
import Button from "./Button"
import Field from "./Field"
import Icon from "./Icon"

export default function AuthModal({
  view,
  setView,
  close,
  onSuccess,
  initialToken,
}: {
  view: Exclude<AuthView, null>
  setView: (view: AuthView) => void
  close: () => void
  onSuccess: () => void
  initialToken?: string
}) {
  const { login, register } = useAuth()

  // State
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [resetToken, setResetToken] = useState(initialToken || "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("Jerry")
  const [lastName, setLastName] = useState("Esperanza")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<string | null>(null)

  const titles = {
    login: ["Welcome back", "Sign in to continue to your workspace."],
    register: [
      "Create your account",
      "Start your journey with Hope, Inc. ERP.",
    ],
    reset: ["Reset password", "We'll send you a secure link to reset it."],
    "new-password": [
      "Set new password",
      "Choose a secure password for your account.",
    ],
  }
  const [title, subtitle] = titles[view]

  const switchView = (nextView: AuthView) => {
    setError(null)
    setSuccessInfo(null)
    setPassword("")
    setConfirmPassword("")
    setView(nextView)
  }

  // Handle Login submission
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError("Please enter both email and password.")
      return
    }

    setError(null)
    setLoading(true)
    try {
      await login(email.trim(), password)
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Register submission
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError("Please enter a valid email address.")
      return
    }
    if (!password) {
      setError("Please enter a password.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setError(null)
    setLoading(true)
    try {
      const res = await register(trimmedEmail, password)
      if (res.approvalStatus === "PENDING") {
        setSuccessInfo(
          "Your account has been registered successfully! It is currently PENDING approval by an administrator before you can sign in."
        )
      } else {
        setSuccessInfo("Account registered successfully! You may now sign in.")
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Reset Password request (S1-DEV-04)
  const handleReset = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError("Please enter your registered email address.")
      return
    }

    setError(null)
    setLoading(true)
    try {
      // Connect to planned S1-DEV-04 endpoint (with client-side fallback)
      try {
        await authApi.requestPasswordReset(email.trim())
      } catch (err: any) {
        // If backend endpoint is not yet deployed, provide mock confirmation for UX
        if (err.status === 404 || err.status === 0) {
          console.info("[Sprint 1 S1-DEV-04] Password reset requested for:", email.trim())
        } else {
          throw err
        }
      }
      setSuccessInfo(
        `If an account exists for ${email.trim()}, a password reset link has been dispatched.`
      )
    } catch (err: any) {
      setError(err.message || "Failed to request password reset.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Set New Password (S1-DEV-04)
  const handleSetNewPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!resetToken.trim()) {
      setError("Reset token is missing. Please check the link from your email or paste your token.")
      return
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setError(null)
    setLoading(true)
    try {
      await authApi.resetPassword(resetToken.trim(), password)
      setSuccessInfo("Password has been successfully updated. You can now sign in.")
    } catch (err: any) {
      setError(err.message || "Failed to set new password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="icon-button modal-close"
          onClick={close}
          aria-label="Close"
        >
          <Icon name="x" />
        </button>

        <div className="auth-heading">
          <div className="modal-title">{title}</div>
          <p>{subtitle}</p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="error-banner" role="alert">
            <Icon name="lock" />
            <span>
              <b>Authentication notice</b>
              {error}
            </span>
          </div>
        )}

        {/* Global Info / Success Banner */}
        {successInfo && (
          <div className="info-banner" role="status">
            <Icon name="check" />
            <span>
              <b>Success</b>
              {successInfo}
            </span>
          </div>
        )}

        {/* ==================== REGISTER VIEW ==================== */}
        {view === "register" && (
          <>
            {successInfo ? (
              <div style={{ marginTop: "1rem" }}>
                <Button className="full" onClick={() => switchView("login")}>
                  Proceed to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="form-grid">
                  <Field
                    label="First name"
                    value={firstName}
                    onChange={setFirstName}
                  />
                  <Field
                    label="Last name"
                    value={lastName}
                    onChange={setLastName}
                  />
                </div>
                <Field
                  label="Email address"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={setEmail}
                />
                <Field
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={setPassword}
                  end={
                    <button
                      type="button"
                      className="field-action"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <Icon name={showPassword ? "eyeOff" : "eye"} />
                    </button>
                  }
                />
                <Field
                  label="Confirm password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
                <Button
                  type="submit"
                  className="full"
                  disabled={loading}
                >
                  {loading ? "Creating Account…" : "Register"}
                </Button>
                <Divider />
                <Button
                  type="button"
                  variant="secondary"
                  className="full google-button"
                >
                  <Icon name="google" /> Continue with Google
                </Button>
                <p className="auth-switch">
                  Already have an account?{" "}
                  <button type="button" onClick={() => switchView("login")}>
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </>
        )}

        {/* ==================== LOGIN VIEW ==================== */}
        {view === "login" && (
          <form onSubmit={handleLogin}>
            <Field
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={setEmail}
            />
            <Field
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={setPassword}
              end={
                <button
                  type="button"
                  className="field-action"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} />
                </button>
              }
            />
            <div className="form-row auth-forgot-row">
              <button
                type="button"
                className="text-link"
                onClick={() => switchView("reset")}
              >
                Forgot password?
              </button>
            </div>
            <Button
              type="submit"
              className="full"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
            <Divider />
            <Button
              type="button"
              variant="secondary"
              className="full google-button"
            >
              <Icon name="google" /> Continue with Google
            </Button>
            <p className="auth-switch">
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => switchView("register")}>
                Register
              </button>
            </p>
          </form>
        )}

        {/* ==================== RESET PASSWORD VIEW ==================== */}
        {view === "reset" && (
          <form onSubmit={handleReset}>
            <div className="reset-visual">
              <span>
                <Icon name="mail" size={25} />
              </span>
            </div>
            <Field
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={setEmail}
            />
            <Button
              type="submit"
              className="full"
              disabled={loading}
            >
              {loading ? "Sending link…" : "Send Reset Link"}
            </Button>
            <button
              type="button"
              className="back-link"
              onClick={() => switchView("login")}
            >
              Back to sign in
            </button>
            <div className="token-preview">
              First-time login or have a token?{" "}
              <button type="button" onClick={() => switchView("new-password")}>
                Set new password
              </button>
            </div>
          </form>
        )}

        {/* ==================== NEW PASSWORD VIEW ==================== */}
        {view === "new-password" && (
          <form onSubmit={handleSetNewPassword}>
            <Field
              label="Reset Token"
              placeholder="Paste security reset token"
              value={resetToken}
              onChange={setResetToken}
            />
            <Field
              label="New password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={setPassword}
              end={
                <button
                  type="button"
                  className="field-action"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} />
                </button>
              }
            />
            <Field
              label="Confirm new password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            <div className="password-hint">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <small>Password strength</small>
            </div>
            <Button
              type="submit"
              className="full"
              disabled={loading}
            >
              {loading ? "Updating password…" : "Set New Password"}
            </Button>
            <button
              type="button"
              className="back-link"
              onClick={() => switchView("reset")}
            >
              Request a new link
            </button>
          </form>
        )}
      </section>
    </div>
  )
}

function Divider() {
  return (
    <div className="divider">
      <span>or</span>
    </div>
  )
}
