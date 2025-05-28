import { getCurrentUser } from '@/services/profile-service';
import { redirect } from 'next/navigation';
import { ResetPassword } from '@/components/auth/ResetPassword';

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/');
  }
  return (
    <>
      <ResetPassword />
    </>
  );
}
