import { deleteNote } from '@/api/NoteAPI'
import { useAuth } from '@/hooks/useAuth'
import { Note } from '@/types/index'
import { formatDate } from '@/utils/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import LoadingApp from '../LoadingApp'
import { queryKeys } from '@/api/queryKeys'
import { useState } from 'react'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'

type NoteDetailProps = {
  note: Note
}

export default function NoteDetail({ note }: NoteDetailProps) {
  const params = useParams()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const projectId = params.projectId!
  const taskId = queryParams.get('viewTask')!

  const { data, isLoading } = useAuth()
  const canDelete = data?._id === note.createdBy._id
  const [confirmDelete, setConfirmDelete] = useState(false)

  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: deleteNote,
    onError: (error) => toast.error(error.message),
    onSuccess: (data) => {
      setConfirmDelete(false)
      toast.success(data)
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(projectId, taskId) })
    },
  })

  if (isLoading) return <LoadingApp />
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="min-w-0 break-words">
        <p>
          {note.content} por:{' '}
          <span className="font-bold">{note.createdBy.name}</span>
        </p>
        <p className="text-xs text-slate-500">{formatDate(note.createdAt)}</p>
      </div>

      {canDelete && (
        <Button
          variant="danger"
          onClick={() => setConfirmDelete(true)}
        >
          Eliminar
        </Button>
      )}
      <ConfirmDialog open={confirmDelete} title="Eliminar nota" description={`Se eliminará la nota “${note.content}”. Esta acción no se puede deshacer.`} pending={isPending} onCancel={() => setConfirmDelete(false)} onConfirm={() => mutate({ projectId, taskId, noteId: note._id })} />
    </div>
  )
}
