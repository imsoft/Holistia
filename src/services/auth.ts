'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabaseServer';
import { cookies, headers } from 'next/headers';
import { User } from '@/types/database.types';
type SignInFormValues = {
  email: string;
  password: string;
};
// ACTION FROM LOGIN --> SIGNIN
export async function signIn(credentials: SignInFormValues) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return {
      status: error?.message,
      message: error.message,
    };
  }
  revalidatePath('/', 'layout');
  return { status: 'success' };
}

type SignUpFormValues = {
  name: string;
  email: string;
  password: string;
};

// ACTION FROM LOGIN --> SIGNUP
export async function signUp(credentials: SignUpFormValues) {
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        username: credentials.name,
      },
    },
  });

  if (error) {
    return {
      status: error?.message,
      message: error.message,
    };
  } else if (data?.user?.identities?.length === 0) {
    return {
      status: 'el usuario con este email ya existe',
      user: null,
    };
  } else {
    if (data.user) {
      await supabase.from('users').insert([
        {
          id: data.user.id,
          role: 'user',
          name: credentials.name,
        },
      ]);
      return { status: 'success', user: data.user };
    }
  }
  revalidatePath('/', 'layout');
  return { status: 'success', user: data.user };
}

//ACTION FROM SIGIN WITH GOOGLE
export async function signInWithGoogle() {
  const origin = (await headers()).get('origin');
  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) {
    redirect('/signin');
  } else if (data.url) {
    return redirect(data.url);
  }
}

//ACTION FROM SIGNOUT
export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();
  const cookieStore = await cookies();
  if (error) {
    return error;
  } else {
    cookieStore.set('sb-hdwyugqswocsfhzsrdxj-auth-token', '', {
      path: '/',
      maxAge: 0,
    });
    cookieStore.set('sb-refresh-token', '', {
      path: '/',
      maxAge: 0,
    });
  }
  /*
  revalidatePath('/', 'layout');
  redirect('/signin');*/
}
export async function getCurrentUser(): Promise<{
  user: User | null;
  error: Error | null;
}> {
  const serverClient = await createClient();

  const {
    data: { user },
    error,
  } = await serverClient.auth.getUser();

  return {
    user: user,
    error,
  };
}
