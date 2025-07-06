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
          setLoading(false);
        }
      };

      // Load messages immediately
      loadMessages();

      // Set up real-time subscription
      const unsubscribe = subscribeToMessages();
      
      return () => {
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
      
      // Fetch messages without sender data to avoid timeout
      const { data, error } = await Promise.race([
        supabase
          .from('messages')
          .select('id, content, created_at, sender_id, type, mood')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: false })
          .limit(50),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 30000) // Increased to 30 seconds
        )
      ]) as any;

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Fetch sender info separately
        const senderIds = [...new Set(data.map(msg => msg.sender_id))];
        const { data: senders } = await supabase
          .from('users')
          .select('id, name, username, avatar_url')
          .in('id', senderIds);

        // Map sender data to messages
        const messagesWithSenders = data.map(msg => ({
          ...msg,
          sender: senders?.find(sender => sender.id === msg.sender_id)
        }));

        // Reverse the array to show messages in chronological order (oldest first)
        setMessages(messagesWithSenders.reverse());
      } else {
        setMessages([]);
      }
      console.log('✅ Messages fetched successfully:', data?.length || 0);
      
    } catch (error: any) {
      console.error('❌ Error fetching messages:', error);
      
      if (error.message?.includes('timeout') || error.code === '57014') {
        console.warn('⚠️ Message loading timed out, trying simpler query...');
        
        // Fallback to simpler query without joins
        try {
          const { data: simpleData, error: simpleError } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id, type, mood')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false })
            .limit(30);

          if (simpleError) throw simpleError;

          // Fetch sender info separately
          if (simpleData && simpleData.length > 0) {
            const senderIds = [...new Set(simpleData.map(msg => msg.sender_id))];
            const { data: senders } = await supabase
              .from('users')
              .select('id, name, username, avatar_url')
              .in('id', senderIds);

            const messagesWithSenders = simpleData.map(msg => ({
              ...msg,
              sender: senders?.find(sender => sender.id === msg.sender_id)
            }));

            setMessages(messagesWithSenders.reverse());
            console.log('✅ Messages fetched with fallback query');
          } else {
            setMessages([]);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
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
            // Fetch the complete message with sender info
            const { data } = await supabase
              .from('messages')
              .select('id, content, created_at, sender_id, type, mood')
              .eq('id', payload.new.id)
              .maybeSingle();

            if (data) {
              // Fetch sender info separately
              const { data: sender } = await supabase
                .from('users')
                .select('id, name, username, avatar_url')
                .eq('id', data.sender_id)
                .single();

              const messageWithSender = {
                ...data,
                sender
              };

              setMessages(prev => {
                // Remove any optimistic message with the same content and sender
                const filteredPrev = prev.filter(msg => {
                  if (msg.id.startsWith('temp-') && 
                      msg.content === messageWithSender.content && 
                      msg.sender_id === messageWithSender.sender_id) {
                    return false;
                  }
                  return true;
                });
                
                // Check if message already exists to prevent duplicates
                const exists = filteredPrev.some(msg => msg.id === messageWithSender.id);
                if (exists) return filteredPrev;
                
                return [...filteredPrev, messageWithSender];
              });
            }
          } catch (error) {
            console.error('❌ Error fetching new message details:', error);
          }
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

    // Send to database with reduced timeout
    try {
      console.log('🚀 Sending message to database...');
      
      const { data, error } = await Promise.race([
        supabase
          .from('messages')
          .insert({
            chat_id: chatId,
            sender_id: user.id,
            content: trimmedContent,
            type,
            mood,
          })
          .select('id, content, created_at, sender_id, type, mood')
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Message send timeout')), 30000) // Increased to 30 seconds
        )
      ]) as any;

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Message sent successfully:', data);

      // Add sender info manually since we can't fetch it in the insert query
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

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticId ? messageWithSender : msg
        )
      );

    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      
      // Mark message as failed
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

      // Auto-retry for timeout errors
      if (error.message?.includes('timeout')) {
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