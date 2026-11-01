import type { ReactNode } from "react"

export default function Badge({
  children,
  kind,
}: {
  children: ReactNode
  kind: string
}) {
  return <span className={`badge badge-${kind.toLowerCase()}`}>{children}</span>
}
