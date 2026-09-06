import { Component, type ReactNode } from 'react'

type RouteErrorBoundaryProps = {
  children: ReactNode
  onReload?: () => void
}

type RouteErrorBoundaryState = {
  failed: boolean
}

export default class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { failed: true }
  }

  private reload = () => {
    if (this.props.onReload) {
      this.props.onReload()
      return
    }
    window.location.reload()
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <section
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
            role="alert"
          >
            <h1 className="text-2xl font-bold text-slate-900">
              No pudimos cargar esta página
            </h1>
            <p className="mt-3 text-slate-600">
              Intenta recargar para continuar.
            </p>
            <button
              className="mt-6 rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
              onClick={this.reload}
              type="button"
            >
              Recargar página
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
