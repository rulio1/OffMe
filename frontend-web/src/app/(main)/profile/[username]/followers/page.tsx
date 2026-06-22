import { UserConnectionsView } from '@/components/user/UserConnectionsView';

export default function FollowersPage({ params }: { params: { username: string } }) {
  return <UserConnectionsView username={params.username} tab="followers" />;
}