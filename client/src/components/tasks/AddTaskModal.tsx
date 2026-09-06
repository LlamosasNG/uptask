import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import TaskForm from "./TaskForm";
import { TaskFormData } from "@/types/index";
import { createTask } from "@/api/TaskAPI";
import { toast } from "react-toastify";
import { queryKeys } from '@/api/queryKeys';
import Button from '../ui/Button';

export default function AddTaskModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const modalTask = queryParams.get("newTask");
  const show = modalTask ? true : false;

  const params = useParams();
  const projectId = params.projectId!;

  const initialValues: TaskFormData = {
    name: "",
    description: "",
    assignee: null,
    dueDate: null,
    priority: 'medium',
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({ defaultValues: initialValues });

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: createTask,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      toast.success(data);
      reset();
      navigate(location.pathname, { replace: true });
    },
  });

  const handleForm = (formData: TaskFormData) => {
    const data = {
      formData,
      projectId,
    };
    mutate(data);
  };

  return (
    <>
      <Transition appear show={show} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => {
            navigate(location.pathname, { replace: true });
          }}
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
                    Nueva Tarea
                  </DialogTitle>

                  <p className="mt-3 text-slate-600">
                    Llena el formulario y crea {""}
                    <span>una tarea</span>
                  </p>

                  <form
                    className="mt-6 space-y-6"
                    noValidate
                    onSubmit={handleSubmit(handleForm)}
                  >
                    <TaskForm register={register} errors={errors} control={control} />
                    <div className="flex flex-wrap justify-end gap-3">
                      <Button variant="secondary" onClick={() => navigate(location.pathname, { replace: true })}>Cancelar</Button>
                      <Button type="submit" disabled={isPending}>{isPending ? 'Guardando…' : 'Guardar tarea'}</Button>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
