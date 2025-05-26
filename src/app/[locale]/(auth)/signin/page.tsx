import { SignInForm } from '@/components/auth/SignInForm';
import { getCurrentUser } from '@/services/profile-service';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/');
  }
  return (
    <>
      <SignInForm />
    </>
  );
}
