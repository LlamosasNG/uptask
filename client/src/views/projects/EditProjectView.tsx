import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProjectById } from "@/api/ProjectAPI";
import EditProjectForm from "@/components/projects/EditProjectForm";
import AsyncState from '@/components/AsyncState'
import { queryKeys } from '@/api/queryKeys'
import { normalizeApiError } from '@/api/errors'

export default function EditProjectView() {
  const params = useParams();
  const projectId = params.projectId!;

  const { data, error, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.projects.edit(projectId),
    queryFn: () => getProjectById(projectId),
  });

  if (isLoading) return <AsyncState data={data} error={null} isLoading empty={null}>{() => null}</AsyncState>
  if (isError && normalizeApiError(error).status === 404) return <Navigate to="/404" />
  if (isError) return <AsyncState data={data} error={error} isLoading={false} empty={null} onRetry={() => void refetch()}>{() => null}</AsyncState>
  if(data) return <EditProjectForm data={data} projectId={projectId}/>
} 
