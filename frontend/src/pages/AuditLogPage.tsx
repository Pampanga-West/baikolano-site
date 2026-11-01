import { useMemo, useState } from "react"
import Badge from "../components/Badge"
import Icon from "../components/Icon"
import Stamp from "../components/Stamp"

const auditRows = [
  [
    "2026-10-13 1:08 PM",
    "Michael Carter",
    "USER_RIGHTS",
    "Alex Rivera",
    "RIGHTS_CHANGED",
    "7 permissions granted → 8 permissions granted",
  ],
  [
    "2026-10-13 1:01 PM",
    "user2",
    "CUSTOMER",
    "C-004",
    "DELETED",
    "Status Active → Inactive",
  ],
  [
    "2026-10-13 1:01 PM",
    "user1",
    "EMPLOYEE",
    "E-002",
    "EDITED",
    "Employee master updated",
  ],
  [
    "2026-10-13 12:55 PM",
    "Lisa Park",
    "PAYMENT",
    "OR-1000",
    "CREATED",
    "Payment $100.00 recorded for T-001",
  ],
  [
    "2026-10-13 11:42 AM",
    "user2",
    "PRODUCT",
    "P-004",
    "DELETED",
    "Status Active → Inactive",
  ],
  [
    "2026-10-13 10:16 AM",
    "Michael Carter",
    "USER",
    "jcesperanza@neu.edu.ph",
    "RESTORED",
    "Pending account approved",
  ],
  [
    "2026-10-08 2:00 PM",
    "system",
    "SALE",
    "T-003",
    "CREATED",
    "Sale total $510.00",
  ],
]

export default function AuditLogPage() {
  const [query, setQuery] = useState("")
  const [action, setAction] = useState("ALL")
  const rows = useMemo(
    () =>
      auditRows.filter(
        (row) =>
          (action === "ALL" || row[4] === action) &&
          row.join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [action, query],
  )
  return (
    <div className="page audit-page">
      <div className="page-heading">
        <div>
          <span>System governance / Superadmin</span>
          <div className="page-title">Audit Log</div>
          <p>
            An immutable chronological trail across records and permission
            changes.
          </p>
        </div>
        <div className="live-ledger">
          <i></i>
          <span>
            <b>Live ledger</b>All modules
          </span>
        </div>
      </div>
      <div className="audit-filters">
        <label>
          <span>Date From</span>
          <input type="date" defaultValue="2026-10-01" />
        </label>
        <label>
          <span>Date To</span>
          <input type="date" defaultValue="2026-10-13" />
        </label>
        <label>
          <span>User</span>
          <select>
            <option>All users</option>
            <option>Michael Carter</option>
            <option>Lisa Park</option>
            <option>user1</option>
          </select>
        </label>
        <label>
          <span>Module / Table</span>
          <select>
            <option>All modules</option>
            <option>CUSTOMER</option>
            <option>PRODUCT</option>
            <option>SALE</option>
            <option>USER_RIGHTS</option>
          </select>
        </label>
        <label>
          <span>Action Type</span>
          <select
            value={action}
            onChange={(event) => setAction(event.target.value)}
          >
            <option value="ALL">All actions</option>
            {["CREATED", "EDITED", "DELETED", "RESTORED", "RIGHTS_CHANGED"].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </select>
        </label>
        <label className="audit-search">
          <span>Search trail</span>
          <div>
            <Icon name="search" size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Record, user, detail..."
            />
          </div>
        </label>
      </div>
      <section className="audit-ledger">
        <div className="audit-ledger-head">
          <span>{rows.length} events in current view</span>
          <span>Newest first · timestamps shown in local time</span>
        </div>
        {rows.map((row, index) => (
          <article className="audit-entry" key={`${row[0]}-${row[3]}`}>
            <div className="audit-sequence">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="audit-time">{row[0]}</div>
            <div className="audit-actor">
              <span>{row[1].slice(0, 2).toUpperCase()}</span>
              <b>{row[1]}</b>
            </div>
            <div className="audit-record">
              <small>{row[2]}</small>
              <b>{row[3]}</b>
            </div>
            <div>
              <Badge
                kind={
                  row[4] === "DELETED"
                    ? "blocked"
                    : row[4] === "CREATED" || row[4] === "RESTORED"
                      ? "active"
                      : "pending"
                }
              >
                {row[4]}
              </Badge>
            </div>
            <p>{row[5]}</p>
          </article>
        ))}
      </section>
      <div className="audit-integrity">
        <Icon name="shield" />
        <span>
          <b>Audit integrity enabled</b>Entries are append-only and cannot be
          edited or deleted through this interface.
        </span>
        <Stamp action="CREATED" user="system" date="ledger initialized" />
      </div>
    </div>
  )
}
