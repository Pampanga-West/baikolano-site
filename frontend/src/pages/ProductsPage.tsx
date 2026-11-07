import { useEffect, useMemo, useState } from "react"
import {
  fetchTableRowsFromSupabase,
  formatMoney,
  parseStamp,
} from "../backend/supabaseClient"
import Badge from "../components/Badge"
import BlockedDeleteModal from "../components/BlockedDeleteModal"
import Button from "../components/Button"
import ConfirmDeleteModal from "../components/ConfirmDeleteModal"
import EmptyState from "../components/EmptyState"
import EntityControls from "../components/EntityControls"
import ModalShell from "../components/ModalShell"
import Stamp from "../components/Stamp"
import type { Role } from "../lib/types"

const fallbackProducts = [
  [
    "P-001",
    "Industrial Widget A",
    "pcs",
    "$13.75",
    "Active",
    "CREATED",
    "system",
    "2026-10-01 9:00 AM",
  ],
  [
    "P-002",
    "Steel Bracket Heavy",
    "pcs",
    "$48.50",
    "Active",
    "CREATED",
    "system",
    "2026-10-02 10:00 AM",
  ],
  [
    "P-003",
    "Lubricant Oil 5L",
    "can",
    "$28.00",
    "Active",
    "EDITED",
    "user1",
    "2026-10-13 1:01 PM",
  ],
  [
    "P-004",
    "Safety Gloves XL",
    "pair",
    "—",
    "Inactive",
    "DELETED",
    "user2",
    "2026-10-13 1:01 PM",
  ],
  [
    "P-005",
    "Copper Wire 2.5mm",
    "meter",
    "$2.35",
    "Active",
    "CREATED",
    "system",
    "2026-10-05 3:30 PM",
  ],
]

type PriceHistoryEntry = {
  prodcode: string
  effdate: string
  price: string
  status: string
  action: string
  user: string
  date: string
}

const fallbackPriceHistory: PriceHistoryEntry[] = [
  {
    prodcode: "P-001",
    effdate: "2026-01-01",
    price: "$13.75",
    status: "Active",
    action: "CREATED",
    user: "system",
    date: "2026-01-01 9:00 AM",
  },
  {
    prodcode: "P-002",
    effdate: "2026-01-15",
    price: "$48.50",
    status: "Active",
    action: "CREATED",
    user: "system",
    date: "2026-01-15 10:00 AM",
  },
  {
    prodcode: "P-003",
    effdate: "2026-02-01",
    price: "$28.00",
    status: "Active",
    action: "CREATED",
    user: "system",
    date: "2026-02-01 10:00 AM",
  },
  {
    prodcode: "P-005",
    effdate: "2026-01-20",
    price: "$2.35",
    status: "Active",
    action: "CREATED",
    user: "system",
    date: "2026-01-20 3:30 PM",
  },
]

function ProductForm({
  product,
  close,
}: {
  product?: string[]
  close: () => void
}) {
  return (
    <ModalShell
      title={product ? "Edit Product" : "Add Product"}
      subtitle="Product identity is separate from its effective-dated price history."
      close={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={close}>
            {product ? "Save Changes" : "Add Product"}
          </Button>
        </>
      }
    >
      <div className="record-form">
        <label>
          <span>Product Code</span>
          <input defaultValue={product?.[0] ?? "P-006"} />
        </label>
        <label>
          <span>Unit</span>
          <select defaultValue={product?.[2] ?? "pcs"}>
            {["pcs", "can", "pair", "meter"].map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </label>
        <label className="form-span">
          <span>Description</span>
          <input
            defaultValue={product?.[1]}
            placeholder="Product description"
          />
        </label>
      </div>
    </ModalShell>
  )
}

function PriceForm({
  editing,
  close,
}: {
  editing?: boolean
  close: () => void
}) {
  return (
    <ModalShell
      title={editing ? "Edit Price" : "Add Price"}
      subtitle="The latest active price on or before a transaction date is applied."
      close={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={close}>
            {editing ? "Save Price" : "Add Price"}
          </Button>
        </>
      }
    >
      <div className="record-form">
        <label>
          <span>Effective Date</span>
          <input type="date" defaultValue="2026-02-01" />
        </label>
        <label>
          <span>Unit Price</span>
          <div className="money-input">
            <span>$</span>
            <input type="number" defaultValue="28.00" />
          </div>
        </label>
      </div>
    </ModalShell>
  )
}

function PriceHistory({
  role,
  product,
  entries,
  close,
}: {
  role: Role
  product: string[]
  entries: PriceHistoryEntry[]
  close: () => void
}) {
  const isAdmin = role !== "User"
  const [priceForm, setPriceForm] = useState<"new" | "edit" | null>(null)
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active")

  const visibleEntries = entries.filter((entry) => {
    if (!isAdmin && entry.status === "Inactive") return false
    if (isAdmin && statusFilter !== "all" && entry.status.toLowerCase() !== statusFilter)
      return false
    return true
  })

  return (
    <ModalShell
      title={`Price History — ${product[0]}`}
      subtitle={`${product[1]} · Unit: ${product[2]}`}
      close={close}
      wide
      footer={
        <Button variant="secondary" onClick={close}>
          Close
        </Button>
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
          <Button icon="plus" onClick={() => setPriceForm("new")}>
            Add Price
          </Button>
        </div>
      )}
      <div className="table-scroll">
        <table className="entity-table">
          <thead>
            <tr>
              <th>Effective Date</th>
              <th>Unit Price</th>
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
            {visibleEntries.length ? (
              visibleEntries.map((entry) => (
                <tr
                  key={`${entry.prodcode}-${entry.effdate}`}
                  className={entry.status === "Inactive" ? "inactive-row" : ""}
                >
                  <td className="code-cell">{entry.effdate}</td>
                  <td>
                    <b className="price-value">{entry.price}</b>
                  </td>
                  {isAdmin && (
                    <>
                      <td>
                        <Badge kind={entry.status.toLowerCase()}>
                          {entry.status}
                        </Badge>
                      </td>
                      <td>
                        <Stamp
                          action={entry.action}
                          user={entry.user}
                          date={entry.date}
                        />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => setPriceForm("edit")}>
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
                  colSpan={isAdmin ? 5 : 2}
                  style={{ textAlign: "center", color: "var(--muted)", padding: "20px" }}
                >
                  No price history entries found for {product[0]}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {priceForm && (
        <PriceForm
          editing={priceForm === "edit"}
          close={() => setPriceForm(null)}
        />
      )}
    </ModalShell>
  )
}

export default function ProductsPage({ role }: { role: Role }) {
  const isAdmin = role !== "User"
  const [products, setProducts] = useState<string[][]>(fallbackProducts)
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>(
    fallbackPriceHistory
  )
  const [filter, setFilter] = useState("active")
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<string[] | "new" | null>(null)
  const [pricesProduct, setPricesProduct] = useState<string[] | null>(null)
  const [deleting, setDeleting] = useState<string[] | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetchTableRowsFromSupabase("product", "prodcode.asc"),
      fetchTableRowsFromSupabase("pricehist", "effdate.desc"),
    ])
      .then(([prodRows, priceRows]) => {
        if (!active || !prodRows.length) return

        const mappedPrices: PriceHistoryEntry[] = priceRows.map((p) => {
          const isDeleted = Boolean(p.is_deleted)
          const [action, user, date] = parseStamp(p.stamp, isDeleted)
          return {
            prodcode: String(p.prodcode ?? ""),
            effdate: String(p.effdate ?? ""),
            price: formatMoney(p.unitprice),
            status: isDeleted ? "Inactive" : "Active",
            action,
            user,
            date,
          }
        })
        setPriceHistory(mappedPrices)

        const latestActivePriceByProd = new Map<string, string>()
        for (const p of priceRows) {
          if (p.is_deleted) continue
          const code = String(p.prodcode ?? "")
          if (!latestActivePriceByProd.has(code)) {
            latestActivePriceByProd.set(code, formatMoney(p.unitprice))
          }
        }

        const mappedProducts = prodRows.map((r) => {
          const isDeleted = Boolean(r.is_deleted)
          const [action, user, date] = parseStamp(r.stamp, isDeleted)
          const code = String(r.prodcode ?? "")
          return [
            code,
            String(r.description ?? "—"),
            String(r.unit ?? "pcs"),
            latestActivePriceByProd.get(code) ?? "—",
            isDeleted ? "Inactive" : "Active",
            action,
            user,
            date,
          ]
        })
        setProducts(mappedProducts)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const counts = useMemo<[number, number, number]>(() => {
    const activeCount = products.filter((r) => r[4] === "Active").length
    const inactiveCount = products.filter((r) => r[4] === "Inactive").length
    return [activeCount, inactiveCount, products.length]
  }, [products])

  const rows = useMemo(
    () =>
      products.filter((row) => {
        if (!isAdmin && row[4] === "Inactive") return false
        if (isAdmin && filter !== "all" && row[4].toLowerCase() !== filter)
          return false
        const q = search.trim().toLowerCase()
        if (!q) return true
        return `${row[0]} ${row[1]} ${row[2]} ${row[3]}`
          .toLowerCase()
          .includes(q)
      }),
    [products, filter, isAdmin, search],
  )
  return (
    <div className="page module-page">
      <div className="page-heading">
        <div>
          <span>Master data / Products</span>
          <div className="page-title">Product Management</div>
          <p>Catalog records with effective-dated commercial pricing.</p>
        </div>
        <div className="module-count">
          <b>{String(isAdmin ? counts[2] : counts[0]).padStart(2, "0")}</b>
          <span>catalog records</span>
        </div>
      </div>
      <EntityControls
        isAdmin={isAdmin}
        counts={counts}
        activeFilter={filter}
        onFilter={setFilter}
        search={search}
        onSearch={setSearch}
        placeholder="Search products..."
        addLabel="Add Product"
        onAdd={() => setForm("new")}
      />
      <section className="entity-table-shell">
        {rows.length ? (
          <div className="table-scroll">
            <table className="entity-table">
              <thead>
                <tr>
                  <th>Prod Code</th>
                  <th>Description</th>
                  <th>Unit</th>
                  <th>Current Price</th>
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
                    className={row[4] === "Inactive" ? "inactive-row" : ""}
                    key={row[0]}
                  >
                    <td className="code-cell">{row[0]}</td>
                    <td>
                      <b className="record-name">{row[1]}</b>
                    </td>
                    <td>{row[2]}</td>
                    <td>
                      <b className="price-value">{row[3]}</b>
                    </td>
                    {isAdmin && (
                      <>
                        <td>
                          <Badge kind={row[4]}>{row[4]}</Badge>
                        </td>
                        <td>
                          <Stamp action={row[5]} user={row[6]} date={row[7]} />
                        </td>
                      </>
                    )}
                    <td>
                      <div className="row-actions">
                        {row[4] === "Inactive" ? (
                          isAdmin && (
                            <button className="success-link">Restore</button>
                          )
                        ) : (
                          <>
                            <button onClick={() => setPricesProduct(row)}>
                              Prices
                            </button>
                            {isAdmin && (
                              <>
                                <button onClick={() => setForm(row)}>Edit</button>
                                <button
                                  className="danger-link"
                                  onClick={() => setDeleting(row)}
                                >
                                  Delete
                                </button>
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
        <div className="entity-footer">
          <span>{rows.length} records visible</span>
          <span>Current price derived as of 2026-10-13</span>
        </div>
      </section>
      {form && (
        <ProductForm
          product={form === "new" ? undefined : form}
          close={() => setForm(null)}
        />
      )}
      {pricesProduct && (
        <PriceHistory
          role={role}
          product={pricesProduct}
          entries={priceHistory.filter((p) => p.prodcode === pricesProduct[0])}
          close={() => setPricesProduct(null)}
        />
      )}
      {deleting && (
        <ConfirmDeleteModal
          record={`${deleting[0]} ${deleting[1]}`}
          noun="Product"
          close={() => setDeleting(null)}
          confirm={() => {
            const name = `${deleting[0]} ${deleting[1]}`
            setDeleting(null)
            if (deleting[0] === "P-001") setBlocked(name)
          }}
        />
      )}
      {blocked && (
        <BlockedDeleteModal record={blocked} close={() => setBlocked(null)} />
      )}
    </div>
  )
}
