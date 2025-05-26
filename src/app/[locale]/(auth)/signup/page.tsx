import { SignUpForm } from '@/components/auth/SignUpForm';
import { getCurrentUser } from '@/services/profile-service';
import { redirect } from 'next/navigation';

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/');
  }
  return (
    <>
      <SignUpForm />
    </>
  );
}
