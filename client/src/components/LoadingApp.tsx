import { ProgressBar } from 'react-loader-spinner'

export default function LoadingApp() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-2"
      role="status"
    >
      <ProgressBar
        height={80}
        width={120}
        borderColor="#a855f7"
        barColor="#c026d3"
        ariaLabel="Cargando proyectos y tareas"
        visible
      />
      <p className="text-sm font-semibold text-gray-500">
        Preparando tus proyectos y tareas…
      </p>
      <span className="sr-only">Cargando contenido</span>
    </div>
  )
}
