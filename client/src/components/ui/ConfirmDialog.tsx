import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Description,
} from '@headlessui/react'
import { useRef } from 'react'
import Button from './Button'

export default function ConfirmDialog({
  open,
  title,
  description,
  pending = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  pending?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) onCancel()
      }}
      initialFocus={cancelRef}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-slate-950/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <DialogTitle className="text-xl font-bold text-slate-900">
            {title}
          </DialogTitle>
          <Description className="mt-3 break-words text-slate-600">
            {description}
          </Description>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              ref={cancelRef}
              variant="secondary"
              disabled={pending}
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button variant="danger" disabled={pending} onClick={onConfirm}>
              {pending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
