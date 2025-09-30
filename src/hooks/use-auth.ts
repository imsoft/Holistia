import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error getting user:', error);
        } else {
          setUser(user);
        }
      } catch (error) {
        console.error('Error in useAuth:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  return { user, loading };
}
