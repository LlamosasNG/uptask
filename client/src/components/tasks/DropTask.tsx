import { useDroppable } from '@dnd-kit/core'

type DropTaskprops = {
  status: string
}

export default function DropTask({ status }: DropTaskprops) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  })

  const style = {
    opacity: isOver ? 0.4 : undefined,
  }
  return (
    <div
      style={style}
      ref={setNodeRef}
      className="grid min-h-11 place-content-center rounded-xl border border-dashed border-slate-300 p-2 text-xs font-medium text-slate-600"
    >
      {' '}
      Soltar Aquí
    </div>
  )
}
