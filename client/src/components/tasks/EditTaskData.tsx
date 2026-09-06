import { Navigate, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTaskById } from "@/api/TaskAPI";
import EditTaskModal from "./EditTaskModal";
import { queryKeys } from '@/api/queryKeys'
import AsyncState from '@/components/AsyncState'
import { normalizeApiError } from '@/api/errors'

export default function EditTaskData() {
  const params = useParams();
  const projectId = params.projectId!;

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const taskId = queryParams.get("editTask")!;

  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: queryKeys.tasks.detail(projectId, taskId),
    queryFn: () => getTaskById({ projectId, taskId }),
    enabled: !!taskId,
    retry: false,
  });

  if (isLoading)
    return <AsyncState data={data} error={null} isLoading empty={null}>{() => null}</AsyncState>
  if (isError && normalizeApiError(error).status === 404) return <Navigate to={"/404"} />;
  if (isError)
    return (
      <AsyncState data={data} error={error} isLoading={false} empty={null} onRetry={() => void refetch()}>
        {() => null}
      </AsyncState>
    )
  if (data)
    return <EditTaskModal data={data} projectId={projectId} taskId={taskId} />;
}
