import { useState, useEffect } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import { supabase, User } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authInitialized = false;

    const initAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Test Supabase connection with reduced timeout
        try {
          const { error: healthError } = await Promise.race([
            supabase.from('users').select('count').limit(0),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection test timeout')), 8000) // Reduced to 8 seconds
            )
          ]) as any;
          
          if (healthError && !healthError.message.includes('JWT')) {
            throw new Error(`Supabase connection failed: ${healthError.message}`);
          }
          console.log('✅ Supabase connection verified');
        } catch (error: any) {
          console.error('❌ Supabase connection test failed:', error);
          if (error.message.includes('timeout')) {
            console.warn('Connection test timed out, but continuing with auth initialization...');
          } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot reach Supabase servers. Please check if the Supabase URL is correct and accessible.');
          } else {
            console.warn('Connection test failed, but continuing:', error.message);
          }
        }
        
        // Get initial session with reduced timeout
        const { data: { session }, error: sessionError } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session timeout')), 10000) // Reduced to 10 seconds
          )
        ]) as any;
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw sessionError;
        }

        console.log('✅ Session retrieved:', session ? 'Found' : 'None');
        
        if (mounted && !authInitialized) {
          authInitialized = true;
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Fetch profile in background, don't block loading
            fetchProfile(session.user.id).catch(error => {
              console.error('Background profile fetch failed:', error);
            });
          }
          
          setLoading(false);
        }
      } catch (error: any) {
        console.error('❌ Auth initialization error:', error);
        if (mounted && !authInitialized) {
          authInitialized = true;
          setLoading(false);
          
          // Show user-friendly error messages
          if (error.message.includes('Cannot reach Supabase')) {
            toast.error(error.message);
          } else if (error.message.includes('timeout')) {
            toast.error('Connection is taking longer than expected. Please check your internet connection.');
          } else {
            toast.error('Failed to initialize authentication. Please refresh the page.');
          }
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session ? 'User present' : 'No user');
        
        if (mounted) {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Fetch profile in background for auth changes too
            fetchProfile(session.user.id).catch(error => {
              console.error('Auth change profile fetch failed:', error);
            });
          } else {
            setProfile(null);
          }
          
          // Don't set loading to false here if already initialized
          if (!authInitialized) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔄 Fetching profile for user:', userId);
      
      // Test connection before fetching profile with reduced timeout
      try {
        const { data, error } = await Promise.race([
          supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 8000) // Reduced to 8 seconds
          )
        ]) as any;

        if (error) {
          console.error('❌ Profile fetch error:', error);
          
          // Handle specific error types
          if (error.message?.includes('JWT') || error.message?.includes('API key')) {
            console.log('🔄 Auth error during profile fetch, user might be signing up');
            return;
          }
          
          if (error.message?.includes('Failed to fetch')) {
            throw new Error('Cannot connect to Supabase. Please check your internet connection.');
          }
          
          throw error;
        }
        
        console.log('✅ Profile fetched:', data ? 'Found' : 'Not found');
        setProfile(data);
        
      } catch (fetchError: any) {
        if (fetchError.message.includes('timeout')) {
          throw new Error('Profile fetch timed out. Please check your internet connection.');
        } else if (fetchError.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to Supabase servers. Please verify your Supabase URL and internet connection.');
        }
        throw fetchError;
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching profile:', error);
      
      // Show appropriate error messages to user
      if (error.message.includes('Cannot connect to Supabase') || 
          error.message.includes('internet connection') ||
          error.message.includes('Supabase servers')) {
        toast.error(error.message);
      } else if (error.message.includes('timeout')) {
        console.log('Profile fetch timed out, will retry later');
        toast.error('Profile loading is taking longer than expected. Some features may be limited.');
      } else {
        // Only show non-timeout errors
        toast.error('Failed to load profile. Some features may be limited.');
      }
    }
  };

  // Subscribe to profile changes for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔄 Profile updated via real-time:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            setProfile(payload.new as User);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const signUp = async (email: string, password: string, name: string, username: string) => {
    try {
      console.log('🔄 Signing up user:', email);
      
      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (checkError && !checkError.message.includes('JWT')) {
        if (checkError.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to Supabase. Please check your internet connection.');
        }
        throw checkError;
      }

      if (existingUser) {
        throw new Error('Username is already taken. Please choose a different one.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to authentication service. Please check your internet connection.');
        }
        throw error;
      }

      if (data.user) {
        console.log('🔄 Creating user profile...');
        
        // Create user profile with retry logic
        const createProfile = async (retries = 3) => {
          try {
            const { error: profileError } = await supabase
              .from('users')
              .insert({
                id: data.user!.id,
                email,
                name,
                username,
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                status_message: 'Hey there! I\'m using this messaging app.',
              });

            if (profileError) {
              if (profileError.message.includes('Failed to fetch')) {
                throw new Error('Cannot connect to Supabase. Please check your internet connection.');
              }
              throw profileError;
            }
            
            console.log('✅ User profile created');
            
            // Fetch the created profile
            await fetchProfile(data.user!.id);
            
          } catch (error: any) {
            if (retries > 0 && (error.message?.includes('timeout') || error.message?.includes('Cannot connect'))) {
              console.log(`Retrying profile creation... ${retries} attempts left`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              return createProfile(retries - 1);
            }
            throw error;
          }
        };

        await createProfile();
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔄 Signing in user:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to authentication service. Please check your internet connection.');
        }
        throw error;
      }
      
      console.log('✅ User signed in');
      toast.success('Signed in successfully!');
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Handle the case where session doesn't exist (already logged out)
        if (error.message.includes('Session from session_id claim in JWT does not exist')) {
          console.log('Session already expired, clearing local state');
          setProfile(null);
          toast.success('Signed out successfully!');
          return;
        }
        
        if (error.message.includes('Failed to fetch')) {
          // If we can't reach the server to sign out, clear local state anyway
          console.log('Cannot reach server for sign out, clearing local state');
          setProfile(null);
          toast.success('Signed out locally (server unreachable)');
          return;
        }
        
        throw error;
      }
      setProfile(null);
      toast.success('Signed out successfully!');
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      toast.error(error.message);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');

      // If username is being updated, check if it's already taken
      if (updates.username && updates.username !== profile?.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('username')
          .eq('username', updates.username)
          .neq('id', user.id)
          .maybeSingle();

        if (checkError && !checkError.message.includes('JWT')) {
          if (checkError.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to Supabase. Please check your internet connection.');
          }
          throw checkError;
        }

        if (existingUser) {
          throw new Error('Username is already taken. Please choose a different one.');
        }
      }

      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          last_active: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to Supabase. Please check your internet connection.');
        }
        throw error;
      }
      
      // Update local state immediately for better UX
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };
}