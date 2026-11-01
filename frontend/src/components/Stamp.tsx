export default function Stamp({
  action,
  user,
  date,
}: {
  action: string
  user: string
  date: string
}) {
  return (
    <span className="stamp">
      <b className={`stamp-${action.toLowerCase()}`}>{action}</b>
      <span>{user}</span>
      <small>{date}</small>
    </span>
  )
}
