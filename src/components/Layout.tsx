import React, { useState, useEffect } from 'react';
import { Settings, MessageCircle, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useChats } from '../hooks/useChats';
import { usePresence } from '../hooks/usePresence';
import { ChatList } from './ChatList';
import { ChatView } from './ChatView';
import { NewChatModal } from './NewChatModal';
import { ProfileModal } from './ProfileModal';
import { MessageSearch } from './MessageSearch';
import { PresenceIndicator } from './PresenceIndicator';

export function Layout() {
  const { profile } = useAuth();
  const { chats, loading } = useChats();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileUpdateAnimation, setProfileUpdateAnimation] = useState(false);

  // Initialize presence tracking
  usePresence();

  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  // Animate profile updates
  useEffect(() => {
    setProfileUpdateAnimation(true);
    const timer = setTimeout(() => setProfileUpdateAnimation(false), 300);
    return () => clearTimeout(timer);
  }, [profile?.name, profile?.avatar_url, profile?.status_message]);

  const handleChatCreated = (chatId: string) => {
    setSelectedChatId(chatId);
    setSidebarOpen(false); // Close sidebar on mobile after selecting chat
    // Force refresh chats to ensure new chat appears
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setSidebarOpen(false); // Close sidebar on mobile after selecting chat
  };

  return (
    <div className="h-screen bg-gray-900 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-gray-900 border-r border-gray-700 flex flex-col
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* User Header */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 min-w-0 flex-1 transition-all duration-300 ${
              profileUpdateAnimation ? 'scale-105' : 'scale-100'
            }`}>
              <div className="relative">
                <img
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`}
                  alt={profile?.name || 'User'}
                  className={`w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 transition-all duration-300 ${
                    profileUpdateAnimation ? 'ring-2 ring-emerald-400 ring-opacity-50' : ''
                  }`}
                />
                <div className="absolute bottom-0 right-0">
                  <PresenceIndicator userId={profile?.id || ''} size="sm" />
                </div>
                {profileUpdateAnimation && (
                  <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 animate-ping" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className={`font-semibold text-white truncate transition-all duration-300 ${
                  profileUpdateAnimation ? 'text-emerald-300' : ''
                }`}>
                  {profile?.name}
                </h2>
                <p className={`text-sm text-gray-400 truncate transition-all duration-300 ${
                  profileUpdateAnimation ? 'text-emerald-400' : ''
                }`}>
                  {profile?.status_message || 'Available'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="p-2 hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                title="Search all messages"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                title="Profile settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              {/* Mobile close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-full text-gray-400 transition-colors lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-hidden">
          <ChatList
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            onNewChat={() => setShowNewChatModal(true)}
            loading={loading}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChat ? (
          <ChatView
            chatId={selectedChat.id}
            otherUserName={selectedChat.other_user?.name || 'Unknown User'}
            otherUserAvatar={selectedChat.other_user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.id}`}
            onBackToChats={() => {
              setSelectedChatId(null);
              setSidebarOpen(true);
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-800 p-4">
            {/* Mobile menu button when no chat selected */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mb-4 p-3 bg-emerald-600 hover:bg-emerald-700 rounded-full text-white transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="text-center max-w-sm">
              <MessageCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Welcome to Messages</h3>
              <p className="text-gray-400 text-center">
                <span className="hidden lg:inline">Select a chat to start messaging</span>
                <span className="lg:hidden">Tap the menu button above to view your chats</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={handleChatCreated}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <MessageSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onSelectMessage={(chatId, messageId) => {
          setSelectedChatId(chatId);
          setSidebarOpen(false);
          // Could add logic to scroll to specific message
        }}
      />
    </div>
  );
}