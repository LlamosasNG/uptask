import { deleteNote } from '@/api/NoteAPI'
import { useAuth } from '@/hooks/useAuth'
import { Note } from '@/types/index'
import { formatDate } from '@/utils/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import LoadingApp from '../LoadingApp'

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

  const queryClient = useQueryClient()
  const { mutate } = useMutation({
    mutationFn: deleteNote,
    onError: (error) => toast.error(error.message),
    onSuccess: (data) => {
      toast.success(data)
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    },
  })

  if (isLoading) return <LoadingApp />
  return (
    <div className="p-3 flex justify-between items-center">
      <div>
        <p>
          {note.content} por:{' '}
          <span className="font-bold">{note.createdBy.name}</span>
        </p>
        <p className="text-xs text-slate-500">{formatDate(note.createdAt)}</p>
      </div>

      {canDelete && (
        <button
          type="button"
          className="bg-red-400 hover:bg-red-500 p-2 ml-2 text-xs text-white font-bold cursor-pointer transition-colors rounded-xs"
          onClick={() => mutate({ projectId, taskId, noteId: note._id })}
        >
          Eliminar
        </button>
      )}
    </div>
  )
}
