import type { ReactNode } from "react"

export default function Field({
  label,
  placeholder,
  type = "text",
  value,
  end,
  onChange,
}: {
  label: string
  placeholder?: string
  type?: string
  value?: string
  end?: ReactNode
  onChange?: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {end}
      </div>
    </label>
  )
}
