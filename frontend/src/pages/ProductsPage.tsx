import { useMemo, useState } from "react"
import Badge from "../components/Badge"
import BlockedDeleteModal from "../components/BlockedDeleteModal"
import Button from "../components/Button"
import ConfirmDeleteModal from "../components/ConfirmDeleteModal"
import EmptyState from "../components/EmptyState"
import EntityControls from "../components/EntityControls"
import ModalShell from "../components/ModalShell"
import Stamp from "../components/Stamp"
import type { Role } from "../lib/types"

const products = [
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

function PriceHistory({ role, close }: { role: Role, close: () => void }) {
  const isAdmin = role !== "User"
  const [priceForm, setPriceForm] = useState<"new" | "edit" | null>(null)
  return (
    <ModalShell
      title="Price History — P-003"
      subtitle="Lubricant Oil 5L · Unit: can"
      close={close}
      wide
      footer={
        <Button variant="secondary" onClick={close}>
          Close
        </Button>
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
        <Button icon="plus" onClick={() => setPriceForm("new")}>
          Add Price
        </Button>
      </div>
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
                </>
              )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="code-cell">2026-02-01</td>
              <td>
                <b className="price-value">$28.00</b>
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
                      date="2026-02-01 10:00 AM"
                    />
                  </td>
                </>
              )}
              <td>
                <div className="row-actions">
                  <button onClick={() => setPriceForm("edit")}>Edit</button>
                  <button className="danger-link">Delete</button>
                </div>
              </td>
            </tr>
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
  const [filter, setFilter] = useState("active")
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<string[] | "new" | null>(null)
  const [prices, setPrices] = useState(false)
  const [deleting, setDeleting] = useState<string[] | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)
  const rows = useMemo(
    () =>
      products.filter((row) => {
        if (!isAdmin && row[4] === "Inactive") return false
        if (isAdmin && filter !== "all" && row[4].toLowerCase() !== filter)
          return false
        return `${row[0]} ${row[1]} ${row[2]}`
          .toLowerCase()
          .includes(search.toLowerCase())
      }),
    [filter, isAdmin, search],
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
          <b>05</b>
          <span>catalog records</span>
        </div>
      </div>
      <EntityControls
        isAdmin={isAdmin}
        counts={[4, 1, 5]}
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
                          <button className="success-link">Restore</button>
                        ) : (
                          <>
                            <button onClick={() => setPrices(true)}>
                              Prices
                            </button>
                            <button onClick={() => setForm(row)}>Edit</button>
                            <button
                              className="danger-link"
                              onClick={() => setDeleting(row)}
                            >
                              Delete
                            </button>
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
      {prices && <PriceHistory role={role} close={() => setPrices(false)} />}
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
