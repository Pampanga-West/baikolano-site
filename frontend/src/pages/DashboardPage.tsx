import Button from "../components/Button"
import Icon from "../components/Icon"
import { useAuth } from "../contexts/AuthContext"
import { modules, roleData, stats } from "../lib/data"
import type { AppView, IconName, Role } from "../lib/types"

export default function DashboardPage({
  role,
  goUsers,
  goToModule,
}: {
  role: Role
  goUsers: () => void
  goToModule?: (module: AppView) => void
}) {
  const { user } = useAuth()
  const person = roleData[role] || roleData.User
  const userGreeting = user?.email || person.name
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span>Overview</span>
          <div className="page-title">Dashboard</div>
          <p>Here’s what’s happening across Hope, Inc. today.</p>
        </div>
        <div className="date-chip">Monday, May 26</div>
      </div>
      <div className="welcome">
        <span className="welcome-icon">
          <Icon name="sparkle" />
        </span>
        <div>
          <b>Welcome back, {userGreeting}!</b>
          <p>{person.banner}</p>
        </div>
      </div>
      <div className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className="stat-top">
              <span className={`module-icon icon-${stat.accent}`}>
                <Icon name={stat.icon} />
              </span>
              <span className={stat.change.includes("+") ? "positive" : ""}>
                {stat.change}
              </span>
            </div>
            <b>{stat.value}</b>
            <p>{stat.label}</p>
            <div className={`sparkline spark-${stat.accent}`}>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </div>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <b>Quick actions</b>
              <p>Jump back into your daily work.</p>
            </div>
            <button>Customize</button>
          </div>
          <div className="quick-grid">
            {modules.map((item) => (
              <button
                className="quick-action"
                onClick={() => goToModule?.(item.target)}
                key={item.name}
              >
                <span className={`module-icon icon-${item.accent}`}>
                  <Icon name={item.icon} />
                </span>
                <span>
                  <b>{item.name}</b>
                  <small>{`Manage ${item.name.toLowerCase()}`}</small>
                </span>
                <Icon name="chevron" size={16} />
              </button>
            ))}
          </div>
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <b>Recent activity</b>
              <p>Latest updates from your team.</p>
            </div>
            <button>View all</button>
          </div>
          {[
            ["New customer added", "Acme Trading Co.", "10m", "users"],
            ["Order #1042 confirmed", "By Lisa Park", "32m", "check"],
            ["Product stock updated", "12 inventory changes", "1h", "package"],
          ].map(([title, desc, time, icon]) => (
            <div className="activity" key={title}>
              <span>
                <Icon name={icon as IconName} size={16} />
              </span>
              <div>
                <b>{title}</b>
                <small>{desc}</small>
              </div>
              <time>{time}</time>
            </div>
          ))}
          {role !== "User" && (
            <Button
              variant="secondary"
              className="full manage-btn"
              onClick={goUsers}
            >
              Manage users
            </Button>
          )}
        </section>
      </div>
    </div>
  )
}
