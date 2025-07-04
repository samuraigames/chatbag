import { useState, useEffect } from 'react';
import { supabase, Chat, ChatWithUsers, User } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatWithUsers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChats();
      const unsubscribe = subscribeToChats();
      return unsubscribe;
    } else {
      setChats([]);
      setLoading(false);
    }
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;

    try {
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch user details for each chat
      const chatsWithUsers = await Promise.all(
        chatsData.map(async (chat) => {
          const otherUserIds = chat.participants.filter(id => id !== user.id);
          
          if (otherUserIds.length > 0) {
            const { data: users } = await supabase
              .from('users')
              .select('*')
              .in('id', otherUserIds);

            return {
              ...chat,
              other_user: users?.[0],
              users: users || [],
            };
          }
          
          return chat;
        })
      );

      setChats(chatsWithUsers);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChats = () => {
    if (!user) return () => {};

    console.log('🔄 Subscribing to chat updates for user:', user.id);

    const subscription = supabase
      .channel(`user_chats:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `participants.cs.{${user.id}}`,
        },
        (payload) => {
          console.log('🔄 Chat update received:', payload);
          fetchChats(); // Refetch to get updated user data
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('🔄 New message received:', payload);
          const newMessage = payload.new as any;
          
          // Update the chat's last message and timestamp immediately
          setChats(prev => {
            const updatedChats = prev.map(chat => {
              if (chat.id === newMessage.chat_id) {
                return {
                  ...chat,
                  last_message: newMessage.content,
                  updated_at: newMessage.created_at
                };
              }
              return chat;
            });
            
            // Sort by updated_at to move the updated chat to the top
            return updatedChats.sort((a, b) => 
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log('🔄 User update received:', payload);
          // Update user info in chats when user profiles change
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedUser = payload.new as User;
            setChats(prev => 
              prev.map(chat => ({
                ...chat,
                other_user: chat.other_user?.id === updatedUser.id ? updatedUser : chat.other_user,
                users: chat.users?.map(u => u.id === updatedUser.id ? updatedUser : u) || []
              }))
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 Chat subscription status:', status);
      });

    return () => {
      console.log('🔄 Unsubscribing from chat updates');
      subscription.unsubscribe();
    };
  };

  const createChat = async (otherUserId: string) => {
    if (!user) return null;

    try {
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('chats')
        .select('*')
        .contains('participants', [user.id])
        .contains('participants', [otherUserId])
        .eq('is_group', false)
        .maybeSingle();

      if (existingChat) {
        return existingChat.id;
      }

      // Create new chat
      const { data, error } = await supabase
        .from('chats')
        .insert({
          participants: [user.id, otherUserId],
          is_group: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Don't refetch here - let real-time subscription handle it
      return data.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  };

  const searchUsers = async (query: string): Promise<User[]> => {
    if (!query.trim()) return [];

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('id', user?.id)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  return {
    chats,
    loading,
    createChat,
    searchUsers,
    refetch: fetchChats,
  };
}