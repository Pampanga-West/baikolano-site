import { useEffect, useState } from "react"
import { rightsApi } from "../lib/api"
import { rightsGroups } from "../lib/data"
import type { ManagedUser } from "../lib/types"
import Button from "./Button"
import Icon from "./Icon"

export default function RightsModal({
  user,
  close,
}: {
  user: ManagedUser | null
  close: () => void
}) {
  const allRights = rightsGroups.flatMap((group) => group.rights)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    setError(null)

    rightsApi
      .getUserRights(user.id)
      .then((rights) => {
        if (active) {
          setSelected(new Set(rights))
        }
      })
      .catch((err: any) => {
        if (active) {
          setError(err.message || "Failed to load permissions from backend.")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  const toggle = (right: string) =>
    setSelected((current) => {
      const next = new Set(current)
      next.has(right) ? next.delete(right) : next.add(right)
      return next
    })

  const setGroup = (rights: string[], checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      rights.forEach((right) =>
        checked ? next.add(right) : next.delete(right)
      )
      return next
    })

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await rightsApi.assignRights(user.id, Array.from(selected))
      setSuccess("Permissions successfully saved.")
      setTimeout(() => {
        close()
      }, 700)
    } catch (err: any) {
      setError(err.message || "Failed to save permissions.")
    } finally {
      setSaving(false)
    }
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "US"
  const displayName = user?.name || user?.email || "User"

  return (
    <div className="modal-backdrop">
      <section
        className="rights-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Rights for ${displayName}`}
      >
        <div className="rights-head">
          <div>
            <span className="avatar sage">{initials}</span>
            <div>
              <div className="modal-title">Rights — {displayName}</div>
              <p>Choose the actions this account can perform in each module.</p>
            </div>
          </div>
          <button className="icon-button" onClick={close}>
            <Icon name="x" />
          </button>
        </div>

        {error && (
          <div className="error-banner" style={{ margin: "16px 24px 0" }}>
            <Icon name="lock" />
            <span>
              <b>Error</b>
              {error}
            </span>
          </div>
        )}

        {success && (
          <div className="info-banner" style={{ margin: "16px 24px 0" }}>
            <Icon name="check" />
            <span>
              <b>Success</b>
              {success}
            </span>
          </div>
        )}

        <div className="rights-summary">
          <div>
            <Icon name="shield" />
            <span>
              <b>
                {selected.size} of {allRights.length} rights selected
              </b>
              <small>All modifications are recorded in the audit log.</small>
            </span>
          </div>
          <div className="summary-bar">
            <i
              style={{ width: `${(selected.size / allRights.length) * 100}%` }}
            ></i>
          </div>
        </div>

        {loading ? (
          <div className="module-loading" style={{ padding: "40px 0" }}>
            <span></span>
            Loading user permissions…
          </div>
        ) : (
          <div className="rights-scroll">
            {rightsGroups.map((group, index) => (
              <section className="rights-group" key={group.title}>
                <div className="rights-group-head">
                  <div>
                    <span>{index + 1}</span>
                    <b>{group.title}</b>
                    <small>{group.count} rights</small>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setGroup(group.rights, true)}
                    >
                      All
                    </button>
                    <i></i>
                    <button
                      type="button"
                      onClick={() => setGroup(group.rights, false)}
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="rights-grid">
                  {group.rights.map((right) => (
                    <label className="right-check" key={right}>
                      <input
                        type="checkbox"
                        checked={selected.has(right)}
                        onChange={() => toggle(right)}
                      />
                      <span>
                        <Icon name="check" size={13} />
                      </span>
                      {right}
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="rights-footer">
          <span>{selected.size} permissions will be saved</span>
          <div>
            <Button variant="secondary" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving…" : "Save Rights"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
