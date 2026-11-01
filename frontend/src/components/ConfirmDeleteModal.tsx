import Button from "./Button"
import Icon from "./Icon"
import ModalShell from "./ModalShell"

export default function ConfirmDeleteModal({
  record,
  noun,
  close,
  confirm,
}: {
  record: string
  noun: string
  close: () => void
  confirm: () => void
}) {
  return (
    <ModalShell
      title={`Delete ${record}?`}
      subtitle="This action uses soft-delete and can be reversed by an administrator."
      close={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm}>
            Delete {noun}
          </Button>
        </>
      }
    >
      <div className="confirm-message">
        <span>
          <Icon name="lock" />
        </span>
        <div>
          <b>This will mark the record as Inactive.</b>
          <p>
            It will disappear from standard User views but remain available to
            administrators for restoration and audit.
          </p>
        </div>
      </div>
    </ModalShell>
  )
}
