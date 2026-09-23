import { Link, useNavigate } from "react-router-dom";
import ProjectForm from "./ProjectForm";
import { useForm } from "react-hook-form";
import { Project, ProjectFormData } from "@/types/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProject } from "@/api/ProjectAPI";
import { toast } from "react-toastify";
import { queryKeys } from '@/api/queryKeys';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';

type EditProjectFormProps = {
  data: ProjectFormData;
  projectId: Project["_id"];
};

export default function EditProjectForm({
  data,
  projectId,
}: EditProjectFormProps) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    defaultValues: {
      projectName: data.projectName,
      clientName: data.clientName,
      description: data.description,
    },
  });

  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: updateProject,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.edit(projectId) });
      toast.success(data);
      navigate("/");
    },
  });

  const handleForm = (formData: ProjectFormData) => {
    const data = {
      formData,
      projectId,
    };
    mutate(data);
  };

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Editar proyecto" description="Llena el siguiente formulario para editar el proyecto" actions={
          <Link
            className="btn btn-secondary"
            to={"/"}
          >
            Volver a proyectos
          </Link>
        } />
        <Card>
        <form
          className="space-y-5"
          onSubmit={handleSubmit(handleForm)}
          noValidate
        >
          <ProjectForm register={register} errors={errors} />
          <Button type="submit" className="w-full">Guardar cambios</Button>
        </form>
        </Card>
      </div>
    </>
  );
}
