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
import Icon from "../components/Icon"
import ModalShell from "../components/ModalShell"
import Stamp from "../components/Stamp"
import type { Role } from "../lib/types"

type HrTab = "employees" | "jobs" | "departments"

const fallbackEmployees = [
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

const fallbackLookups: Record<"jobs" | "departments", string[][]> = {
  jobs: [
    ["J-001", "Software Engineer", "Active", "CREATED", "system", "2026-10-13 1:01 PM"],
    ["J-002", "Sales Manager", "Active", "CREATED", "system", "2026-10-13 1:01 PM"],
    ["J-003", "HR Specialist", "Active", "CREATED", "system", "2026-10-13 1:01 PM"],
    ["J-004", "Accountant", "Inactive", "DELETED", "user2", "2026-10-13 1:01 PM"],
  ],
  departments: [
    ["D-001", "Engineering", "Active", "CREATED", "system", "2026-10-13 1:01 PM"],
    ["D-002", "Sales", "Active", "CREATED", "system", "2026-10-13 1:01 PM"],
    ["D-003", "Human Resources", "Active", "CREATED", "system", "2026-10-13 1:01 PM"],
    ["D-004", "Finance", "Inactive", "DELETED", "user2", "2026-10-13 1:01 PM"],
  ],
}

type JobHistoryEntry = {
  empno: string
  effdate: string
  job: string
  department: string
  salary: string
  status: string
  action: string
  user: string
  date: string
}

const fallbackJobHistory: JobHistoryEntry[] = [
  {
    empno: "E-001",
    effdate: "2023-01-01",
    job: "J-001 — Software Engineer",
    department: "D-001 — Engineering",
    salary: "$52,000.00",
    status: "Active",
    action: "EDITED",
    user: "user1",
    date: "2026-10-13 1:01 PM",
  },
  {
    empno: "E-001",
    effdate: "2020-03-01",
    job: "J-001 — Software Engineer",
    department: "D-001 — Engineering",
    salary: "$45,000.00",
    status: "Active",
    action: "CREATED",
    user: "system",
    date: "2026-01-15 10:00 AM",
  },
]

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

function JobHistory({
  role,
  employee,
  entries,
  close,
}: {
  role: Role
  employee: string[]
  entries: JobHistoryEntry[]
  close: () => void
}) {
  const isAdmin = role !== "User"
  const [view, setView] = useState<"table" | "timeline">("table")
  const [form, setForm] = useState<"new" | "edit" | null>(null)
  const history = entries.filter((e) => isAdmin || e.status === "Active")
  return (
    <ModalShell
      title={`Job History — ${employee[0]} (${employee[2]} ${employee[1]})`}
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
        {isAdmin && (
          <Button icon="plus" onClick={() => setForm("new")}>
            Add History
          </Button>
        )}
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
                    <th>Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {history.length ? (
                history.map((row) => (
                  <tr
                    key={`${row.empno}-${row.effdate}-${row.job}`}
                    className={row.status === "Inactive" ? "inactive-row" : ""}
                  >
                    <td className="code-cell">{row.effdate}</td>
                    <td>
                      <b className="record-name">{row.job}</b>
                    </td>
                    <td>{row.department}</td>
                    <td>
                      <b className="salary-value">{row.salary}</b>
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
                            <button onClick={() => setForm("edit")}>Edit</button>
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
                    No job history entries found for {employee[0]}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="career-timeline">
          {history.map((row, index) => (
            <article key={`${row.empno}-${row.effdate}-${row.job}`}>
              <div className="timeline-rail">
                <span>{index + 1}</span>
              </div>
              <div className="timeline-date">
                {row.effdate}
                <small>
                  {index === 0 ? "Latest assignment" : "Career progression"}
                </small>
              </div>
              <div className="timeline-role">
                <b>{row.job}</b>
                <span>{row.department}</span>
              </div>
              <div className="timeline-salary">
                <small>Annual salary</small>
                <b>{row.salary}</b>
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
  items,
}: {
  tab: "jobs" | "departments"
  role: Role
  items: string[][]
}) {
  const isAdmin = role !== "User"
  const [filter, setFilter] = useState("active")
  const [search, setSearch] = useState("")
  const title = tab === "jobs" ? "Job" : "Department"

  const counts = useMemo<[number, number, number]>(() => {
    const activeCount = items.filter((r) => r[2] === "Active").length
    const inactiveCount = items.filter((r) => r[2] === "Inactive").length
    return [activeCount, inactiveCount, items.length]
  }, [items])

  const rows = useMemo(
    () =>
      items.filter((row) => {
        if (!isAdmin && row[2] === "Inactive") return false
        if (isAdmin && filter !== "all" && row[2].toLowerCase() !== filter)
          return false
        const q = search.trim().toLowerCase()
        if (!q) return true
        return `${row[0]} ${row[1]}`.toLowerCase().includes(q)
      }),
    [items, filter, isAdmin, search],
  )

  return (
    <>
      <EntityControls
        isAdmin={isAdmin}
        counts={counts}
        activeFilter={filter}
        onFilter={setFilter}
        search={search}
        onSearch={setSearch}
        placeholder={`Search ${tab}...`}
        addLabel={`Add ${title}`}
        onAdd={() => {}}
      />
      <section className="entity-table-shell">
        {rows.length ? (
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
                      <th>Actions</th>
                    </>
                  )}
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
                            action={
                              row[3] ??
                              (row[2] === "Active" ? "CREATED" : "DELETED")
                            }
                            user={
                              row[4] ??
                              (row[2] === "Active" ? "system" : "user2")
                            }
                            date={row[5] ?? "2026-10-13 1:01 PM"}
                          />
                        </td>
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
                      </>
                    )}
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
  )
}

export default function HumanResourcesPage({ role }: { role: Role }) {
  const isAdmin = role !== "User"
  const [tab, setTab] = useState<HrTab>("employees")
  const [employees, setEmployees] = useState<string[][]>(fallbackEmployees)
  const [lookups, setLookups] =
    useState<Record<"jobs" | "departments", string[][]>>(fallbackLookups)
  const [jobHistory, setJobHistory] =
    useState<JobHistoryEntry[]>(fallbackJobHistory)
  const [filter, setFilter] = useState("active")
  const [search, setSearch] = useState("")
  const [employeeForm, setEmployeeForm] = useState<"new" | "edit" | null>(null)
  const [historyEmployee, setHistoryEmployee] = useState<string[] | null>(null)
  const [historyRight, setHistoryRight] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      fetchTableRowsFromSupabase("employee", "empno.asc"),
      fetchTableRowsFromSupabase("job", "jobcode.asc"),
      fetchTableRowsFromSupabase("department", "deptcode.asc"),
      fetchTableRowsFromSupabase("jobhistory", "effdate.desc"),
    ])
      .then(([empRows, jobRows, deptRows, histRows]) => {
        if (!active) return

        const jobNameMap = new Map<string, string>()
        if (jobRows.length) {
          for (const j of jobRows) {
            jobNameMap.set(
              String(j.jobcode ?? ""),
              `${j.jobcode} — ${j.jobdesc ?? ""}`
            )
          }
        }

        const deptNameMap = new Map<string, string>()
        if (deptRows.length) {
          for (const d of deptRows) {
            deptNameMap.set(
              String(d.deptcode ?? ""),
              `${d.deptcode} — ${d.deptname ?? ""}`
            )
          }
        }

        if (empRows.length) {
          const mappedEmps = empRows.map((r) => {
            const isDeleted = Boolean(r.is_deleted)
            const [action, user, date] = parseStamp(r.stamp, isDeleted)
            return [
              String(r.empno ?? ""),
              String(r.lastname ?? "—"),
              String(r.firstname ?? "—"),
              String(r.gender ?? "—"),
              String(r.birthdate ?? "—"),
              String(r.hiredate ?? "—"),
              r.sepdate ? String(r.sepdate) : "—",
              isDeleted ? "Inactive" : "Active",
              action,
              user,
              date,
            ]
          })
          setEmployees(mappedEmps)
        }

        if (jobRows.length || deptRows.length) {
          setLookups({
            jobs: jobRows.length
              ? jobRows.map((j) => {
                  const isDeleted = Boolean(j.is_deleted)
                  const [action, user, date] = parseStamp(j.stamp, isDeleted)
                  return [
                    String(j.jobcode ?? ""),
                    String(j.jobdesc ?? "—"),
                    isDeleted ? "Inactive" : "Active",
                    action,
                    user,
                    date,
                  ]
                })
              : fallbackLookups.jobs,
            departments: deptRows.length
              ? deptRows.map((d) => {
                  const isDeleted = Boolean(d.is_deleted)
                  const [action, user, date] = parseStamp(d.stamp, isDeleted)
                  return [
                    String(d.deptcode ?? ""),
                    String(d.deptname ?? "—"),
                    isDeleted ? "Inactive" : "Active",
                    action,
                    user,
                    date,
                  ]
                })
              : fallbackLookups.departments,
          })
        }

        if (histRows.length) {
          const mappedHist: JobHistoryEntry[] = histRows.map((h) => {
            const isDeleted = Boolean(h.is_deleted)
            const [action, user, date] = parseStamp(h.stamp, isDeleted)
            const jCode = String(h.jobcode ?? "")
            const dCode = String(h.deptcode ?? "")
            return {
              empno: String(h.empno ?? ""),
              effdate: String(h.effdate ?? ""),
              job: jobNameMap.get(jCode) || jCode,
              department: deptNameMap.get(dCode) || dCode,
              salary: formatMoney(h.salary),
              status: isDeleted ? "Inactive" : "Active",
              action,
              user,
              date,
            }
          })
          setJobHistory(mappedHist)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const counts = useMemo<[number, number, number]>(() => {
    const activeCount = employees.filter((r) => r[7] === "Active").length
    const inactiveCount = employees.filter((r) => r[7] === "Inactive").length
    return [activeCount, inactiveCount, employees.length]
  }, [employees])

  const rows = useMemo(
    () =>
      employees.filter((row) => {
        if (!isAdmin && row[7] === "Inactive") return false
        if (isAdmin && filter !== "all" && row[7].toLowerCase() !== filter)
          return false
        const q = search.trim().toLowerCase()
        if (!q) return true
        return `${row[0]} ${row[1]} ${row[2]} ${row[3]} ${row[4]} ${row[5]} ${row[6]}`
          .toLowerCase()
          .includes(q)
      }),
    [employees, filter, isAdmin, search],
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
              if (!event.target.checked) setHistoryEmployee(null)
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
            counts={counts}
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
                      {(isAdmin || historyRight) && <th>Actions</th>}
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
                        {(isAdmin || historyRight) && (
                          <td>
                            <div className="row-actions">
                              {row[7] === "Inactive" ? (
                                isAdmin && (
                                  <button className="success-link">
                                    Restore
                                  </button>
                                )
                              ) : (
                                <>
                                  {historyRight && (
                                    <button
                                      onClick={() => setHistoryEmployee(row)}
                                    >
                                      History
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <>
                                      <button
                                        onClick={() => setEmployeeForm("edit")}
                                      >
                                        Edit
                                      </button>
                                      <button className="danger-link">
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        )}
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
        <LookupTable tab={tab} role={role} items={lookups[tab]} />
      )}
      {employeeForm && (
        <EmployeeForm
          editing={employeeForm === "edit"}
          close={() => setEmployeeForm(null)}
        />
      )}
      {historyEmployee && (
        <JobHistory
          role={role}
          employee={historyEmployee}
          entries={jobHistory.filter((h) => h.empno === historyEmployee[0])}
          close={() => setHistoryEmployee(null)}
        />
      )}
    </div>
  )
}
