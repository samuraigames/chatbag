import React from 'react';
import { X } from 'lucide-react';

interface ReactionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReaction: (reaction: '👍' | '👎' | '❤️' | '😂' | '😮' | '😢' | '😡') => void;
}

const reactions = [
  { emoji: '👍', label: 'Like' },
  { emoji: '👎', label: 'Dislike' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
] as const;

export function ReactionPicker({ isOpen, onClose, onSelectReaction }: ReactionPickerProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-600 rounded-xl p-3 shadow-lg z-50 animate-scale-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-300">React to message</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      
      <div className="flex space-x-2">
        {reactions.map((reaction, index) => (
          <button
            key={reaction.emoji}
            onClick={() => {
              onSelectReaction(reaction.emoji);
              onClose();
            }}
            className="p-2 hover:bg-gray-700 rounded-lg transition-all duration-200 transform hover:scale-125 group"
            title={reaction.label}
            style={{
              animationDelay: `${index * 0.05}s`
            }}
          >
            <span className="text-xl group-hover:animate-bounce">{reaction.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}