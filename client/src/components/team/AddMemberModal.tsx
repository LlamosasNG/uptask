import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { Fragment } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AddMemberForm from './AddMemberForm'

export default function AddMemberModal() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryParams = new URLSearchParams(location.search)
  const addMember = queryParams.get('addMember')
  const show = addMember ? true : false

  return (
    <>
      <Transition appear show={show} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => navigate(location.pathname, { replace: true })}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-2xl transform rounded-2xl bg-white p-5 text-left shadow-xl transition-all sm:p-8">
                  <DialogTitle as="h3" className="text-2xl font-bold text-slate-900">
                    Agregar Integrante al equipo
                  </DialogTitle>
                  <p className="mt-3 text-slate-600">
                    Busca el nuevo integrante por email {''}
                    <span>
                      para agregarlo al proyecto
                    </span>
                  </p>
                  <AddMemberForm />
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
