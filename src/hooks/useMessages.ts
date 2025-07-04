import { useState, useEffect } from 'react';
import { supabase, Message } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useMessages(chatId: string | null) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chatId && user) {
      setMessages([]); // Clear messages when switching chats
      setLoading(true);
      
      const loadMessages = async () => {
        try {
          await fetchMessages();
        } catch (error) {
          console.error('Error in loadMessages:', error);
        }
      };

      // ✅ Load messages once immediately
      loadMessages();

      // ⏰ Set up polling every 5 seconds as backup
      const interval = setInterval(loadMessages, 5000);

      // Set up real-time subscription
      const unsubscribe = subscribeToMessages();
      
      return () => {
        clearInterval(interval);
        unsubscribe();
      };
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [chatId, user]);

  const fetchMessages = async () => {
    if (!chatId) return;

    try {
      console.log('🔄 Fetching messages for chat:', chatId);
      
      // Create a timeout promise that rejects after 45 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout - taking too long to fetch messages')), 45000);
      });

      // Race between the actual query and timeout
      const queryPromise = supabase
        .from('messages')
        .select('id, content, created_at, sender_id, type, mood, sender:users(id, name, username, avatar_url)')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        // Handle specific timeout errors
        if (error.code === '57014' || error.message?.includes('statement timeout')) {
          console.warn('⚠️ Database query timeout, retrying with smaller limit...');
          
          // Retry with smaller limit and simpler query
          const { data: retryData, error: retryError } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id, type, mood')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false })
            .limit(20);

          if (retryError) {
            throw new Error(`Failed to fetch messages after retry: ${retryError.message}`);
          }

          // Fetch sender info separately for retry data
          if (retryData && retryData.length > 0) {
            const senderIds = [...new Set(retryData.map(msg => msg.sender_id))];
            const { data: senders } = await supabase
              .from('users')
              .select('id, name, username, avatar_url')
              .in('id', senderIds);

            const messagesWithSenders = retryData.map(msg => ({
              ...msg,
              sender: senders?.find(sender => sender.id === msg.sender_id)
            }));

            setMessages(messagesWithSenders.reverse());
          } else {
            setMessages([]);
          }
          
          console.log('✅ Messages fetched successfully after retry');
          return;
        }
        
        throw error;
      }
      
      // Reverse the array to show messages in chronological order (oldest first)
      setMessages(data ? data.reverse() : []);
      console.log('✅ Messages fetched successfully:', data?.length || 0);
      
    } catch (error: any) {
      console.error('❌ Error fetching messages:', error);
      
      // Show user-friendly error message based on error type
      if (error.message?.includes('timeout') || error.code === '57014') {
        console.warn('⚠️ Message loading is taking longer than expected');
        // Don't throw here, just log the warning
      } else if (error.message?.includes('Failed to fetch')) {
        console.error('❌ Network error while fetching messages');
      } else {
        console.error('❌ Unexpected error:', error.message);
      }
      
      // Set empty messages array on error to prevent infinite loading
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!chatId) return () => {};

    console.log('🔄 Subscribing to messages for chat:', chatId);

    const subscription = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          console.log('🔄 New message received via real-time:', payload);
          
          try {
            // Fetch the complete message with sender info using optimized query
            const { data } = await supabase
              .from('messages')
              .select('id, content, created_at, sender_id, type, mood, sender:users(id, name, username, avatar_url)')
              .eq('id', payload.new.id)
              .maybeSingle();

            if (data) {
              setMessages(prev => {
                // Remove any optimistic message with the same content and sender
                const filteredPrev = prev.filter(msg => {
                  if (msg.id.startsWith('temp-') && 
                      msg.content === data.content && 
                      msg.sender_id === data.sender_id) {
                    return false;
                  }
                  return true;
                });
                
                // Check if message already exists to prevent duplicates
                const exists = filteredPrev.some(msg => msg.id === data.id);
                if (exists) return filteredPrev;
                
                return [...filteredPrev, data];
              });
            }
          } catch (error) {
            console.error('❌ Error fetching new message details:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          console.log('🔄 Message updated via real-time:', payload);
          
          try {
            // Fetch the complete updated message with sender info using optimized query
            const { data } = await supabase
              .from('messages')
              .select('id, content, created_at, sender_id, type, mood, sender:users(id, name, username, avatar_url)')
              .eq('id', payload.new.id)
              .maybeSingle();

            if (data) {
              setMessages(prev => 
                prev.map(msg => msg.id === data.id ? data : msg)
              );
            }
          } catch (error) {
            console.error('❌ Error fetching updated message details:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('🔄 Message deleted via real-time:', payload);
          setMessages(prev => 
            prev.filter(msg => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe((status) => {
        console.log('🔄 Messages subscription status:', status);
      });

    return () => {
      console.log('🔄 Unsubscribing from messages');
      subscription.unsubscribe();
    };
  };

  const sendMessage = async (
    content: string,
    type: 'text' | 'image' | 'ai' = 'text',
    mood: 'happy' | 'sad' | 'angry' | 'anxious' | 'neutral' = 'neutral'
  ) => {
    if (!chatId || !user || !content.trim()) return;

    const trimmedContent = content.trim();
    const optimisticId = `temp-${Date.now()}-${Math.random()}`;
    const now = new Date().toISOString();

    // Create optimistic message for immediate UI feedback
    const optimisticMessage: Message = {
      id: optimisticId,
      chat_id: chatId,
      sender_id: user.id,
      content: trimmedContent,
      type,
      mood,
      created_at: now,
      sender: {
        id: user.id,
        email: user.email || '',
        name: profile?.name || 'You',
        username: profile?.username || '',
        avatar_url: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        status_message: profile?.status_message || '',
        last_active: now,
        created_at: profile?.created_at || now
      }
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    // Send to database with proper error handling and timeout
    try {
      console.log('🚀 Sending message to database...');
      
      // Create timeout for message sending
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Message send timeout')), 30000);
      });

      const insertPromise = supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: trimmedContent,
          type,
          mood,
        })
        .select('id, content, created_at, sender_id, type, mood, sender:users(id, name, username, avatar_url)')
        .single();

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Message sent successfully:', data);

      // Replace optimistic message with real one immediately
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticId ? data : msg
        )
      );

    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      
      // Mark message as failed with retry option
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticId 
            ? { 
                ...msg, 
                id: `failed-${optimisticId}`, 
                content: `❌ Failed to send: ${trimmedContent}`,
                type: 'text' as const
              }
            : msg
        )
      );

      // Auto-retry after 2 seconds for timeout errors
      if (error.message?.includes('timeout') || error.code === '57014') {
        setTimeout(() => {
          console.log('🔄 Auto-retrying failed message...');
          retryMessage(trimmedContent, type, mood, optimisticId);
        }, 2000);
      }
    }
  };

  const retryMessage = async (
    content: string,
    type: 'text' | 'image' | 'ai',
    mood: 'happy' | 'sad' | 'angry' | 'anxious' | 'neutral',
    originalOptimisticId: string
  ) => {
    if (!chatId || !user) return;

    const failedId = `failed-${originalOptimisticId}`;
    
    // Update message to show retrying state
    setMessages(prev => 
      prev.map(msg => 
        msg.id === failedId 
          ? { ...msg, content: `🔄 Retrying: ${content}` }
          : msg
      )
    );

    try {
      // Use simpler insert without complex joins for retry
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content,
          type,
          mood,
        })
        .select('id, content, created_at, sender_id, type, mood')
        .single();

      if (error) throw error;

      console.log('✅ Retry successful:', data);

      // Add sender info manually for retry
      const messageWithSender = {
        ...data,
        sender: {
          id: user.id,
          email: user.email || '',
          name: profile?.name || 'You',
          username: profile?.username || '',
          avatar_url: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          status_message: profile?.status_message || '',
          last_active: new Date().toISOString(),
          created_at: profile?.created_at || new Date().toISOString()
        }
      };

      // Replace failed message with successful one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === failedId ? messageWithSender : msg
        )
      );

    } catch (error) {
      console.error('❌ Retry failed:', error);
      
      // Mark as permanently failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === failedId 
            ? { ...msg, content: `💀 Failed permanently: ${content}` }
            : msg
        )
      );
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
}