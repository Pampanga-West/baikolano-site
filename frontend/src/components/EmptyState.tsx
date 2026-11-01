import Button from "./Button"
import Icon from "./Icon"

export default function EmptyState({
  query,
  onClear,
}: {
  query: string
  onClear: () => void
}) {
  return (
    <div className="empty-state">
      <div className="empty-illustration">
        <span></span>
        <Icon name="search" size={25} />
      </div>
      <b>No matching records</b>
      <p>
        Nothing matches “{query}”. Try a different name, code, or clear the
        search.
      </p>
      <Button variant="secondary" onClick={onClear}>
        Clear search
      </Button>
    </div>
  )
}
