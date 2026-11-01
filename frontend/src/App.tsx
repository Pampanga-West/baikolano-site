import { useEffect, useState } from "react"
import AuthModal from "./components/AuthModal"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import WorkspaceLayout from "./layouts/WorkspaceLayout"
import type { AuthView } from "./lib/types"
import LandingPage from "./pages/LandingPage"

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth()
  const [auth, setAuth] = useState<AuthView>(null)
  const [initialResetToken, setInitialResetToken] = useState<string>("")

  // Detect ?token=... or ?resetToken=... query params on page load for S1-DEV-04 deep-linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token") || params.get("resetToken")
    if (token) {
      setInitialResetToken(token)
      setAuth("new-password")
    }
  }, [])

  if (isLoading) {
    return (
      <div className="module-loading" style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <div>
          <span></span>
          Connecting to HOPE ERP session…
        </div>
      </div>
    )
  }

  return (
    <>
      {isAuthenticated ? (
        <WorkspaceLayout />
      ) : (
        <LandingPage openAuth={setAuth} />
      )}

      {auth && (
        <AuthModal
          view={auth}
          setView={setAuth}
          initialToken={initialResetToken}
          close={() => setAuth(null)}
          onSuccess={() => {
            setAuth(null)
          }}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
