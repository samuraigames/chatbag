import { useState, useEffect } from 'react';
import { supabase, UserPresence } from '../lib/supabase';
import { useAuth } from './useAuth';

export function usePresence() {
  const { user } = useAuth();
  const [presenceData, setPresenceData] = useState<Record<string, UserPresence>>({});

  useEffect(() => {
    if (!user) return;

    // Set user as online when they connect
    const setOnline = async () => {
      try {
        await supabase.rpc('update_user_presence', { status_param: 'online' });
      } catch (error) {
        console.error('Error setting online status:', error);
      }
    };

    setOnline();

    // Subscribe to presence changes
    const channel = supabase.channel('user-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        (payload) => {
          const presence = payload.new as UserPresence;
          if (presence) {
            setPresenceData(prev => ({
              ...prev,
              [presence.user_id]: presence
            }));
          }
        }
      )
      .subscribe();

    // Fetch initial presence data
    const fetchPresence = async () => {
      try {
        const { data } = await supabase
          .from('user_presence')
          .select('*');
        
        if (data) {
          const presenceMap = data.reduce((acc, presence) => {
            acc[presence.user_id] = presence;
            return acc;
          }, {} as Record<string, UserPresence>);
          setPresenceData(presenceMap);
        }
      } catch (error) {
        console.error('Error fetching presence:', error);
      }
    };

    fetchPresence();

    // Set user as offline when they disconnect
    const setOffline = async () => {
      try {
        await supabase.rpc('update_user_presence', { status_param: 'offline' });
      } catch (error) {
        console.error('Error setting offline status:', error);
      }
    };

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    // Handle beforeunload
    const handleBeforeUnload = () => {
      setOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      channel.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
    };
  }, [user]);

  const updatePresence = async (status: 'online' | 'offline' | 'away' | 'busy') => {
    try {
      await supabase.rpc('update_user_presence', { status_param: status });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const getUserPresence = (userId: string): UserPresence | null => {
    return presenceData[userId] || null;
  };

  const isUserOnline = (userId: string): boolean => {
    const presence = getUserPresence(userId);
    return presence?.status === 'online';
  };

  return {
    presenceData,
    updatePresence,
    getUserPresence,
    isUserOnline,
  };
}