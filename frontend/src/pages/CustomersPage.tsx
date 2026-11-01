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

const customers = [
  [
    "C-001",
    "Acme Corporation",
    "123 Main St, Metro City",
    "Net 30",
    "Active",
    "CREATED",
    "system",
    "2026-10-01 9:00 AM",
  ],
  [
    "C-002",
    "Globex Industries",
    "456 Oak Ave, Harbor Town",
    "Net 45",
    "Active",
    "CREATED",
    "system",
    "2026-10-02 10:15 AM",
  ],
  [
    "C-003",
    "Initech LLC",
    "789 Pine Rd, Silicon Valley",
    "COD",
    "Active",
    "EDITED",
    "user1",
    "2026-10-13 1:01 PM",
  ],
  [
    "C-004",
    "Umbrella Corp",
    "1 Raccoon City Blvd",
    "Prepaid",
    "Inactive",
    "DELETED",
    "user2",
    "2026-10-13 1:01 PM",
  ],
  [
    "C-005",
    "Stark Enterprises",
    "200 Park Avenue, New York",
    "Net 15",
    "Active",
    "EDITED",
    "user1",
    "2026-10-13 1:01 PM",
  ],
]

function CustomerForm({
  customer,
  close,
}: {
  customer?: string[]
  close: () => void
}) {
  const editing = Boolean(customer)
  return (
    <ModalShell
      title={editing ? "Edit Customer" : "Add Customer"}
      subtitle={
        editing
          ? `Update ${customer?.[0]} without changing its audit history.`
          : "Create a customer master record."
      }
      close={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={close}>
            {editing ? "Save Changes" : "Add Customer"}
          </Button>
        </>
      }
    >
      <div className="record-form">
        <label>
          <span>Cust No</span>
          <input defaultValue={customer?.[0] ?? "C-006"} />
        </label>
        <label>
          <span>Customer Name</span>
          <input
            defaultValue={customer?.[1]}
            placeholder="Legal customer name"
          />
        </label>
        <label className="form-span">
          <span>Address</span>
          <input
            defaultValue={customer?.[2]}
            placeholder="Street, city, province"
          />
        </label>
        <label>
          <span>Pay Terms</span>
          <select defaultValue={customer?.[3] ?? "Net 30"}>
            {["Net 15", "Net 30", "Net 45", "COD", "Prepaid"].map((term) => (
              <option key={term}>{term}</option>
            ))}
          </select>
        </label>
      </div>
    </ModalShell>
  )
}

export default function CustomersPage({ role }: { role: Role }) {
  const isAdmin = role !== "User"
  const [filter, setFilter] = useState("active")
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<string[] | "new" | null>(null)
  const [deleting, setDeleting] = useState<string[] | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)
  const rows = useMemo(
    () =>
      customers.filter((row) => {
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
          <span>Master data / Customers</span>
          <div className="page-title">Customer Management</div>
          <p>Commercial identities, payment terms, and record provenance.</p>
        </div>
        <div className="module-count">
          <b>05</b>
          <span>customer records</span>
        </div>
      </div>
      <EntityControls
        isAdmin={isAdmin}
        counts={[4, 1, 5]}
        activeFilter={filter}
        onFilter={setFilter}
        search={search}
        onSearch={setSearch}
        placeholder="Search customers..."
        addLabel="Add Customer"
        onAdd={() => setForm("new")}
      />
      <section className="entity-table-shell">
        {rows.length ? (
          <div className="table-scroll">
            <table className="entity-table">
              <thead>
                <tr>
                  <th>Cust No</th>
                  <th>Customer Name</th>
                  <th>Address</th>
                  <th>Pay Terms</th>
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
                    <td>{row[3]}</td>
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
          <span>
            {isAdmin
              ? "Administrative view · stamps enabled"
              : "Rights-filtered User view"}
          </span>
        </div>
      </section>
      {form && (
        <CustomerForm
          customer={form === "new" ? undefined : form}
          close={() => setForm(null)}
        />
      )}
      {deleting && (
        <ConfirmDeleteModal
          record={`${deleting[0]} ${deleting[1]}`}
          noun="Customer"
          close={() => setDeleting(null)}
          confirm={() => {
            const name = `${deleting[0]} ${deleting[1]}`
            setDeleting(null)
            if (deleting[0] === "C-001") setBlocked(name)
          }}
        />
      )}
      {blocked && (
        <BlockedDeleteModal record={blocked} close={() => setBlocked(null)} />
      )}
    </div>
  )
}
