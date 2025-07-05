import React, { useState } from 'react';
import { Search, X, MessageCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMessageSearch } from '../hooks/useMessageSearch';

interface MessageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage?: (chatId: string, messageId: string) => void;
}

export function MessageSearch({ isOpen, onClose, onSelectMessage }: MessageSearchProps) {
  const [query, setQuery] = useState('');
  const { results, loading, searchMessages, clearResults } = useMessageSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchMessages(query);
    } else {
      clearResults();
    }
  };

  const handleClose = () => {
    setQuery('');
    clearResults();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl border border-gray-700/50 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Search className="h-6 w-6 text-emerald-400" />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Search Messages
            </span>
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700/50 rounded-full text-gray-400 transition-all duration-300 hover:scale-110 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for messages..."
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 backdrop-blur-sm text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-600/50 transition-all duration-300 hover:bg-gray-600/50 focus:scale-105"
                autoFocus
              />
            </div>
          </form>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-gray-400">Searching messages...</div>
              </div>
            ) : results.length === 0 && query ? (
              <div className="text-center py-8 text-gray-400">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No messages found</p>
                <p className="text-sm">Try different keywords</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Search Messages</p>
                <p className="text-sm">Enter keywords to find messages</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      onSelectMessage?.(result.chat_id, result.id);
                      handleClose();
                    }}
                    className="w-full p-4 hover:bg-gray-700/50 rounded-xl text-left transition-all duration-300 transform hover:scale-105 group border border-gray-600/30 hover:border-emerald-500/50"
                    style={{
                      animationDelay: `${index * 0.05}s`
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <MessageCircle className="h-5 w-5 text-emerald-400 mt-1 flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white truncate">
                            {result.sender_name}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}</span>
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-300 line-clamp-2 mb-1">
                          {result.content}
                        </p>
                        
                        <p className="text-xs text-gray-500">
                          in {result.chat_name}
                        </p>
                      </div>
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