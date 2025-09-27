
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useProfileUpdate } from './useProfileUpdate';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  // Use the profile update hook to handle tutor data
  useProfileUpdate(user);

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if email is verified
          const emailVerified = user.email_confirmed_at !== null;
          setIsEmailVerified(emailVerified);
          
          // Only set user if email is verified OR if they're on the verify page
          const isOnVerifyPage = window.location.pathname === '/verify';
          setUser(emailVerified || isOnVerifyPage ? user : null);
        } else {
          setUser(null);
          setIsEmailVerified(false);
        }
        
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const emailVerified = session.user.email_confirmed_at !== null;
          setIsEmailVerified(emailVerified);
          
          // Only set user if email is verified OR if they're on the verify page
          const isOnVerifyPage = window.location.pathname === '/verify';
          setUser(emailVerified || isOnVerifyPage ? session.user : null);
        } else {
          setUser(null);
          setIsEmailVerified(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, isEmailVerified };
};
