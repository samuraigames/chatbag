import React from 'react';
import { X, Heart } from 'lucide-react';

interface MoodSelectorProps {
  selectedMood: 'happy' | 'sad' | 'angry' | 'anxious' | 'neutral';
  onSelect: (mood: 'happy' | 'sad' | 'angry' | 'anxious' | 'neutral') => void;
  onClose: () => void;
}

const moods = [
  { value: 'neutral', emoji: '😐', label: 'Neutral', color: 'from-gray-500 to-gray-600' },
  { value: 'happy', emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-orange-500' },
  { value: 'sad', emoji: '😢', label: 'Sad', color: 'from-blue-400 to-blue-600' },
  { value: 'angry', emoji: '😠', label: 'Angry', color: 'from-red-400 to-red-600' },
  { value: 'anxious', emoji: '😰', label: 'Anxious', color: 'from-purple-400 to-purple-600' },
] as const;

export function MoodSelector({ selectedMood, onSelect, onClose }: MoodSelectorProps) {
  return (
    <div className="p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border-t border-gray-600/50 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Heart className="h-4 w-4 text-pink-400 animate-pulse" />
          <span className="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
            How are you feeling?
          </span>
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-600/50 rounded-full text-gray-400 transition-all duration-300 hover:scale-110 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {moods.map((mood, index) => (
          <button
            key={mood.value}
            onClick={() => onSelect(mood.value)}
            className={`group relative flex flex-col items-center p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 flex-shrink-0 min-w-[80px] ${
              selectedMood === mood.value
                ? `bg-gradient-to-r ${mood.color} text-white shadow-lg scale-110`
                : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50'
            }`}
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          >
            {/* Glow effect for selected mood */}
            {selectedMood === mood.value && (
              <div className={`absolute inset-0 bg-gradient-to-r ${mood.color} rounded-2xl blur opacity-50 animate-pulse`}></div>
            )}
            
            <span className="text-3xl mb-2 relative z-10 group-hover:animate-bounce">{mood.emoji}</span>
            <span className="text-xs font-medium relative z-10">{mood.label}</span>
            
            {/* Sparkle effect on hover */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping"></div>
          </button>
        ))}
      </div>
      
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-400 animate-pulse">
          Express yourself with mood messages!
        </p>
      </div>
    </div>
  );
}