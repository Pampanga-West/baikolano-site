import Button from "../components/Button"
import Logo from "../components/Logo"
import type { AuthView } from "../lib/types"

export default function LandingPage({
  openAuth,
}: {
  openAuth: (view: AuthView) => void
}) {
  return (
    <main className="landing simple-landing">
      <nav className="topbar">
        <Logo />
      </nav>
      <section className="simple-hero">
        <div className="simple-hero-copy">
          <div className="display">
            Run your entire business with confidence.
          </div>
          <p>
            One focused workspace for customers, products, people, sales, and
            the decisions that connect them.
          </p>
          <div className="hero-actions">
            <Button onClick={() => openAuth("login")}>Sign In</Button>
            <Button variant="secondary" onClick={() => openAuth("register")}>
              Register
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
