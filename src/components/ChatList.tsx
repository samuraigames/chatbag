import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Plus, Zap, Star } from 'lucide-react';
import { ChatWithUsers } from '../lib/supabase';

interface ChatListProps {
  chats: ChatWithUsers[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  loading: boolean;
}

export function ChatList({ 
  chats, 
  selectedChatId, 
  onSelectChat, 
  onNewChat, 
  loading 
}: ChatListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-400 animate-pulse">Loading your chats...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <MessageCircle className="h-6 w-6 text-emerald-400 animate-pulse" />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Messages
            </span>
          </h2>
          <button
            onClick={onNewChat}
            className="group relative p-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 rounded-full transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-lg hover:shadow-emerald-500/25"
          >
            <Plus className="h-5 w-5 text-white group-hover:animate-spin" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <div className="relative mb-6">
              <MessageCircle className="h-16 w-16 opacity-50 animate-bounce" />
              <Star className="h-6 w-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <p className="text-center text-lg font-medium mb-2">No conversations yet!</p>
            <p className="text-sm text-center">Start a new chat and make some friends!</p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {chats.map((chat, index) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full p-4 rounded-2xl text-left transition-all duration-300 transform hover:scale-[1.02] group relative overflow-hidden ${
                  selectedChatId === chat.id
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg scale-[1.02]'
                    : 'hover:bg-gray-700/50 text-gray-300 hover:shadow-lg'
                }`}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {/* Animated background for selected chat */}
                {selectedChatId === chat.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 opacity-20 animate-pulse"></div>
                )}
                
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="relative">
                    <img
                      src={chat.other_user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`}
                      alt={chat.other_user?.name || 'User'}
                      className="w-14 h-14 rounded-full bg-gray-600 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 border-2 border-transparent group-hover:border-white/20"
                    />
                    {/* Online indicator with pulse */}
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
                    {/* Sparkle effect */}
                    <Zap className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold truncate text-lg group-hover:text-white transition-colors duration-300">
                        {chat.other_user?.name || 'Mystery Friend'}
                      </h3>
                      <span className="text-xs opacity-75 flex-shrink-0 ml-2 bg-black/20 px-2 py-1 rounded-full">
                        {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="text-sm opacity-75 truncate mb-1 group-hover:opacity-90 transition-opacity duration-300">
                      {chat.last_message || 'Start the conversation!'}
                    </p>
                    
                    {chat.other_user?.username && (
                      <p className="text-xs opacity-60 truncate flex items-center space-x-1">
                        <span>@{chat.other_user.username}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}