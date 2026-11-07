import { useEffect, useMemo, useState } from "react"
import { fetchTableRowsFromSupabase, formatMoney } from "../backend/supabaseClient"
import Button from "../components/Button"
import EmptyState from "../components/EmptyState"
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

const fallbackReportData: Record<ReportKey, { headers: string[], rows: string[][] }> = {
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
    headers: ["Emp No", "Employee", "Eff Date", "Job", "Department", "Salary"],
    rows: [
      [
        "E-001",
        "Maria Santos",
        "2023-01-01",
        "J-001 — Software Engineer",
        "D-001 — Engineering",
        "$52,000.00",
      ],
      [
        "E-001",
        "Maria Santos",
        "2020-03-01",
        "J-001 — Software Engineer",
        "D-001 — Engineering",
        "$45,000.00",
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

export default function ReportsPage({ role: _role }: { role: Role }) {
  const available = reports
  const [active, setActive] = useState<ReportKey>(available[0].key)
  const [search, setSearch] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [topN, setTopN] = useState("25")
  const [selectedEmp, setSelectedEmp] = useState("ALL")

  const [rawTables, setRawTables] = useState<{
    customers: Record<string, any>[]
    products: Record<string, any>[]
    prices: Record<string, any>[]
    employees: Record<string, any>[]
    jobs: Record<string, any>[]
    departments: Record<string, any>[]
    history: Record<string, any>[]
    sales: Record<string, any>[]
    salesdetail: Record<string, any>[]
  } | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([
      fetchTableRowsFromSupabase("customer", "custno.asc"),
      fetchTableRowsFromSupabase("product", "prodcode.asc"),
      fetchTableRowsFromSupabase("pricehist", "effdate.desc"),
      fetchTableRowsFromSupabase("employee", "empno.asc"),
      fetchTableRowsFromSupabase("job", "jobcode.asc"),
      fetchTableRowsFromSupabase("department", "deptcode.asc"),
      fetchTableRowsFromSupabase("jobhistory", "effdate.desc"),
      fetchTableRowsFromSupabase("sales", "transno.asc"),
      fetchTableRowsFromSupabase("salesdetail", "transno.asc"),
    ])
      .then(
        ([
          customers,
          products,
          prices,
          employees,
          jobs,
          departments,
          history,
          sales,
          salesdetail,
        ]) => {
          if (!mounted) return
          if (
            customers.length ||
            products.length ||
            employees.length ||
            sales.length
          ) {
            setRawTables({
              customers,
              products,
              prices,
              employees,
              jobs,
              departments,
              history,
              sales,
              salesdetail,
            })
          }
        }
      )
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const employeeOptions = useMemo(() => {
    if (!rawTables?.employees.length) {
      return [
        { value: "ALL", label: "All Employees" },
        { value: "E-001", label: "E-001 — Maria Santos" },
      ]
    }
    return [
      { value: "ALL", label: "All Employees" },
      ...rawTables.employees
        .filter((e) => !e.is_deleted)
        .map((e) => ({
          value: String(e.empno ?? ""),
          label: `${e.empno} — ${e.firstname ?? ""} ${e.lastname ?? ""}`.trim(),
        })),
    ]
  }, [rawTables])

  const computedData = useMemo<
    Record<ReportKey, { headers: string[]; rows: string[][] }>
  >(() => {
    if (!rawTables) return fallbackReportData

    const custNameMap = new Map<string, string>()
    for (const c of rawTables.customers) {
      custNameMap.set(String(c.custno ?? ""), String(c.custname ?? "—"))
    }

    const empNameMap = new Map<string, string>()
    for (const e of rawTables.employees) {
      empNameMap.set(
        String(e.empno ?? ""),
        `${e.firstname ?? ""} ${e.lastname ?? ""}`.trim()
      )
    }

    const prodMap = new Map<string, { desc: string; unit: string }>()
    for (const p of rawTables.products) {
      prodMap.set(String(p.prodcode ?? ""), {
        desc: String(p.description ?? "—"),
        unit: String(p.unit ?? "pcs"),
      })
    }

    const priceByProd = new Map<string, { effdate: string; price: number }[]>()
    for (const pr of rawTables.prices) {
      if (pr.is_deleted) continue
      const code = String(pr.prodcode ?? "")
      const list = priceByProd.get(code) ?? []
      list.push({
        effdate: String(pr.effdate ?? ""),
        price: Number(pr.unitprice) || 0,
      })
      priceByProd.set(code, list)
    }

    const resolvePrice = (prodcode: string, salesdate?: string) => {
      const list = priceByProd.get(prodcode) ?? []
      if (!list.length) return 0
      if (!salesdate) return list[0].price
      const match = list.find((p) => p.effdate <= salesdate)
      return match ? match.price : list[0].price
    }

    const activeSales = rawTables.sales.filter((s) => {
      if (s.is_deleted) return false
      const d = String(s.salesdate ?? "")
      if (fromDate && d < fromDate) return false
      if (toDate && d > toDate) return false
      return true
    })

    const activeSaleMap = new Map<string, Record<string, any>>()
    for (const s of activeSales) {
      activeSaleMap.set(String(s.transno ?? ""), s)
    }

    const saleTotalByTrans = new Map<string, number>()
    const prodAgg = new Map<string, { qty: number; amount: number }>()

    for (const d of rawTables.salesdetail) {
      if (d.is_deleted) continue
      const tNo = String(d.transno ?? "")
      const sale = activeSaleMap.get(tNo)
      if (!sale) continue
      const pCode = String(d.prodcode ?? "")
      const qty = Number(d.quantity) || 0
      const uPrice = resolvePrice(pCode, String(sale.salesdate ?? ""))
      const lineTotal = qty * uPrice

      saleTotalByTrans.set(tNo, (saleTotalByTrans.get(tNo) ?? 0) + lineTotal)
      const prevProd = prodAgg.get(pCode) ?? { qty: 0, amount: 0 }
      prodAgg.set(pCode, {
        qty: prevProd.qty + qty,
        amount: prevProd.amount + lineTotal,
      })
    }

    const limitN = Number(topN) || 25

    // 1. Top Customers
    const custSales = new Map<string, number>()
    for (const s of activeSales) {
      const cNo = String(s.custno ?? "")
      const tNo = String(s.transno ?? "")
      custSales.set(
        cNo,
        (custSales.get(cNo) ?? 0) + (saleTotalByTrans.get(tNo) ?? 0)
      )
    }
    const topCustomerRows = Array.from(custSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitN)
      .map(([cNo, total], idx) => [
        String(idx + 1),
        cNo,
        custNameMap.get(cNo) ?? cNo,
        formatMoney(total),
      ])

    // 2. Product Master
    const productMasterRows = rawTables.products
      .filter((p) => !p.is_deleted)
      .map((p) => {
        const code = String(p.prodcode ?? "")
        const latest = priceByProd.get(code)?.[0]?.price
        return [
          code,
          String(p.description ?? "—"),
          String(p.unit ?? "pcs"),
          latest !== undefined ? formatMoney(latest) : "—",
        ]
      })

    // 3. Top Products
    const topProductRows = Array.from(prodAgg.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, limitN)
      .map(([pCode, agg], idx) => [
        String(idx + 1),
        pCode,
        prodMap.get(pCode)?.desc ?? pCode,
        String(agg.qty),
        formatMoney(agg.amount),
      ])

    // 4. Active Employees
    const activeEmployeeRows = rawTables.employees
      .filter((e) => !e.is_deleted && !e.sepdate)
      .map((e) => [
        String(e.empno ?? ""),
        String(e.lastname ?? "—"),
        String(e.firstname ?? "—"),
        String(e.gender ?? "—"),
        String(e.birthdate ?? "—"),
        String(e.hiredate ?? "—"),
      ])

    // 5. All Employees
    const allEmployeeRows = rawTables.employees.map((e) => [
      String(e.empno ?? ""),
      String(e.lastname ?? "—"),
      String(e.firstname ?? "—"),
      String(e.gender ?? "—"),
      String(e.birthdate ?? "—"),
      String(e.hiredate ?? "—"),
      e.sepdate ? String(e.sepdate) : "—",
      e.is_deleted || e.sepdate ? "Inactive" : "Active",
    ])

    // 6. Job History
    const jobMap = new Map<string, string>()
    for (const j of rawTables.jobs) {
      jobMap.set(
        String(j.jobcode ?? ""),
        `${j.jobcode} — ${j.jobdesc ?? ""}`
      )
    }
    const deptMap = new Map<string, string>()
    for (const d of rawTables.departments) {
      deptMap.set(
        String(d.deptcode ?? ""),
        `${d.deptcode} — ${d.deptname ?? ""}`
      )
    }
    const historyRows = rawTables.history
      .filter(
        (h) =>
          !h.is_deleted &&
          (selectedEmp === "ALL" || String(h.empno ?? "") === selectedEmp)
      )
      .map((h) => {
        const eNo = String(h.empno ?? "")
        const jCode = String(h.jobcode ?? "")
        const dCode = String(h.deptcode ?? "")
        return [
          eNo,
          empNameMap.get(eNo) ?? eNo,
          String(h.effdate ?? "—"),
          jobMap.get(jCode) ?? jCode,
          deptMap.get(dCode) ?? dCode,
          formatMoney(h.salary),
        ]
      })

    // 7. Top Sales
    const topSalesRows = activeSales
      .map((s) => {
        const tNo = String(s.transno ?? "")
        const cNo = String(s.custno ?? "")
        const eNo = String(s.empno ?? "")
        const total = saleTotalByTrans.get(tNo) ?? 0
        return {
          tNo,
          date: String(s.salesdate ?? "—"),
          customer: `${cNo} — ${custNameMap.get(cNo) ?? cNo}`,
          employee: `${eNo} — ${empNameMap.get(eNo) ?? eNo}`,
          total,
        }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, limitN)
      .map((item, idx) => [
        String(idx + 1),
        item.tNo,
        item.date,
        item.customer,
        item.employee,
        formatMoney(item.total),
      ])

    return {
      customers: {
        headers: fallbackReportData.customers.headers,
        rows: topCustomerRows,
      },
      "product-master": {
        headers: fallbackReportData["product-master"].headers,
        rows: productMasterRows,
      },
      products: {
        headers: fallbackReportData.products.headers,
        rows: topProductRows,
      },
      "active-employees": {
        headers: fallbackReportData["active-employees"].headers,
        rows: activeEmployeeRows,
      },
      "all-employees": {
        headers: fallbackReportData["all-employees"].headers,
        rows: allEmployeeRows,
      },
      history: {
        headers: fallbackReportData.history.headers,
        rows: historyRows,
      },
      sales: {
        headers: fallbackReportData.sales.headers,
        rows: topSalesRows,
      },
    }
  }, [rawTables, fromDate, toDate, topN, selectedEmp])

  const report = reports.find((item) => item.key === active) ?? reports[0]
  const data = computedData[report.key]
  const dated = ["customers", "products", "sales"].includes(report.key)

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data.rows
    return data.rows.filter((row) =>
      row.join(" ").toLowerCase().includes(q)
    )
  }, [data.rows, search])

  const productsTotals = useMemo(() => {
    if (report.key !== "products") return { qty: 0, amount: "$0.00" }
    let qty = 0
    let amount = 0
    for (const r of filteredRows) {
      qty += Number(r[3]) || 0
      amount += Number(r[4]?.replace(/[^0-9.-]+/g, "")) || 0
    }
    return { qty, amount: formatMoney(amount) }
  }, [filteredRows, report.key])

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
            <Button variant="secondary" onClick={() => window.print()}>
              <Icon name="report" size={16} />
              Print
            </Button>
            <Button onClick={() => window.print()}>Save as PDF</Button>
          </div>
        </div>
        <div className="report-filters">
          <label style={{ flex: 1, minWidth: "200px" }}>
            <span>Search Report</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${report.short.toLowerCase()}...`}
            />
          </label>
          {dated && (
            <>
              <label>
                <span>From Date</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </label>
              <label>
                <span>To Date</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </label>
              <label>
                <span>Top N</span>
                <select
                  value={topN}
                  onChange={(e) => setTopN(e.target.value)}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </label>
            </>
          )}
          {report.key === "history" && (
            <label className="employee-filter">
              <span>Employee</span>
              <select
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
              >
                {employeeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {(search || fromDate || toDate || selectedEmp !== "ALL") && (
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("")
                setFromDate("")
                setToDate("")
                setSelectedEmp("ALL")
              }}
            >
              Reset
            </Button>
          )}
        </div>
        {filteredRows.length ? (
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
                {filteredRows.map((row, index) => (
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
                    <td>{productsTotals.qty}</td>
                    <td>{productsTotals.amount}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          <EmptyState query={search} onClear={() => setSearch("")} />
        )}
        <div className="report-foot">
          <span>
            Internal operational report · {filteredRows.length} rows shown
          </span>
          <span>Page 1 of 1</span>
        </div>
      </section>
    </div>
  )
}
