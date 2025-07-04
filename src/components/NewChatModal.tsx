import React, { useState, useEffect } from 'react';
import { X, Search, MessageCircle, AtSign, Sparkles, Users, Zap } from 'lucide-react';
import { User } from '../lib/supabase';
import { useChats } from '../hooks/useChats';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export function NewChatModal({ isOpen, onClose, onChatCreated }: NewChatModalProps) {
  const { searchUsers, createChat } = useChats();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (userId: string) => {
    setCreating(userId);
    try {
      const chatId = await createChat(userId);
      if (chatId) {
        onChatCreated(chatId);
        onClose();
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setCreating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700/50 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <MessageCircle className="h-6 w-6 text-emerald-400 animate-pulse" />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Start New Chat
            </span>
            <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-full text-gray-400 transition-all duration-300 hover:scale-110 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col h-full max-h-[calc(90vh-100px)]">
          <div className="relative mb-6 flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for awesome people..."
              className="w-full pl-12 pr-4 py-3 bg-gray-700/50 backdrop-blur-sm text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-600/50 transition-all duration-300 hover:bg-gray-600/50 focus:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-gray-400 animate-pulse">Finding amazing people...</div>
              </div>
            ) : searchResults.length === 0 && searchQuery.trim() ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50 animate-bounce" />
                <p className="text-lg font-medium mb-2">No users found</p>
                <p className="text-sm">Try a different search term!</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="relative mb-6">
                  <MessageCircle className="h-20 w-20 mx-auto opacity-50 animate-bounce" />
                  <Sparkles className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
                </div>
                <p className="text-lg font-medium mb-2">Find Your Chat Buddy!</p>
                <p className="text-sm">Search by name, username, or email</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((user, index) => (
                  <button
                    key={user.id}
                    onClick={() => handleCreateChat(user.id)}
                    disabled={creating === user.id}
                    className="w-full p-4 hover:bg-gray-700/50 rounded-xl text-left transition-all duration-300 transform hover:scale-105 group relative overflow-hidden border border-gray-600/30 hover:border-emerald-500/50"
                    style={{
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    
                    <div className="flex items-center space-x-4 relative z-10">
                      <div className="relative">
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-12 h-12 rounded-full bg-gray-600 object-cover flex-shrink-0 transition-all duration-300 group-hover:scale-110 border-2 border-transparent group-hover:border-emerald-400/50"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
                          }}
                        />
                        {creating === user.id ? (
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse"></div>
                        ) : (
                          <Zap className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-white truncate group-hover:text-emerald-400 transition-colors duration-300">
                            {user.name}
                          </h3>
                          <div className="flex items-center text-gray-400 text-sm">
                            <AtSign className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{user.username}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-400 truncate group-hover:text-gray-300 transition-colors duration-300">
                          {user.email}
                        </p>
                        
                        {user.status_message && (
                          <p className="text-xs text-gray-500 truncate mt-1 flex items-center space-x-1">
                            <span>{user.status_message}</span>
                          </p>
                        )}
                      </div>
                      
                      {creating === user.id && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}