import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, ArrowLeft, Heart, Sparkles, Zap, RefreshCw, Search, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Message } from '../lib/supabase';
import { useMessages } from '../hooks/useMessages';
import { useTyping } from '../hooks/useTyping';
import { usePresence } from '../hooks/usePresence';
import { MoodSelector } from './MoodSelector';
import { TypingIndicator } from './TypingIndicator';
import { MessageReactions } from './MessageReactions';
import { ReactionPicker } from './ReactionPicker';
import { MessageSearch } from './MessageSearch';
import { PresenceIndicator } from './PresenceIndicator';
import { useAuth } from '../hooks/useAuth';

interface ChatViewProps {
  chatId: string;
  otherUserName: string;
  otherUserAvatar: string;
  onBackToChats?: () => void;
}

export function ChatView({ chatId, otherUserName, otherUserAvatar, onBackToChats }: ChatViewProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMessages(chatId);
  const { typingUsers, handleTyping, stopTyping } = useTyping(chatId);
  const [newMessage, setNewMessage] = useState('');
  const [selectedMood, setSelectedMood] = useState<'happy' | 'sad' | 'angry' | 'anxious' | 'neutral'>('neutral');
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [newMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Handle typing indicators
    if (value.trim()) {
      handleTyping();
    } else {
      stopTyping();
    }
  };

  const handleSend = async () => {
    const messageToSend = newMessage.trim();
    if (!messageToSend || isSending) return;

    console.log('Sending message:', messageToSend);
    
    // Store values before clearing
    const moodToSend = selectedMood;
    
    // Set sending state
    setIsSending(true);

    // Stop typing indicator immediately
    stopTyping();

    // Clear input immediately for instant feedback
    setNewMessage('');
    setSelectedMood('neutral');
    setShowMoodSelector(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Send message - this will add to UI immediately via optimistic update
      await sendMessage(messageToSend, 'text', moodToSend);
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      // Message will be marked as failed in useMessages hook
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetryMessage = async (message: Message) => {
    if (!message.id.startsWith('failed-') || !message.content.includes('Failed to send:')) return;
    
    const originalContent = message.content.replace(/^(Failed to send: |Failed permanently: )/, '');
    
    console.log('Retrying message:', originalContent);
    
    try {
      await sendMessage(originalContent, message.type, message.mood);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'anxious': return '😰';
      default: return '';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return 'from-yellow-400 to-orange-500';
      case 'sad': return 'from-blue-400 to-blue-600';
      case 'angry': return 'from-red-400 to-red-600';
      case 'anxious': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-400 animate-pulse text-lg">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-800 via-gray-900 to-purple-900 h-full overflow-hidden relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-10 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm flex-shrink-0 relative z-10">
        <div className="flex items-center space-x-3">
          {/* Mobile back button */}
          {onBackToChats && (
            <button
              onClick={onBackToChats}
              className="p-2 hover:bg-gray-700/50 rounded-full text-gray-400 transition-all duration-200 hover:scale-110 hover:text-white lg:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          
          <div className="relative group">
            <img
              src={otherUserAvatar}
              alt={otherUserName}
              className="w-12 h-12 rounded-full flex-shrink-0 transition-all duration-200 group-hover:scale-110 border-2 border-emerald-400/50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-200"></div>
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white truncate text-lg flex items-center space-x-2">
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                {otherUserName}
              </span>
              <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
            </h3>
            <p className="text-sm text-emerald-400 flex items-center space-x-1">
              <div className="flex items-center space-x-2">
                <PresenceIndicator userId={user?.id || ''} showStatus />
                {typingUsers.length > 0 ? (
                  <span className="text-yellow-400 animate-pulse">
                    {typingUsers.length === 1 ? 'typing...' : `${typingUsers.length} typing...`}
                  </span>
                ) : (
                  <span>Online</span>
                )}
              </div>
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMessageSearch(true)}
            className="p-2 hover:bg-gray-700/50 rounded-full text-gray-400 transition-all duration-200 hover:scale-110 hover:text-white"
            title="Search messages"
          >
            <Search className="h-5 w-5" />
          </button>
          
          <button
            className="p-2 hover:bg-gray-700/50 rounded-full text-gray-400 transition-all duration-200 hover:scale-110 hover:text-white"
            title="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
        {messages.map((message, index) => {
          const isOwnMessage = message.sender_id === user?.id;
          const isOptimistic = message.id.startsWith('temp-');
          const isFailed = message.id.startsWith('failed-');
          const isRetrying = message.content.startsWith('Retrying:');
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fade-in`}
              style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
            >
              <div
                className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative group transition-all duration-200 hover:scale-[1.02] ${
                  isOwnMessage
                    ? `text-white shadow-lg ${
                        isOptimistic ? 'bg-gradient-to-r from-emerald-400/80 to-blue-500/80 opacity-90 ring-2 ring-emerald-400/30 animate-pulse' : 
                        isFailed ? 'bg-gradient-to-r from-red-500 to-red-600 opacity-80 cursor-pointer hover:opacity-100' :
                        isRetrying ? 'bg-gradient-to-r from-yellow-500 to-orange-600 opacity-90 animate-pulse' :
                        'bg-gradient-to-r from-emerald-500 to-blue-600'
                      }`
                    : 'bg-gray-700/80 backdrop-blur-sm text-white border border-gray-600/50'
                }`}
                onClick={() => isFailed ? handleRetryMessage(message) : undefined}
              >
                {/* Message mood glow effect */}
                {message.mood !== 'neutral' && !isFailed && !isRetrying && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${getMoodColor(message.mood)} opacity-20 rounded-2xl blur-sm`}></div>
                )}
                
                <div className="flex items-center space-x-2 relative z-10">
                  <p className="text-sm break-words font-medium leading-relaxed">{message.content}</p>
                  {message.mood !== 'neutral' && !isFailed && !isRetrying && (
                    <span className="text-xl flex-shrink-0 animate-bounce">{getMoodEmoji(message.mood)}</span>
                  )}
                  {isOptimistic && (
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                  {isFailed && (
                    <RefreshCw className="h-4 w-4 text-white/80 flex-shrink-0 animate-pulse" />
                  )}
                  {isRetrying && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  )}
                </div>
                
                <p className="text-xs opacity-75 mt-1 relative z-10">
                  {isOptimistic ? (
                    <span className="flex items-center space-x-1">
                      <span>Sending</span>
                      <Zap className="h-3 w-3 animate-pulse" />
                    </span>
                  ) : isFailed ? (
                    <span className="text-red-200">Failed to send • Tap to retry</span>
                  ) : isRetrying ? (
                    <span className="text-yellow-200">Retrying...</span>
                  ) : (
                    formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
                  )}
                </p>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl"></div>
                
                {/* Message Reactions */}
                <MessageReactions 
                  messageId={message.id}
                  onAddReaction={() => setShowReactionPicker(message.id)}
                />
                
                {/* Reaction Picker */}
                {showReactionPicker === message.id && (
                  <ReactionPicker
                    isOpen={true}
                    onClose={() => setShowReactionPicker(null)}
                    onSelectReaction={(reaction) => {
                      // Handle reaction selection
                      console.log('Selected reaction:', reaction, 'for message:', message.id);
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
        
        {/* Typing Indicator */}
        <TypingIndicator typingUsers={typingUsers} />
        
        <div ref={messagesEndRef} />
      </div>

      {/* Mood Selector */}
      {showMoodSelector && (
        <MoodSelector
          selectedMood={selectedMood}
          onSelect={setSelectedMood}
          onClose={() => setShowMoodSelector(false)}
        />
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm flex-shrink-0 relative z-10">
        <div className="flex items-end space-x-3">
          <button
            onClick={() => setShowMoodSelector(!showMoodSelector)}
            className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 transform hover:scale-110 group relative ${
              selectedMood !== 'neutral'
                ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg'
                : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50'
            }`}
          >
            <Smile className="h-5 w-5 group-hover:animate-pulse" />
            {selectedMood !== 'neutral' && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full blur opacity-50 animate-pulse"></div>
            )}
          </button>

          <div className="flex-1 min-w-0 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type something amazing..."
              className="w-full px-4 py-3 bg-gray-700/50 backdrop-blur-sm text-white rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-600/50 transition-all duration-200 hover:bg-gray-600/50 focus:scale-[1.02] min-h-[48px] max-h-[120px]"
              rows={1}
              disabled={isSending}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
          </div>

          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="group relative p-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all duration-200 flex-shrink-0 transform hover:scale-110 disabled:hover:scale-100 shadow-lg hover:shadow-emerald-500/25"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5 group-hover:animate-pulse" />
            )}
            <Zap className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-200"></div>
          </button>
        </div>
      </div>
      
      {/* Message Search Modal */}
      <MessageSearch
        isOpen={showMessageSearch}
        onClose={() => setShowMessageSearch(false)}
        onSelectMessage={(chatId, messageId) => {
          // Handle message selection - could scroll to message
          console.log('Selected message:', messageId, 'in chat:', chatId);
        }}
      />
    </div>
  );
}