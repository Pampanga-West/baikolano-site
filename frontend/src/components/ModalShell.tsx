import type { ReactNode } from "react"
import Icon from "./Icon"

export default function ModalShell({
  title,
  subtitle,
  children,
  footer,
  close,
  wide = false,
  className = "",
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  close: () => void
  wide?: boolean
  className?: string
}) {
  return (
    <div className="modal-backdrop">
      <section
        className={`module-modal ${
          wide ? "module-modal-wide" : ""
        } ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="module-modal-head">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={close} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="module-modal-body">{children}</div>
        {footer && <div className="module-modal-footer">{footer}</div>}
      </section>
    </div>
  )
}
