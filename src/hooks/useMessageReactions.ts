import { useState, useEffect } from 'react';
import { supabase, MessageReaction } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useMessageReactions(messageId: string | null) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (messageId) {
      fetchReactions();
      const unsubscribe = subscribeToReactions();
      return unsubscribe;
    } else {
      setReactions([]);
    }
  }, [messageId]);

  const fetchReactions = async () => {
    if (!messageId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('message_reactions')
        .select(`
          *,
          user:users(id, name, username, avatar_url)
        `)
        .eq('message_id', messageId);

      if (error) throw error;
      setReactions(data || []);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToReactions = () => {
    if (!messageId) return () => {};

    const subscription = supabase
      .channel(`reactions:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`,
        },
        () => {
          fetchReactions(); // Refetch to get user data
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const addReaction = async (reaction: '👍' | '👎' | '❤️' | '😂' | '😮' | '😢' | '😡') => {
    if (!messageId || !user) return;

    try {
      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          reaction,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const removeReaction = async (reaction: '👍' | '👎' | '❤️' | '😂' | '😮' | '😢' | '😡') => {
    if (!messageId || !user) return;

    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction', reaction);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  const toggleReaction = async (reaction: '👍' | '👎' | '❤️' | '😂' | '😮' | '😢' | '😡') => {
    const existingReaction = reactions.find(r => r.user_id === user?.id && r.reaction === reaction);
    
    if (existingReaction) {
      await removeReaction(reaction);
    } else {
      await addReaction(reaction);
    }
  };

  const getReactionCounts = () => {
    const counts: Record<string, number> = {};
    reactions.forEach(reaction => {
      counts[reaction.reaction] = (counts[reaction.reaction] || 0) + 1;
    });
    return counts;
  };

  const getUserReactions = () => {
    return reactions
      .filter(r => r.user_id === user?.id)
      .map(r => r.reaction);
  };

  return {
    reactions,
    loading,
    addReaction,
    removeReaction,
    toggleReaction,
    getReactionCounts,
    getUserReactions,
  };
}