import type { ReactNode } from "react"
import type { IconName } from "../lib/types"
import Icon from "./Icon"

export default function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark"
  icon?: IconName
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} size={17} />}
      <span>{children}</span>
    </button>
  )
}
