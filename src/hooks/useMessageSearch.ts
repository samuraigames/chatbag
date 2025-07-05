import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface SearchResult {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  chat_id: string;
  sender_name: string;
  chat_name: string;
}

export function useMessageSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchMessages = async (query: string, chatId?: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('search_messages', {
        search_query: query,
        chat_id_param: chatId || null,
        limit_param: 50
      });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error searching messages:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return {
    results,
    loading,
    searchMessages,
    clearResults,
  };
}