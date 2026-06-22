import { UserConnectionsView } from '@/components/user/UserConnectionsView';

export default function FollowingPage({ params }: { params: { username: string } }) {
  return <UserConnectionsView username={params.username} tab="following" />;
}