import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProjectsById } from "@/api/ProjectAPI";

export default function EditProjectView() {
  const params = useParams();
  const projectId = params.projectId!;

  const { data } = useQuery({
    queryKey: ["editProject", projectId],
    queryFn: () => getProjectsById(projectId),
  });

  console.log(data);

  return <div>EditProjectView</div>;
}
