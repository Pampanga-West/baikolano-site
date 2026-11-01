import { useMemo, useState } from "react"
import Badge from "../components/Badge"
import Button from "../components/Button"
import EmptyState from "../components/EmptyState"
import EntityControls from "../components/EntityControls"
import ModalShell from "../components/ModalShell"
import Stamp from "../components/Stamp"
import type { Role } from "../lib/types"

const sales = [
  [
    "T-001",
    "2026-10-01",
    "C-001 — Acme Corporation",
    "E-002 — Juan Reyes",
    "$234.50",
    "Active",
    "CREATED",
    "system",
    "2026-10-01 11:00 AM",
  ],
  [
    "T-002",
    "2026-10-05",
    "C-002 — Globex Industries",
    "E-001 — Maria Santos",
    "$140.00",
    "Active",
    "EDITED",
    "user1",
    "2026-10-13 1:01 PM",
  ],
  [
    "T-003",
    "2026-10-08",
    "C-003 — Initech LLC",
    "E-002 — Juan Reyes",
    "$510.00",
    "Active",
    "CREATED",
    "system",
    "2026-10-08 2:00 PM",
  ],
  [
    "T-004",
    "2026-09-20",
    "C-005 — Stark Enterprises",
    "E-003 — Ana Cruz",
    "$0.00",
    "Inactive",
    "DELETED",
    "user2",
    "2026-10-13 1:01 PM",
  ],
]

function SaleForm({ editing, close }: { editing?: boolean, close: () => void }) {
  return (
    <ModalShell
      title={editing ? "Edit Sale" : "New Sale"}
      subtitle="Transaction header · product lines are added after saving."
      close={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={close}>
            {editing ? "Save Changes" : "Save Sale"}
          </Button>
        </>
      }
    >
      <div className="record-form">
        <label>
          <span>Transaction No.</span>
          <input value={editing ? "T-001" : "T-005"} readOnly />
        </label>
        <label>
          <span>Sales Date</span>
          <input type="date" defaultValue="2026-10-13" />
        </label>
        <label className="form-span">
          <span>Customer</span>
          <select>
            <option>C-001 — Acme Corporation</option>
            <option>C-002 — Globex Industries</option>
            <option>C-003 — Initech LLC</option>
          </select>
        </label>
        <label className="form-span">
          <span>Employee Salesperson</span>
          <select>
            <option>E-002 — Juan Reyes</option>
            <option>E-001 — Maria Santos</option>
            <option>E-003 — Ana Cruz</option>
          </select>
        </label>
      </div>
    </ModalShell>
  )
}

function LineForm({ editing, close }: { editing?: boolean, close: () => void }) {
  return (
    <ModalShell
      title={editing ? "Edit Sale Line" : "Add Sale Line"}
      subtitle="Unit price is resolved from price history as of 2026-10-01."
      close={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={close}>{editing ? "Save Line" : "Add Line"}</Button>
        </>
      }
    >
      <div className="record-form">
        <label className="form-span">
          <span>Product</span>
          <select>
            <option>P-001 — Industrial Widget A</option>
            <option>P-002 — Steel Bracket Heavy</option>
          </select>
        </label>
        <label>
          <span>Quantity</span>
          <input type="number" defaultValue={editing ? "10" : "1"} />
        </label>
        <label>
          <span>Unit Price</span>
          <input value="$13.75 · auto-filled" readOnly />
        </label>
      </div>
    </ModalShell>
  )
}

function SaleDetails({ role, close }: { role: Role, close: () => void }) {
  const isAdmin = role !== "User"
  const [lineForm, setLineForm] = useState<"new" | "edit" | null>(null)
  const lines = [
    ["P-001 — Industrial Widget A", "10", "$13.75", "$137.50"],
    ["P-002 — Steel Bracket Heavy", "2", "$48.50", "$97.00"],
  ]
  return (
    <ModalShell
      title="Sale Details — T-001"
      subtitle="2026-10-01 · C-001 — Acme Corporation"
      close={close}
      wide
      footer={
        <div className="detail-total">
          <span>2 active lines</span>
          <b>Total: $234.50</b>
        </div>
      }
    >
      <div className="nested-toolbar">
        {isAdmin && (
          <div className="filter-tabs">
            <button className="selected">Active</button>
            <button>Inactive</button>
            <button>All</button>
          </div>
        )}
        <Button icon="plus" onClick={() => setLineForm("new")}>
          Add Line
        </Button>
      </div>
      <div className="table-scroll">
        <table className="entity-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Line Total</th>
              {isAdmin && (
                <>
                  <th>Status</th>
                  <th>Stamp</th>
                </>
              )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((row) => (
              <tr key={row[0]}>
                <td>
                  <b className="record-name">{row[0]}</b>
                </td>
                <td>{row[1]}</td>
                <td>{row[2]}</td>
                <td>
                  <b className="price-value">{row[3]}</b>
                </td>
                {isAdmin && (
                  <>
                    <td>
                      <Badge kind="active">Active</Badge>
                    </td>
                    <td>
                      <Stamp
                        action="CREATED"
                        user="system"
                        date="2026-10-01 11:02 AM"
                      />
                    </td>
                  </>
                )}
                <td>
                  <div className="row-actions">
                    <button onClick={() => setLineForm("edit")}>Edit</button>
                    <button className="danger-link">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lineForm && (
        <LineForm
          editing={lineForm === "edit"}
          close={() => setLineForm(null)}
        />
      )}
    </ModalShell>
  )
}

function Payments({ role, close }: { role: Role, close: () => void }) {
  const isAdmin = role !== "User"
  const [tab, setTab] = useState<"payments" | "balances">("payments")
  return (
    <ModalShell
      title="Payments & Balance — T-001"
      subtitle="C-001 — Acme Corporation · Net 30"
      close={close}
      wide
      footer={
        <Button variant="secondary" onClick={close}>
          Close
        </Button>
      }
    >
      <div className="module-subnav compact-subnav">
        <button
          className={tab === "payments" ? "selected" : ""}
          onClick={() => setTab("payments")}
        >
          Payment History
        </button>
        <button
          className={tab === "balances" ? "selected" : ""}
          onClick={() => setTab("balances")}
        >
          Customer Balance Summary
        </button>
      </div>
      {tab === "payments" ? (
        <>
          <div className="balance-strip">
            <div>
              <span>Sale Total</span>
              <b>$234.50</b>
            </div>
            <div>
              <span>Total Paid</span>
              <b className="paid">$100.00</b>
            </div>
            <div>
              <span>Remaining Balance</span>
              <b className="owing">$134.50</b>
            </div>
          </div>
          <div className="payments-layout">
            <div className="payment-table">
              <div className="section-kicker">Receipt history</div>
              <div className="table-scroll">
                <table className="entity-table">
                  <thead>
                    <tr>
                      <th>OR No</th>
                      <th>Pay Date</th>
                      <th>Amount</th>
                      {isAdmin && (
                        <>
                          <th>Status</th>
                          <th>Stamp</th>
                        </>
                      )}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="code-cell">OR-1000</td>
                      <td>2026-10-08</td>
                      <td>
                        <b className="price-value">$100.00</b>
                      </td>
                      {isAdmin && (
                        <>
                          <td>
                            <Badge kind="active">Active</Badge>
                          </td>
                          <td>
                            <Stamp
                              action="CREATED"
                              user="system"
                              date="2026-10-08 9:15 AM"
                            />
                          </td>
                        </>
                      )}
                      <td>
                        <div className="row-actions">
                          <button>Edit</button>
                          <button className="danger-link">Delete</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <aside className="payment-form">
              <div className="section-kicker">Record payment</div>
              <label>
                <span>Official Receipt No.</span>
                <input defaultValue="OR-1001" />
              </label>
              <label>
                <span>Payment Date</span>
                <input type="date" defaultValue="2026-10-13" />
              </label>
              <label>
                <span>Amount</span>
                <div className="money-input">
                  <span>$</span>
                  <input defaultValue="134.50" />
                </div>
              </label>
              <Button className="full">Save Payment</Button>
            </aside>
          </div>
        </>
      ) : (
        <div className="balance-summary">
          <div className="section-kicker">Accounts receivable by customer</div>
          <table className="entity-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Total Billed</th>
                <th>Total Paid</th>
                <th>Open Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b className="record-name">C-001 — Acme Corporation</b>
                </td>
                <td>$234.50</td>
                <td className="paid-text">$100.00</td>
                <td>
                  <b className="owing-text">$134.50</b>
                </td>
              </tr>
              <tr>
                <td>
                  <b className="record-name">C-002 — Globex Industries</b>
                </td>
                <td>$140.00</td>
                <td className="paid-text">$140.00</td>
                <td>$0.00</td>
              </tr>
              <tr>
                <td>
                  <b className="record-name">C-003 — Initech LLC</b>
                </td>
                <td>$510.00</td>
                <td className="paid-text">$300.00</td>
                <td>
                  <b className="owing-text">$210.00</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </ModalShell>
  )
}

export default function SalesPage({ role }: { role: Role }) {
  const isAdmin = role !== "User"
  const [filter, setFilter] = useState("active")
  const [search, setSearch] = useState("")
  const [saleForm, setSaleForm] = useState<"new" | "edit" | null>(null)
  const [details, setDetails] = useState(false)
  const [payments, setPayments] = useState(false)
  const rows = useMemo(
    () =>
      sales.filter((row) => {
        if (!isAdmin && row[5] === "Inactive") return false
        if (isAdmin && filter !== "all" && row[5].toLowerCase() !== filter)
          return false
        return row.join(" ").toLowerCase().includes(search.toLowerCase())
      }),
    [filter, isAdmin, search],
  )
  return (
    <div className="page module-page">
      <div className="page-heading">
        <div>
          <span>Transactions / Sales</span>
          <div className="page-title">Sales Management</div>
          <p>
            Master-detail transactions with effective pricing and receipt
            balances.
          </p>
        </div>
        <div className="module-count">
          <b>$884.50</b>
          <span>active sales value</span>
        </div>
      </div>
      <EntityControls
        isAdmin={isAdmin}
        counts={[3, 1, 4]}
        activeFilter={filter}
        onFilter={setFilter}
        search={search}
        onSearch={setSearch}
        placeholder="Search sales..."
        addLabel="New Sale"
        onAdd={() => setSaleForm("new")}
      />
      <section className="entity-table-shell">
        {rows.length ? (
          <div className="table-scroll">
            <table className="entity-table">
              <thead>
                <tr>
                  <th>Trans No</th>
                  <th>Sales Date</th>
                  <th>Customer</th>
                  <th>Employee</th>
                  <th>Total</th>
                  {isAdmin && (
                    <>
                      <th>Status</th>
                      <th>Stamp</th>
                    </>
                  )}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    className={row[5] === "Inactive" ? "inactive-row" : ""}
                    key={row[0]}
                  >
                    <td className="code-cell">{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>
                      <b className="record-name">{row[2]}</b>
                    </td>
                    <td>{row[3]}</td>
                    <td>
                      <b className="price-value">{row[4]}</b>
                    </td>
                    {isAdmin && (
                      <>
                        <td>
                          <Badge kind={row[5]}>{row[5]}</Badge>
                        </td>
                        <td>
                          <Stamp action={row[6]} user={row[7]} date={row[8]} />
                        </td>
                      </>
                    )}
                    <td>
                      <div className="row-actions">
                        {row[5] === "Inactive" ? (
                          <button className="success-link">Restore</button>
                        ) : (
                          <>
                            <button onClick={() => setDetails(true)}>
                              Details
                            </button>
                            <button onClick={() => setPayments(true)}>
                              Payments
                            </button>
                            <button onClick={() => setSaleForm("edit")}>
                              Edit
                            </button>
                            <button className="danger-link">Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState query={search} onClear={() => setSearch("")} />
        )}
      </section>
      {saleForm && (
        <SaleForm
          editing={saleForm === "edit"}
          close={() => setSaleForm(null)}
        />
      )}
      {details && <SaleDetails role={role} close={() => setDetails(false)} />}
      {payments && <Payments role={role} close={() => setPayments(false)} />}
    </div>
  )
}
