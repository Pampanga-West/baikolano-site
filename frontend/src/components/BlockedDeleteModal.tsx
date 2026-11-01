import Button from "./Button"
import Icon from "./Icon"
import ModalShell from "./ModalShell"

export default function BlockedDeleteModal({
  record,
  close,
}: {
  record: string
  close: () => void
}) {
  return (
    <ModalShell
      title="Record cannot be deleted"
      subtitle={record}
      close={close}
      footer={<Button onClick={close}>Return to records</Button>}
    >
      <div className="blocked-message">
        <Icon name="shield" />
        <div>
          <b>Active child records reference this item.</b>
          <p>
            Remove or reassign those records first. No changes were made, and
            this attempt remains visible in the audit trail.
          </p>
        </div>
      </div>
    </ModalShell>
  )
}
