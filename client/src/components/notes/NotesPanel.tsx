import { Task } from '../../types/index'
import AddNoteForm from './AddNoteForm'
import NoteDetail from './NoteDetail'

type NotesPanelProps = {
  notes: Task['notes']
}

export default function NotesPanel({ notes }: NotesPanelProps) {
  return (
    <>
      <AddNoteForm />
      <div className="mt-6 space-y-3">
        {notes.length ? (
          <>
            <p className="my-4 text-lg font-semibold text-slate-800">Notas:</p>
            {notes.map((note) => (
              <NoteDetail key={note._id} note={note}/>
            ))}
          </>
        ) : (
          <p className="text-gray-500 text-center pt-3">No hay notas</p>
        )}
      </div>
    </>
  )
}
