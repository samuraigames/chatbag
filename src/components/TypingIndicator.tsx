import React from 'react';
import { MessageCircle } from 'lucide-react';

interface TypingUser {
  id: string;
  name: string;
  avatar_url: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
    } else {
      return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-gray-700/60 backdrop-blur-sm border border-gray-600/30">
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2">
            {typingUsers.slice(0, 3).map((user) => (
              <img
                key={user.id}
                src={user.avatar_url}
                alt={user.name}
                className="w-6 h-6 rounded-full border-2 border-gray-700 bg-gray-600"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
                }}
              />
            ))}
          </div>
          
          <div className="flex items-center space-x-2 text-gray-300">
            <MessageCircle className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-sm font-medium">{getTypingText()}</span>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}