export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`logo ${dark ? "logo-dark" : ""}`}>
      <span className="logo-mark">H</span>
      <span>
        Hope, Inc. <b>ERP</b>
      </span>
    </div>
  )
}
