import { useMemo, useState } from "react"
import Badge from "../components/Badge"
import Button from "../components/Button"
import EmptyState from "../components/EmptyState"
import EntityControls from "../components/EntityControls"
import Icon from "../components/Icon"
import ModalShell from "../components/ModalShell"
import Stamp from "../components/Stamp"
import type { Role } from "../lib/types"

type HrTab = "employees" | "jobs" | "departments"

const employees = [
  [
    "E-001",
    "Santos",
    "Maria",
    "F",
    "1990-05-12",
    "2020-03-01",
    "—",
    "Active",
    "CREATED",
    "system",
    "2026-01-15 10:00 AM",
  ],
  [
    "E-002",
    "Reyes",
    "Juan",
    "M",
    "1988-11-03",
    "2019-07-15",
    "—",
    "Active",
    "EDITED",
    "user1",
    "2026-10-13 1:01 PM",
  ],
  [
    "E-003",
    "Cruz",
    "Ana",
    "F",
    "1995-02-20",
    "2021-01-10",
    "—",
    "Active",
    "CREATED",
    "system",
    "2026-02-01 9:00 AM",
  ],
  [
    "E-004",
    "Garcia",
    "Pedro",
    "M",
    "1985-08-30",
    "2018-05-01",
    "2025-12-31",
    "Inactive",
    "DELETED",
    "user2",
    "2026-10-13 1:01 PM",
  ],
]

const lookups = {
  jobs: [
    ["J-001", "Software Engineer", "Active"],
    ["J-002", "Sales Manager", "Active"],
    ["J-003", "HR Specialist", "Active"],
    ["J-004", "Accountant", "Inactive"],
  ],
  departments: [
    ["D-001", "Engineering", "Active"],
    ["D-002", "Sales", "Active"],
    ["D-003", "Human Resources", "Active"],
    ["D-004", "Finance", "Inactive"],
  ],
}

function EmployeeForm({
  editing,
  close,
}: {
  editing?: boolean
  close: () => void
}) {
  const [separation, setSeparation] = useState(editing ? "" : "2019-01-01")
  const invalid = Boolean(separation && separation < "2020-03-01")
  return (
    <ModalShell
      title={editing ? "Edit Employee" : "Add Employee"}
      subtitle="Personal dates and employment dates are validated independently."
      close={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={close} disabled={invalid}>
            {editing ? "Save Changes" : "Add Employee"}
          </Button>
        </>
      }
    >
      <div className="record-form record-form-three">
        <label>
          <span>Emp No</span>
          <input defaultValue={editing ? "E-001" : "E-005"} />
        </label>
        <label>
          <span>Last Name</span>
          <input defaultValue={editing ? "Santos" : ""} />
        </label>
        <label>
          <span>First Name</span>
          <input defaultValue={editing ? "Maria" : ""} />
        </label>
        <label>
          <span>Gender</span>
          <select defaultValue="F">
            <option>F</option>
            <option>M</option>
            <option>Prefer not to say</option>
          </select>
        </label>
        <label>
          <span>Birth Date</span>
          <input type="date" defaultValue="1990-05-12" />
        </label>
        <label>
          <span>Hire Date</span>
          <input type="date" defaultValue="2020-03-01" />
        </label>
        <label>
          <span>Separation Date</span>
          <input
            className={invalid ? "input-error" : ""}
            type="date"
            value={separation}
            onChange={(event) => setSeparation(event.target.value)}
          />
          {invalid && (
            <small className="validation-error">
              Separation Date cannot be earlier than Hire Date.
            </small>
          )}
        </label>
      </div>
    </ModalShell>
  )
}

function HistoryForm({
  editing,
  close,
}: {
  editing?: boolean
  close: () => void
}) {
  return (
    <ModalShell
      title={editing ? "Edit Job History" : "Add Job History"}
      subtitle="Effective dates must be unique for this employee."
      close={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={close}>
            {editing ? "Save History" : "Add History"}
          </Button>
        </>
      }
    >
      <div className="record-form">
        <label>
          <span>Effective Date</span>
          <input
            className={!editing ? "input-error" : ""}
            type="date"
            defaultValue={editing ? "2023-01-01" : "2020-03-01"}
          />
          {!editing && (
            <small className="validation-error">
              A history row already exists on this effective date.
            </small>
          )}
        </label>
        <label>
          <span>Salary</span>
          <div className="money-input">
            <span>$</span>
            <input defaultValue={editing ? "52000" : "45000"} />
          </div>
        </label>
        <label>
          <span>Job</span>
          <select>
            <option>J-001 — Software Engineer</option>
            <option>J-002 — Sales Manager</option>
          </select>
        </label>
        <label>
          <span>Department</span>
          <select>
            <option>D-001 — Engineering</option>
            <option>D-002 — Sales</option>
          </select>
        </label>
      </div>
    </ModalShell>
  )
}

function JobHistory({ role, close }: { role: Role, close: () => void }) {
  const isAdmin = role !== "User"
  const [view, setView] = useState<"table" | "timeline">("table")
  const [form, setForm] = useState<"new" | "edit" | null>(null)
  const history = [
    [
      "2023-01-01",
      "J-001 — Software Engineer",
      "D-001 — Engineering",
      "$52,000",
      "EDITED",
      "user1",
      "2026-10-13 1:01 PM",
    ],
    [
      "2020-03-01",
      "J-001 — Software Engineer",
      "D-001 — Engineering",
      "$45,000",
      "CREATED",
      "system",
      "2026-01-15 10:00 AM",
    ],
  ]
  return (
    <ModalShell
      title="Job History — E-001 (Maria Santos)"
      subtitle="Career movement, effective dates, and salary progression."
      close={close}
      wide
      className="history-modal"
      footer={
        <Button variant="secondary" onClick={close}>
          Close
        </Button>
      }
    >
      <div className="history-toolbar">
        <div className="view-switch">
          <button
            className={view === "table" ? "selected" : ""}
            onClick={() => setView("table")}
          >
            <Icon name="report" size={15} />
            Table View
          </button>
          <button
            className={view === "timeline" ? "selected" : ""}
            onClick={() => setView("timeline")}
          >
            <Icon name="briefcase" size={15} />
            Visual Timeline
          </button>
        </div>
        <Button icon="plus" onClick={() => setForm("new")}>
          Add History
        </Button>
      </div>
      {view === "table" ? (
        <div className="table-scroll">
          <table className="entity-table">
            <thead>
              <tr>
                <th>Eff Date</th>
                <th>Job</th>
                <th>Department</th>
                <th>Salary</th>
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
              {history.map((row) => (
                <tr key={row[0]}>
                  <td className="code-cell">{row[0]}</td>
                  <td>
                    <b className="record-name">{row[1]}</b>
                  </td>
                  <td>{row[2]}</td>
                  <td>
                    <b className="salary-value">{row[3]}</b>
                  </td>
                  {isAdmin && (
                    <>
                      <td>
                        <Badge kind="active">Active</Badge>
                      </td>
                      <td>
                        <Stamp action={row[4]} user={row[5]} date={row[6]} />
                      </td>
                    </>
                  )}
                  <td>
                    <div className="row-actions">
                      <button onClick={() => setForm("edit")}>Edit</button>
                      <button className="danger-link">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="career-timeline">
          {history.map((row, index) => (
            <article key={row[0]}>
              <div className="timeline-rail">
                <span>{index + 1}</span>
              </div>
              <div className="timeline-date">
                {row[0]}
                <small>
                  {index === 0 ? "Promotion review" : "Joined Hope, Inc."}
                </small>
              </div>
              <div className="timeline-role">
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
              <div className="timeline-salary">
                <small>Annual salary</small>
                <b>{row[3]}</b>
                {index === 0 && <em>+15.6%</em>}
              </div>
            </article>
          ))}
        </div>
      )}
      {form && (
        <HistoryForm editing={form === "edit"} close={() => setForm(null)} />
      )}
    </ModalShell>
  )
}

function LookupTable({
  tab,
  role,
}: {
  tab: "jobs" | "departments"
  role: Role
}) {
  const isAdmin = role !== "User"
  const title = tab === "jobs" ? "Job" : "Department"
  const rows = lookups[tab].filter((row) => isAdmin || row[2] === "Active")
  return (
    <>
      <div className="lookup-intro">
        <div>
          <b>{title} Directory</b>
          <p>Stable reference values used across employee history.</p>
        </div>
        <Button icon="plus">Add {title}</Button>
      </div>
      <section className="entity-table-shell">
        <div className="table-scroll">
          <table className="entity-table">
            <thead>
              <tr>
                <th>{title} Code</th>
                <th>{tab === "jobs" ? "Description" : "Department Name"}</th>
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
                  className={row[2] === "Inactive" ? "inactive-row" : ""}
                  key={row[0]}
                >
                  <td className="code-cell">{row[0]}</td>
                  <td>
                    <b className="record-name">{row[1]}</b>
                  </td>
                  {isAdmin && (
                    <>
                      <td>
                        <Badge kind={row[2]}>{row[2]}</Badge>
                      </td>
                      <td>
                        <Stamp
                          action={row[2] === "Active" ? "CREATED" : "DELETED"}
                          user={row[2] === "Active" ? "system" : "user2"}
                          date="2026-10-13 1:01 PM"
                        />
                      </td>
                    </>
                  )}
                  <td>
                    <div className="row-actions">
                      {row[2] === "Inactive" ? (
                        <button className="success-link">Restore</button>
                      ) : (
                        <>
                          <button>Edit</button>
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
      </section>
    </>
  )
}

export default function HumanResourcesPage({ role }: { role: Role }) {
  const isAdmin = role !== "User"
  const [tab, setTab] = useState<HrTab>("employees")
  const [filter, setFilter] = useState("active")
  const [search, setSearch] = useState("")
  const [employeeForm, setEmployeeForm] = useState<"new" | "edit" | null>(null)
  const [history, setHistory] = useState(false)
  const [historyRight, setHistoryRight] = useState(true)
  const rows = useMemo(
    () =>
      employees.filter((row) => {
        if (!isAdmin && row[7] === "Inactive") return false
        if (isAdmin && filter !== "all" && row[7].toLowerCase() !== filter)
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
          <span>People operations / Human Resources</span>
          <div className="page-title">Human Resources</div>
          <p>
            Employment records, organization structure, and effective-dated
            careers.
          </p>
        </div>
        <label className="privacy-toggle">
          <span>
            <b>View Job History right</b>
            <small>
              {historyRight
                ? "Granted · salary visible"
                : "Restricted · salary hidden"}
            </small>
          </span>
          <input
            type="checkbox"
            checked={historyRight}
            onChange={(event) => {
              setHistoryRight(event.target.checked)
              if (!event.target.checked) setHistory(false)
            }}
          />
          <i></i>
        </label>
      </div>
      <div className="module-subnav">
        {(["employees", "jobs", "departments"] as HrTab[]).map((item) => (
          <button
            className={tab === item ? "selected" : ""}
            onClick={() => setTab(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "employees" ? (
        <>
          <EntityControls
            isAdmin={isAdmin}
            counts={[3, 1, 4]}
            activeFilter={filter}
            onFilter={setFilter}
            search={search}
            onSearch={setSearch}
            placeholder="Search employees..."
            addLabel="Add Employee"
            onAdd={() => setEmployeeForm("new")}
          />
          {!historyRight && (
            <div className="privacy-banner">
              <Icon name="lock" />
              <div>
                <b>Restricted by Data Privacy controls</b>
                <span>
                  Job History actions and salary figures are hidden in this
                  preview state.
                </span>
              </div>
            </div>
          )}
          <section className="entity-table-shell">
            {rows.length ? (
              <div className="table-scroll">
                <table className="entity-table hr-table">
                  <thead>
                    <tr>
                      <th>Emp No</th>
                      <th>Last Name</th>
                      <th>First Name</th>
                      <th>Gender</th>
                      <th>Birth Date</th>
                      <th>Hire Date</th>
                      <th>Sep Date</th>
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
                        className={row[7] === "Inactive" ? "inactive-row" : ""}
                        key={row[0]}
                      >
                        <td className="code-cell">{row[0]}</td>
                        <td>
                          <b className="record-name">{row[1]}</b>
                        </td>
                        <td>{row[2]}</td>
                        <td>{row[3]}</td>
                        <td>{row[4]}</td>
                        <td>{row[5]}</td>
                        <td>{row[6]}</td>
                        {isAdmin && (
                          <>
                            <td>
                              <Badge kind={row[7]}>{row[7]}</Badge>
                            </td>
                            <td>
                              <Stamp
                                action={row[8]}
                                user={row[9]}
                                date={row[10]}
                              />
                            </td>
                          </>
                        )}
                        <td>
                          <div className="row-actions">
                            {row[7] === "Inactive" ? (
                              <button className="success-link">Restore</button>
                            ) : (
                              <>
                                {historyRight && (
                                  <button onClick={() => setHistory(true)}>
                                    History
                                  </button>
                                )}
                                <button onClick={() => setEmployeeForm("edit")}>
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
        </>
      ) : (
        <LookupTable tab={tab} role={role} />
      )}
      {employeeForm && (
        <EmployeeForm
          editing={employeeForm === "edit"}
          close={() => setEmployeeForm(null)}
        />
      )}
      {history && <JobHistory role={role} close={() => setHistory(false)} />}
    </div>
  )
}
