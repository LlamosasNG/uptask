import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import ProjectForm from "@/components/projects/ProjectForm";
import { ProjectFormData } from "@/types/index";
import { createProject } from "@/api/ProjectAPI";
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function CreateProjectView() {
  const navigate = useNavigate();

  const initialValues: ProjectFormData = {
    projectName: "",
    clientName: "",
    description: "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({ defaultValues: initialValues });

  const { mutate } = useMutation({
    mutationFn: createProject,
    onError: (error) => {
      toast.error(error.message);
    }, 
    onSuccess: (data) => {  
      toast.success(data);
      navigate("/");
    },
  });

  const handleForm = (formData: ProjectFormData) => mutate(formData);

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Crear proyecto" description="Llena el siguiente formulario para crear un proyecto" actions={
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
          <Button type="submit" className="w-full">Crear proyecto</Button>
        </form>
        </Card>
      </div>
    </>
  );
}
