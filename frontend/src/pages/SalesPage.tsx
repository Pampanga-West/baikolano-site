import { useEffect, useMemo, useState } from "react"
import {
  fetchTableRowsFromSupabase,
  formatMoney,
  parseStamp,
} from "../backend/supabaseClient"
import Badge from "../components/Badge"
import Button from "../components/Button"
import EmptyState from "../components/EmptyState"
import EntityControls from "../components/EntityControls"
import ModalShell from "../components/ModalShell"
import Stamp from "../components/Stamp"
import type { Role } from "../lib/types"

const fallbackSales = [
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

type SaleLineItem = {
  transno: string
  product: string
  qty: string
  unitPrice: string
  lineTotal: string
  lineTotalNum: number
  status: string
  action: string
  user: string
  date: string
}

type PaymentRecord = {
  orno: string
  transno: string
  paydate: string
  amount: string
  amountNum: number
  status: string
  action: string
  user: string
  date: string
}

const fallbackSaleLines: SaleLineItem[] = [
  {
    transno: "T-001",
    product: "P-001 — Industrial Widget A",
    qty: "10",
    unitPrice: "$13.75",
    lineTotal: "$137.50",
    lineTotalNum: 137.5,
    status: "Active",
    action: "CREATED",
    user: "system",
    date: "2026-10-01 11:02 AM",
  },
  {
    transno: "T-001",
    product: "P-002 — Steel Bracket Heavy",
    qty: "2",
    unitPrice: "$48.50",
    lineTotal: "$97.00",
    lineTotalNum: 97,
    status: "Active",
    action: "CREATED",
    user: "system",
    date: "2026-10-01 11:02 AM",
  },
]

const fallbackPayments: PaymentRecord[] = [
  {
    orno: "OR-1000",
    transno: "T-001",
    paydate: "2026-10-08",
    amount: "$100.00",
    amountNum: 100,
    status: "Active",
    action: "CREATED",
    user: "system",
    date: "2026-10-08 9:15 AM",
  },
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

function SaleDetails({
  role,
  sale,
  lines,
  close,
}: {
  role: Role
  sale: string[]
  lines: SaleLineItem[]
  close: () => void
}) {
  const isAdmin = role !== "User"
  const [lineForm, setLineForm] = useState<"new" | "edit" | null>(null)
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active")

  const visibleLines = lines.filter((line) => {
    if (!isAdmin && line.status === "Inactive") return false
    if (isAdmin && statusFilter !== "all" && line.status.toLowerCase() !== statusFilter)
      return false
    return true
  })

  const activeTotal = lines
    .filter((l) => l.status === "Active")
    .reduce((sum, l) => sum + l.lineTotalNum, 0)

  return (
    <ModalShell
      title={`Sale Details — ${sale[0]}`}
      subtitle={`${sale[1]} · ${sale[2]}`}
      close={close}
      wide
      footer={
        <div className="detail-total">
          <span>
            {lines.filter((l) => l.status === "Active").length} active lines
          </span>
          <b>Total: {formatMoney(activeTotal || Number(sale[4]?.replace(/[^0-9.-]+/g, "")) || 0)}</b>
        </div>
      }
    >
      {isAdmin && (
        <div className="nested-toolbar">
          <div className="filter-tabs">
            <button
              className={statusFilter === "active" ? "selected" : ""}
              onClick={() => setStatusFilter("active")}
            >
              Active
            </button>
            <button
              className={statusFilter === "inactive" ? "selected" : ""}
              onClick={() => setStatusFilter("inactive")}
            >
              Inactive
            </button>
            <button
              className={statusFilter === "all" ? "selected" : ""}
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>
          </div>
          <Button icon="plus" onClick={() => setLineForm("new")}>
            Add Line
          </Button>
        </div>
      )}
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
                  <th>Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleLines.length ? (
              visibleLines.map((row, idx) => (
                <tr
                  key={`${row.product}-${idx}`}
                  className={row.status === "Inactive" ? "inactive-row" : ""}
                >
                  <td>
                    <b className="record-name">{row.product}</b>
                  </td>
                  <td>{row.qty}</td>
                  <td>{row.unitPrice}</td>
                  <td>
                    <b className="price-value">{row.lineTotal}</b>
                  </td>
                  {isAdmin && (
                    <>
                      <td>
                        <Badge kind={row.status.toLowerCase()}>
                          {row.status}
                        </Badge>
                      </td>
                      <td>
                        <Stamp
                          action={row.action}
                          user={row.user}
                          date={row.date}
                        />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => setLineForm("edit")}>
                            Edit
                          </button>
                          <button className="danger-link">Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={isAdmin ? 7 : 4}
                  style={{
                    textAlign: "center",
                    color: "var(--muted)",
                    padding: "20px",
                  }}
                >
                  No line items found for {sale[0]}.
                </td>
              </tr>
            )}
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

function Payments({
  role,
  sale,
  receipts,
  customerBalances,
  close,
}: {
  role: Role
  sale: string[]
  receipts: PaymentRecord[]
  customerBalances: {
    customer: string
    billed: number
    paid: number
    open: number
  }[]
  close: () => void
}) {
  const isAdmin = role !== "User"
  const [tab, setTab] = useState<"payments" | "balances">("payments")
  const visibleReceipts = receipts.filter(
    (r) => isAdmin || r.status === "Active"
  )
  const saleTotalNum =
    Number(sale[4]?.replace(/[^0-9.-]+/g, "")) || 0
  const totalPaidNum = receipts
    .filter((r) => r.status === "Active")
    .reduce((sum, r) => sum + r.amountNum, 0)
  const remainingNum = Math.max(0, saleTotalNum - totalPaidNum)

  return (
    <ModalShell
      title={`Payments & Balance — ${sale[0]}`}
      subtitle={`${sale[2]} · ${sale[1]}`}
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
              <b>{formatMoney(saleTotalNum)}</b>
            </div>
            <div>
              <span>Total Paid</span>
              <b className="paid">{formatMoney(totalPaidNum)}</b>
            </div>
            <div>
              <span>Remaining Balance</span>
              <b className="owing">{formatMoney(remainingNum)}</b>
            </div>
          </div>
          <div
            className="payments-layout"
            style={!isAdmin ? { gridTemplateColumns: "1fr" } : undefined}
          >
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
                          <th>Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleReceipts.length ? (
                      visibleReceipts.map((r) => (
                        <tr
                          key={r.orno}
                          className={
                            r.status === "Inactive" ? "inactive-row" : ""
                          }
                        >
                          <td className="code-cell">{r.orno}</td>
                          <td>{r.paydate}</td>
                          <td>
                            <b className="price-value">{r.amount}</b>
                          </td>
                          {isAdmin && (
                            <>
                              <td>
                                <Badge kind={r.status.toLowerCase()}>
                                  {r.status}
                                </Badge>
                              </td>
                              <td>
                                <Stamp
                                  action={r.action}
                                  user={r.user}
                                  date={r.date}
                                />
                              </td>
                              <td>
                                <div className="row-actions">
                                  <button>Edit</button>
                                  <button className="danger-link">
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={isAdmin ? 6 : 3}
                          style={{
                            textAlign: "center",
                            color: "var(--muted)",
                            padding: "20px",
                          }}
                        >
                          No payments recorded for {sale[0]}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {isAdmin && (
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
                    <input defaultValue={remainingNum.toFixed(2)} />
                  </div>
                </label>
                <Button className="full">Save Payment</Button>
              </aside>
            )}
          </div>
        </>
      ) : (
        <div className="balance-summary">
          <div className="section-kicker">Accounts receivable by customer</div>
          <div className="table-scroll">
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
                {customerBalances.map((cb) => (
                  <tr key={cb.customer}>
                    <td>
                      <b className="record-name">{cb.customer}</b>
                    </td>
                    <td>{formatMoney(cb.billed)}</td>
                    <td className="paid-text">{formatMoney(cb.paid)}</td>
                    <td>
                      {cb.open > 0 ? (
                        <b className="owing-text">{formatMoney(cb.open)}</b>
                      ) : (
                        formatMoney(0)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

export default function SalesPage({ role }: { role: Role }) {
  const isAdmin = role !== "User"
  const [sales, setSales] = useState<string[][]>(fallbackSales)
  const [saleLines, setSaleLines] =
    useState<SaleLineItem[]>(fallbackSaleLines)
  const [paymentRecords, setPaymentRecords] =
    useState<PaymentRecord[]>(fallbackPayments)
  const [filter, setFilter] = useState("active")
  const [search, setSearch] = useState("")
  const [saleForm, setSaleForm] = useState<"new" | "edit" | null>(null)
  const [detailsSale, setDetailsSale] = useState<string[] | null>(null)
  const [paymentsSale, setPaymentsSale] = useState<string[] | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetchTableRowsFromSupabase("sales", "transno.asc"),
      fetchTableRowsFromSupabase("salesdetail", "transno.asc"),
      fetchTableRowsFromSupabase("payment", "orno.asc"),
      fetchTableRowsFromSupabase("customer", "custno.asc"),
      fetchTableRowsFromSupabase("employee", "empno.asc"),
      fetchTableRowsFromSupabase("product", "prodcode.asc"),
      fetchTableRowsFromSupabase("pricehist", "effdate.desc"),
    ])
      .then(
        ([
          salesRows,
          detailRows,
          payRows,
          custRows,
          empRows,
          prodRows,
          priceRows,
        ]) => {
          if (!active || !salesRows.length) return

          const custMap = new Map<string, string>()
          for (const c of custRows) {
            custMap.set(
              String(c.custno ?? ""),
              `${c.custno} — ${c.custname ?? ""}`
            )
          }

          const empMap = new Map<string, string>()
          for (const e of empRows) {
            empMap.set(
              String(e.empno ?? ""),
              `${e.empno} — ${e.firstname ?? ""} ${e.lastname ?? ""}`.trim()
            )
          }

          const prodMap = new Map<string, string>()
          for (const p of prodRows) {
            prodMap.set(
              String(p.prodcode ?? ""),
              `${p.prodcode} — ${p.description ?? ""}`
            )
          }

          const priceByProd = new Map<
            string,
            { effdate: string; price: number }[]
          >()
          for (const pr of priceRows) {
            if (pr.is_deleted) continue
            const code = String(pr.prodcode ?? "")
            const list = priceByProd.get(code) ?? []
            list.push({
              effdate: String(pr.effdate ?? ""),
              price: Number(pr.unitprice) || 0,
            })
            priceByProd.set(code, list)
          }

          const saleDateMap = new Map<string, string>()
          for (const s of salesRows) {
            saleDateMap.set(
              String(s.transno ?? ""),
              String(s.salesdate ?? "")
            )
          }

          const resolveUnitPrice = (prodcode: string, salesdate: string) => {
            const list = priceByProd.get(prodcode) ?? []
            if (!list.length) return 0
            const match = list.find((p) => !salesdate || p.effdate <= salesdate)
            return match ? match.price : list[0].price
          }

          const totalByTrans = new Map<string, number>()
          const mappedLines: SaleLineItem[] = detailRows.map((d) => {
            const isDeleted = Boolean(d.is_deleted)
            const [action, user, date] = parseStamp(d.stamp, isDeleted)
            const tNo = String(d.transno ?? "")
            const pCode = String(d.prodcode ?? "")
            const qty = Number(d.quantity) || 0
            const uPrice = resolveUnitPrice(pCode, saleDateMap.get(tNo) ?? "")
            const lineTotalNum = qty * uPrice
            if (!isDeleted) {
              totalByTrans.set(tNo, (totalByTrans.get(tNo) ?? 0) + lineTotalNum)
            }
            return {
              transno: tNo,
              product: prodMap.get(pCode) || pCode,
              qty: String(qty),
              unitPrice: formatMoney(uPrice),
              lineTotal: formatMoney(lineTotalNum),
              lineTotalNum,
              status: isDeleted ? "Inactive" : "Active",
              action,
              user,
              date,
            }
          })
          setSaleLines(mappedLines)

          const mappedPayments: PaymentRecord[] = payRows.map((p) => {
            const isDeleted = Boolean(p.is_deleted)
            const [action, user, date] = parseStamp(p.stamp, isDeleted)
            const amt = Number(p.amount) || 0
            return {
              orno: String(p.orno ?? ""),
              transno: String(p.transno ?? ""),
              paydate: String(p.paydate ?? ""),
              amount: formatMoney(amt),
              amountNum: amt,
              status: isDeleted ? "Inactive" : "Active",
              action,
              user,
              date,
            }
          })
          setPaymentRecords(mappedPayments)

          const mappedSales = salesRows.map((s) => {
            const isDeleted = Boolean(s.is_deleted)
            const [action, user, date] = parseStamp(s.stamp, isDeleted)
            const tNo = String(s.transno ?? "")
            const cNo = String(s.custno ?? "")
            const eNo = String(s.empno ?? "")
            return [
              tNo,
              String(s.salesdate ?? "—"),
              custMap.get(cNo) || cNo,
              empMap.get(eNo) || eNo,
              formatMoney(totalByTrans.get(tNo) ?? 0),
              isDeleted ? "Inactive" : "Active",
              action,
              user,
              date,
            ]
          })
          setSales(mappedSales)
        }
      )
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const counts = useMemo<[number, number, number]>(() => {
    const activeCount = sales.filter((r) => r[5] === "Active").length
    const inactiveCount = sales.filter((r) => r[5] === "Inactive").length
    return [activeCount, inactiveCount, sales.length]
  }, [sales])

  const activeSalesSum = useMemo(() => {
    return sales
      .filter((r) => r[5] === "Active")
      .reduce(
        (sum, r) => sum + (Number(r[4]?.replace(/[^0-9.-]+/g, "")) || 0),
        0
      )
  }, [sales])

  const customerBalances = useMemo(() => {
    const map = new Map<string, { billed: number; paid: number }>()
    const paidByTrans = new Map<string, number>()
    for (const p of paymentRecords) {
      if (p.status !== "Active") continue
      paidByTrans.set(
        p.transno,
        (paidByTrans.get(p.transno) ?? 0) + p.amountNum
      )
    }
    for (const s of sales) {
      if (s[5] !== "Active") continue
      const cust = s[2]
      const billed = Number(s[4]?.replace(/[^0-9.-]+/g, "")) || 0
      const paid = paidByTrans.get(s[0]) ?? 0
      const prev = map.get(cust) ?? { billed: 0, paid: 0 }
      map.set(cust, {
        billed: prev.billed + billed,
        paid: prev.paid + paid,
      })
    }
    return Array.from(map.entries()).map(([customer, vals]) => ({
      customer,
      billed: vals.billed,
      paid: vals.paid,
      open: Math.max(0, vals.billed - vals.paid),
    }))
  }, [sales, paymentRecords])

  const rows = useMemo(
    () =>
      sales.filter((row) => {
        if (!isAdmin && row[5] === "Inactive") return false
        if (isAdmin && filter !== "all" && row[5].toLowerCase() !== filter)
          return false
        const q = search.trim().toLowerCase()
        if (!q) return true
        return row.join(" ").toLowerCase().includes(q)
      }),
    [sales, filter, isAdmin, search],
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
          <b>{formatMoney(activeSalesSum)}</b>
          <span>active sales value</span>
        </div>
      </div>
      <EntityControls
        isAdmin={isAdmin}
        counts={counts}
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
                          isAdmin && (
                            <button className="success-link">Restore</button>
                          )
                        ) : (
                          <>
                            <button onClick={() => setDetailsSale(row)}>
                              Details
                            </button>
                            <button onClick={() => setPaymentsSale(row)}>
                              Payments
                            </button>
                            {isAdmin && (
                              <>
                                <button onClick={() => setSaleForm("edit")}>
                                  Edit
                                </button>
                                <button className="danger-link">Delete</button>
                              </>
                            )}
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
      {detailsSale && (
        <SaleDetails
          role={role}
          sale={detailsSale}
          lines={saleLines.filter((l) => l.transno === detailsSale[0])}
          close={() => setDetailsSale(null)}
        />
      )}
      {paymentsSale && (
        <Payments
          role={role}
          sale={paymentsSale}
          receipts={paymentRecords.filter((p) => p.transno === paymentsSale[0])}
          customerBalances={customerBalances}
          close={() => setPaymentsSale(null)}
        />
      )}
    </div>
  )
}
