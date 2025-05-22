'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabaseServer';
import { headers } from 'next/headers';

// ACTION FROM LOGIN --> SIGNIN
export async function signIn(user: any) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(user);

  if (error) {
    return {
      status: error?.message,
      message: error.message,
    };
  }
  revalidatePath('/', 'layout');
  return { status: 'success' };
}

// ACTION FROM LOGIN --> SIGNUP
export async function signUp(user: any) {
  const supabase = await createClient();

  const credentials = {
    username: user.name,
    email: user.email,
    password: user.password,
  };

  const { error, data } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        username: credentials.username,
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
          name: user.name,
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
  if (error) {
    console.log(error);
  }
  revalidatePath('/', 'layout');
  redirect('/');
}
