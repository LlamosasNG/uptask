import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Project, Task, TaskFormData } from "@/types/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import TaskForm from "./TaskForm";
import { updateTask } from "@/api/TaskAPI";
import { toast } from "react-toastify";
import { queryKeys } from '@/api/queryKeys';
import Button from '../ui/Button';

type EditTaskModalProps = {
  data: Task;
  projectId: Project["_id"];
  taskId: Task["_id"];
};

export default function EditTaskModal({
  data,
  projectId,
  taskId,
}: EditTaskModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormData>({
    defaultValues: {
      name: data.name,
      description: data.description,
      assignee: data.assignee?._id ?? null,
      dueDate: data.dueDate?.slice(0, 10) ?? null,
      priority: data.priority ?? 'medium',
    },
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: updateTask,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(projectId, taskId) });
      toast.success(data);
      reset();
      navigate(location.pathname, { replace: true });
    },
  });

  const handleEditTask = (formData: TaskFormData) => {
    const data = {
      projectId,
      taskId,
      formData,
    };
    mutate(data);
  };

  return (
    <Transition appear show={true} as={Fragment}>
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
                  Editar Tarea
                </DialogTitle>

                <p className="mt-3 text-slate-600">
                  Realiza cambios a una tarea en {""}
                  <span>este formulario</span>
                </p>

                <form
                  className="mt-6 space-y-6"
                  noValidate
                  onSubmit={handleSubmit(handleEditTask)}
                >
                  <TaskForm errors={errors} register={register} control={control} />
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
  );
}
