import { ForgotPassword } from '@/components/auth/ForgotPassword';
import { getCurrentUser } from '@/services/profile-service';
import { redirect } from 'next/navigation';

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/');
  }
  return (
    <>
      <ForgotPassword />
    </>
  );
}
