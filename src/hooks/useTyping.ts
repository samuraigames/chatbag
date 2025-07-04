import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface TypingUser {
  id: string;
  name: string;
  avatar_url: string;
}

export function useTyping(chatId: string | null) {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSignalRef = useRef<number>(0);

  // Subscribe to typing events
  useEffect(() => {
    if (!chatId || !user) return;

    const channel = supabase.channel(`typing:${chatId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, user_name, user_avatar, is_typing } = payload.payload;
        
        // Ignore our own typing events
        if (user_id === user.id) return;

        setTypingUsers(prev => {
          if (is_typing) {
            // Add user to typing list if not already there
            const exists = prev.some(u => u.id === user_id);
            if (!exists) {
              return [...prev, { id: user_id, name: user_name, avatar_url: user_avatar }];
            }
            return prev;
          } else {
            // Remove user from typing list
            return prev.filter(u => u.id !== user_id);
          }
        });

        // Auto-remove typing indicator after 3 seconds of inactivity
        if (is_typing) {
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.id !== user_id));
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [chatId, user]);

  // Send typing indicator
  const sendTypingIndicator = (typing: boolean) => {
    if (!chatId || !user || !profile) return;

    const now = Date.now();
    
    // Throttle typing signals to avoid spam (max once per 500ms)
    if (typing && now - lastTypingSignalRef.current < 500) return;
    
    lastTypingSignalRef.current = now;

    supabase.channel(`typing:${chatId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: user.id,
        user_name: profile.name,
        user_avatar: profile.avatar_url,
        is_typing: typing
      }
    });
  };

  // Handle typing state changes
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 1000);
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    handleTyping,
    stopTyping
  };
}