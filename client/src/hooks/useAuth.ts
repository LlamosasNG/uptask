import { getUser } from '@/api/AuthAPI'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'

export const useAuth = () => {
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: getUser,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  return { data, error, isError, isLoading, refetch }
}
