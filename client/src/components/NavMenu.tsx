import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react'
import { Bars3Icon } from '@heroicons/react/20/solid'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { User } from '../types'
import { endAuthSession } from '@/lib/authSession'

type NavMenuProps = {
  name: User['name']
}
export default function NavMenu({ name }: NavMenuProps) {
  const logout = async () => {
    await endAuthSession()
  }

  return (
    <Popover className="relative">
      <PopoverButton aria-label="Abrir menú de usuario" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-violet-700 text-white hover:bg-violet-800 cursor-pointer">
        <Bars3Icon className="w-8 h-8 text-white " />
      </PopoverButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel className="absolute right-0 z-30 mt-3 w-64 max-w-[calc(100vw-2rem)]">
          <div className="rounded-xl bg-white p-4 text-sm font-semibold leading-6 text-slate-800 shadow-lg ring-1 ring-slate-200">
            <p className="mb-2">Hola: {name}</p>
            <Link
              to="/profile"
              className="block p-2 hover:bg-gray-300 rounded-sm"
            >
              Mi Perfil
            </Link>
            <Link to="/" className="block p-2 hover:bg-gray-300 rounded-sm">
              Mis Proyectos
            </Link>
            <button
              className="block p-2 cursor-pointer hover:bg-purple-400 w-full rounded-sm"
              type="button"
              onClick={logout}
            >
              Cerrar Sesión
            </button>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
