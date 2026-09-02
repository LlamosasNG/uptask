import AsyncState from '@/components/AsyncState'
import ProfileForm from '@/components/profile/ProfileForm'
import { useAuth } from '@/hooks/useAuth'

export default function ProfileView() {
  const { data, error, isLoading, refetch } = useAuth()
  if (isLoading)
    return <AsyncState data={data} error={null} isLoading empty={null}>{() => null}</AsyncState>
  if (error)
    return <AsyncState data={data} error={error} isLoading={false} empty={null} onRetry={() => void refetch()}>{() => null}</AsyncState>
  if (data) return <ProfileForm data={data} />
}
