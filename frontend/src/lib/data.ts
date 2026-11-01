import type { AppView, IconName, Role } from "./types"

export const modules: {
  name: string
  icon: IconName
  detail: string
  accent: string
  target: AppView
}[] = [
  {
    name: "Customers",
    icon: "users",
    detail: "1,248 active accounts",
    accent: "blue",
    target: "customers",
  },
  {
    name: "Products",
    icon: "package",
    detail: "386 items in catalog",
    accent: "green",
    target: "products",
  },
  {
    name: "Human Resources",
    icon: "briefcase",
    detail: "74 team members",
    accent: "amber",
    target: "hr",
  },
  {
    name: "Sales",
    icon: "report",
    detail: "$84.2k this month",
    accent: "violet",
    target: "sales",
  },
  {
    name: "Reports",
    icon: "report",
    detail: "7 operational reports",
    accent: "blue",
    target: "reports",
  },
]

export const roleData: Record<Role, {
  name: string
  initials: string
  banner: string
}> = {
  Superadmin: {
    name: "Phil Hitalia",
    initials: "PH",
    banner:
      "You have full system access. You can manage all modules and assign roles to any user.",
  },
  Admin: {
    name: "Phil Hitalia",
    initials: "PH",
    banner:
      "You can manage most modules and user rights (except Superadmin accounts).",
  },
  User: {
    name: "Phil Hitalia",
    initials: "PH",
    banner:
      "You have access to the core modules assigned to you. Contact an Admin for elevated permissions.",
  },
}

export const stats = [
  {
    label: "Total Customers",
    value: "1,248",
    change: "+8.2%",
    icon: "users" as IconName,
    accent: "blue",
  },
  {
    label: "Products",
    value: "386",
    change: "+12 this month",
    icon: "package" as IconName,
    accent: "green",
  },
  {
    label: "Open Orders",
    value: "94",
    change: "18 due today",
    icon: "briefcase" as IconName,
    accent: "amber",
  },
  {
    label: "Revenue MTD",
    value: "$84.2k",
    change: "+12.5%",
    icon: "report" as IconName,
    accent: "violet",
  },
]

export const rightsGroups = [
  {
    title: "Customer Management",
    count: 3,
    rights: ["Add Customer", "Edit Customer", "Delete Customer"],
  },
  {
    title: "Product Management",
    count: 6,
    rights: [
      "Add Product",
      "Edit Product",
      "Delete Product",
      "Add Price",
      "Edit Price",
      "Delete Price",
    ],
  },
  {
    title: "Human Resources",
    count: 13,
    rights: [
      "Add Job",
      "Edit Job",
      "Delete Job",
      "Add Department",
      "Edit Department",
      "Delete Department",
      "Add Employee",
      "Edit Employee",
      "Delete Employee",
      "View Job History",
      "Add Job History",
      "Edit Job History",
      "Delete Job History",
    ],
  },
  {
    title: "Sales",
    count: 7,
    rights: [
      "Add Sale",
      "Edit Sale",
      "Delete Sale",
      "View Sale Detail",
      "Add Sale Detail",
      "Edit Sale Detail",
      "Delete Sale Detail",
    ],
  },
  {
    title: "Reports",
    count: 7,
    rights: [
      "Top Customers",
      "Product Master List",
      "Top Products",
      "Active Employees",
      "All Employees",
      "Employee Job History",
      "Top Sales",
    ],
  },
]
