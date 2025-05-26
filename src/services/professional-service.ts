import { supabase } from '@/lib/supabaseClient';
import type {
  Profile,
  UserPreference,
  User,
  Professional,
} from '@/types/database.types';

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user as User | null;
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data as Profile;
}

export async function updateUserProfile(
  userId: string,
  profileData: Partial<Profile>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data as Profile;
}

export async function createUserProfile(
  profileData: Partial<Profile>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }

  return data as Profile;
}

export async function getUserPreferences(
  userId: string
): Promise<UserPreference | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // No data found is not an error
    console.error('Error fetching preferences:', error);
    return null;
  }

  return data as UserPreference;
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreference>
): Promise<UserPreference> {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...preferences })
    .select()
    .single();

  if (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }

  return data as UserPreference;
}

export async function getProfessionals(limit: number = 20, offset: number = 0) {
  const { data, error } = await supabase
    .from('professional_profiles')
    .select('*')
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching professionals:', error);
    return [];
  }

  return data || [];
}

export async function getProfessional(id: string) {
  const { data, error } = await supabase
    .from('professional_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching professional:', error);
    return null;
  }

  return data;
}

export async function getProfessionalContact(id: string) {
  const { data, error } = await supabase
    .from('professional_contacts')
    .select('*')
    .eq('professional_id', id)
    .single();

  if (error) {
    console.error('Error fetching professional contact:', error);
    return null;
  }

  return data;
}

export async function getProfessionalServices(id: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('professional_id', id);

  if (error) {
    console.error('Error fetching professional services:', error);
    return [];
  }

  return data || [];
}

export async function createProfessional(professional: Partial<Professional>) {
  const { data, error } = await supabase
    .from('professional_profiles')
    .insert(professional)
    .select()
    .single();

  if (error) {
    console.error('Error creating professional:', error);
    throw error;
  }

  return data;
}

export async function updateProfessional(
  id: string,
  updates: Partial<Professional>
) {
  const { data, error } = await supabase
    .from('professional_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating professional:', error);
    throw error;
  }

  return data;
}

export async function uploadProfessionalImage(
  professionalId: string,
  file: File
) {
  const filePath = `professionals/${professionalId}/profile-${Date.now()}`;

  const { data, error } = await supabase.storage
    .from('professional_images')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('professional_images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl || null;
}

export async function uploadProfessionalCoverImage(
  professionalId: string,
  file: File
) {
  const filePath = `professionals/${professionalId}/cover-${Date.now()}`;

  const { data, error } = await supabase.storage
    .from('professional_images')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading cover image:', error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('professional_images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl || null;
}

export const professionalService = {
  getProfessional,
  getProfessionalContact,
  getProfessionalServices,
  getProfessionals,
  createProfessional,
  updateProfessional,
  uploadProfessionalImage,
  uploadProfessionalCoverImage,
};
