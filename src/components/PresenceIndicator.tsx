import React from 'react';
import { usePresence } from '../hooks/usePresence';

interface PresenceIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

export function PresenceIndicator({ userId, size = 'md', showStatus = false }: PresenceIndicatorProps) {
  const { getUserPresence, isUserOnline } = usePresence();
  const presence = getUserPresence(userId);
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const getStatusColor = () => {
    if (!presence) return 'bg-gray-500';
    
    switch (presence.status) {
      case 'online':
        return 'bg-green-400';
      case 'away':
        return 'bg-yellow-400';
      case 'busy':
        return 'bg-red-400';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (!presence) return 'Unknown';
    
    switch (presence.status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      default:
        return 'Offline';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`${sizeClasses[size]} ${getStatusColor()} rounded-full ${isUserOnline(userId) ? 'animate-pulse' : ''}`} />
      {showStatus && (
        <span className="text-xs text-gray-400">
          {getStatusText()}
        </span>
      )}
    </div>
  );
}