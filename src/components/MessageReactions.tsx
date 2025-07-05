import React from 'react';
import { Plus } from 'lucide-react';
import { useMessageReactions } from '../hooks/useMessageReactions';

interface MessageReactionsProps {
  messageId: string;
  onAddReaction?: () => void;
}

const reactionEmojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡'] as const;

export function MessageReactions({ messageId, onAddReaction }: MessageReactionsProps) {
  const { 
    reactions, 
    toggleReaction, 
    getReactionCounts, 
    getUserReactions 
  } = useMessageReactions(messageId);

  const reactionCounts = getReactionCounts();
  const userReactions = getUserReactions();

  // Only show reactions that have been used
  const usedReactions = Object.keys(reactionCounts);

  if (usedReactions.length === 0) {
    return (
      <button
        onClick={onAddReaction}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-600/50 rounded-full text-gray-400 hover:text-white"
        title="Add reaction"
      >
        <Plus className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-1 mt-1">
      {usedReactions.map((reaction) => (
        <button
          key={reaction}
          onClick={() => toggleReaction(reaction as any)}
          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 hover:scale-110 ${
            userReactions.includes(reaction as any)
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
              : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
          }`}
        >
          <span>{reaction}</span>
          <span className="font-medium">{reactionCounts[reaction]}</span>
        </button>
      ))}
      
      <button
        onClick={onAddReaction}
        className="p-1 hover:bg-gray-600/50 rounded-full text-gray-400 hover:text-white transition-colors duration-200"
        title="Add reaction"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}