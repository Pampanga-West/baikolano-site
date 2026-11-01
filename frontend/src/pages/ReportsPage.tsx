import { useEffect, useState } from "react"
import Button from "../components/Button"
import Icon from "../components/Icon"
import type { Role } from "../lib/types"

type ReportKey = "customers" | "product-master" | "products" | "active-employees" | "all-employees" | "history" | "sales"

const reports: {
  key: ReportKey
  short: string
  title: string
  subtitle: string
}[] = [
  {
    key: "customers",
    short: "Top Customers",
    title: "Top Customers by Sales",
    subtitle: "Ranked by active sale total in the selected period.",
  },
  {
    key: "product-master",
    short: "Product Master",
    title: "Product Master List (Current Price)",
    subtitle: "Current effective price for every active catalog item.",
  },
  {
    key: "products",
    short: "Top Products",
    title: "Top Products by Sales Amount",
    subtitle: "Quantity and sales contribution by active product.",
  },
  {
    key: "active-employees",
    short: "Active Employees",
    title: "Active Employees (Not Separated)",
    subtitle: "Employees with no separation date.",
  },
  {
    key: "all-employees",
    short: "All Employees",
    title: "All Employees (Including Separated)",
    subtitle: "Complete employment register, including separation status.",
  },
  {
    key: "history",
    short: "Job History",
    title: "Employee Job History",
    subtitle: "Effective-dated career and salary record.",
  },
  {
    key: "sales",
    short: "Top Sales",
    title: "Top Sales",
    subtitle: "Highest-value active transactions in the selected period.",
  },
]

const reportData: Record<ReportKey, { headers: string[], rows: string[][] }> = {
  customers: {
    headers: ["Rank", "Cust No", "Customer Name", "Total Sales"],
    rows: [
      ["1", "C-003", "Initech LLC", "$510.00"],
      ["2", "C-001", "Acme Corporation", "$234.50"],
      ["3", "C-002", "Globex Industries", "$140.00"],
    ],
  },
  "product-master": {
    headers: ["Prod Code", "Description", "Unit", "Current Price"],
    rows: [
      ["P-001", "Industrial Widget A", "pcs", "$13.75"],
      ["P-002", "Steel Bracket Heavy", "pcs", "$48.50"],
      ["P-003", "Lubricant Oil 5L", "can", "$28.00"],
      ["P-005", "Copper Wire 2.5mm", "meter", "$2.35"],
    ],
  },
  products: {
    headers: ["Rank", "Prod Code", "Description", "Qty Sold", "Sales Amount"],
    rows: [
      ["1", "P-001", "Industrial Widget A", "30", "$412.50"],
      ["2", "P-005", "Copper Wire 2.5mm", "100", "$235.00"],
      ["3", "P-003", "Lubricant Oil 5L", "5", "$140.00"],
      ["4", "P-002", "Steel Bracket Heavy", "2", "$97.00"],
    ],
  },
  "active-employees": {
    headers: [
      "Emp No",
      "Last Name",
      "First Name",
      "Gender",
      "Birth Date",
      "Hire Date",
    ],
    rows: [
      ["E-001", "Santos", "Maria", "F", "1990-05-12", "2020-03-01"],
      ["E-002", "Reyes", "Juan", "M", "1988-11-03", "2019-07-15"],
      ["E-003", "Cruz", "Ana", "F", "1995-02-20", "2021-01-10"],
    ],
  },
  "all-employees": {
    headers: [
      "Emp No",
      "Last Name",
      "First Name",
      "Gender",
      "Birth Date",
      "Hire Date",
      "Sep Date",
      "Status",
    ],
    rows: [
      [
        "E-001",
        "Santos",
        "Maria",
        "F",
        "1990-05-12",
        "2020-03-01",
        "—",
        "Active",
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
      ],
      ["E-003", "Cruz", "Ana", "F", "1995-02-20", "2021-01-10", "—", "Active"],
      [
        "E-004",
        "Garcia",
        "Pedro",
        "M",
        "1985-08-30",
        "2018-05-01",
        "2025-12-31",
        "Inactive",
      ],
    ],
  },
  history: {
    headers: ["Eff Date", "Job", "Department", "Salary"],
    rows: [
      [
        "2023-01-01",
        "J-001 — Software Engineer",
        "D-001 — Engineering",
        "$52,000",
      ],
      [
        "2020-03-01",
        "J-001 — Software Engineer",
        "D-001 — Engineering",
        "$45,000",
      ],
    ],
  },
  sales: {
    headers: ["Rank", "Trans No", "Date", "Customer", "Employee", "Total"],
    rows: [
      [
        "1",
        "T-003",
        "2026-10-08",
        "C-003 — Initech LLC",
        "E-002 — Juan Reyes",
        "$510.00",
      ],
      [
        "2",
        "T-001",
        "2026-10-01",
        "C-001 — Acme Corporation",
        "E-002 — Juan Reyes",
        "$234.50",
      ],
      [
        "3",
        "T-002",
        "2026-10-05",
        "C-002 — Globex Industries",
        "E-001 — Maria Santos",
        "$140.00",
      ],
    ],
  },
}

export default function ReportsPage({ role }: { role: Role }) {
  const available =
    role === "User"
      ? reports.filter((report) => report.key === "customers")
      : reports
  const [active, setActive] = useState<ReportKey>(available[0].key)
  useEffect(() => {
    if (!available.some((report) => report.key === active)) {
      setActive(available[0].key)
    }
  }, [active, role])
  const report = reports.find((item) => item.key === active) ?? reports[0]
  const data = reportData[report.key]
  const dated = ["customers", "products", "sales"].includes(report.key)
  return (
    <div className="page reports-page">
      <div className="page-heading">
        <div>
          <span>Decision support / Reports</span>
          <div className="page-title">Reports</div>
          <p>
            Read-only operational views. Visibility follows each assigned report
            right.
          </p>
        </div>
        <div className="rights-counter">
          <Icon name="shield" />
          <span>
            <b>{available.length} of 7</b> reports assigned
          </span>
        </div>
      </div>
      <div className="report-tabs">
        {available.map((item, index) => (
          <button
            className={active === item.key ? "selected" : ""}
            onClick={() => setActive(item.key)}
            key={item.key}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item.short}
          </button>
        ))}
      </div>
      <section className="report-sheet">
        <div className="report-head">
          <div>
            <span>Hope, Inc. ERP · generated 2026-10-13</span>
            <div className="report-title">{report.title}</div>
            <p>{report.subtitle}</p>
          </div>
          <div>
            <Button variant="secondary">
              <Icon name="report" size={16} />
              Print
            </Button>
            <Button>Save as PDF</Button>
          </div>
        </div>
        {(dated || report.key === "history") && (
          <div className="report-filters">
            {dated ? (
              <>
                <label>
                  <span>From Date</span>
                  <input type="date" defaultValue="2026-10-01" />
                </label>
                <label>
                  <span>To Date</span>
                  <input type="date" defaultValue="2026-10-13" />
                </label>
                <label>
                  <span>Top N</span>
                  <select defaultValue="10">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                </label>
              </>
            ) : (
              <label className="employee-filter">
                <span>Employee</span>
                <select>
                  <option>E-001 — Maria Santos</option>
                </select>
              </label>
            )}
            <Button variant="dark">Apply Filters</Button>
          </div>
        )}
        <div className="table-scroll">
          <table className="entity-table report-table">
            <thead>
              <tr>
                {data.headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, index) => (
                <tr key={`${active}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <td
                      className={
                        cellIndex === 0
                          ? "code-cell"
                          : cell.startsWith("$")
                            ? "numeric-cell"
                            : ""
                      }
                      key={`${cell}-${cellIndex}`}
                    >
                      {cellIndex === row.length - 1 && cell.startsWith("$") ? (
                        <b>{cell}</b>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {report.key === "products" && (
              <tfoot>
                <tr>
                  <td colSpan={3}>Report total</td>
                  <td>137</td>
                  <td>$884.50</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="report-foot">
          <span>Internal operational report · read only</span>
          <span>Page 1 of 1</span>
        </div>
      </section>
    </div>
  )
}
