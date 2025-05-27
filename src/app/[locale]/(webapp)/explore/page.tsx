import { Explore } from '@/components/webapp/explore/Explore';
import { getCurrentUser } from '@/services/profile-service';
import { redirect } from 'next/navigation';

type Users = {
  id: string;
  email: string;
};
export default async function ExplorePage() {
  const res = await getCurrentUser();

  if (!res) {
    redirect('/');
  }
  /*const user: Users = {
    id: res.id,
    email: res.email!,
  };*/
  return (
    <>
      <Explore } />
    </>
  );
}
