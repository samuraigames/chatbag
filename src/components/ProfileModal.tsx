import React, { useState, useRef, useEffect } from 'react';
import { X, User, Camera, MessageSquare, Upload, AtSign, Check, AlertCircle, Sparkles, Heart, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FieldStatus {
  [key: string]: 'idle' | 'saving' | 'saved' | 'error';
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { profile, updateProfile, signOut } = useAuth();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    username: profile?.username || '',
    status_message: profile?.status_message || '',
    avatar_url: profile?.avatar_url || '',
  });
  const [fieldStatus, setFieldStatus] = useState<FieldStatus>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Update form data when profile changes (real-time updates)
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        status_message: profile.status_message || '',
        avatar_url: profile.avatar_url || '',
      });
      setHasUnsavedChanges(false);
    }
  }, [profile]);

  // Auto-save functionality with debouncing
  const autoSave = async (field: string, value: string) => {
    // Clear existing timeout for this field
    if (saveTimeoutRef.current[field]) {
      clearTimeout(saveTimeoutRef.current[field]);
    }

    // Set field status to saving after a short delay
    saveTimeoutRef.current[field] = setTimeout(async () => {
      setFieldStatus(prev => ({ ...prev, [field]: 'saving' }));
      
      try {
        await updateProfile({ [field]: value });
        setFieldStatus(prev => ({ ...prev, [field]: 'saved' }));
        setHasUnsavedChanges(false);
        
        // Clear saved status after 2 seconds
        setTimeout(() => {
          setFieldStatus(prev => ({ ...prev, [field]: 'idle' }));
        }, 2000);
      } catch (error) {
        console.error(`Error updating ${field}:`, error);
        setFieldStatus(prev => ({ ...prev, [field]: 'error' }));
        
        // Clear error status after 3 seconds
        setTimeout(() => {
          setFieldStatus(prev => ({ ...prev, [field]: 'idle' }));
        }, 3000);
      }
    }, 1000); // 1 second debounce
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    setHasUnsavedChanges(true);
    setFieldStatus(prev => ({ ...prev, [name]: 'idle' }));
    
    // Auto-save for all fields except avatar_url (handled separately)
    if (name !== 'avatar_url') {
      autoSave(name, value);
    }
  };

  const generateNewAvatar = async () => {
    const seed = Math.random().toString(36).substring(7);
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    
    setFormData(prev => ({
      ...prev,
      avatar_url: newAvatarUrl,
    }));
    
    setFieldStatus(prev => ({ ...prev, avatar_url: 'saving' }));
    
    try {
      await updateProfile({ avatar_url: newAvatarUrl });
      setFieldStatus(prev => ({ ...prev, avatar_url: 'saved' }));
      
      setTimeout(() => {
        setFieldStatus(prev => ({ ...prev, avatar_url: 'idle' }));
      }, 2000);
    } catch (error) {
      console.error('Error updating avatar:', error);
      setFieldStatus(prev => ({ ...prev, avatar_url: 'error' }));
      
      setTimeout(() => {
        setFieldStatus(prev => ({ ...prev, avatar_url: 'idle' }));
      }, 3000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingImage(true);
    setFieldStatus(prev => ({ ...prev, avatar_url: 'saving' }));

    try {
      // Convert to base64 for preview (in a real app, you'd upload to a service)
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        
        setFormData(prev => ({
          ...prev,
          avatar_url: result,
        }));
        
        try {
          await updateProfile({ avatar_url: result });
          setFieldStatus(prev => ({ ...prev, avatar_url: 'saved' }));
          toast.success('Image uploaded successfully!');
          
          setTimeout(() => {
            setFieldStatus(prev => ({ ...prev, avatar_url: 'idle' }));
          }, 2000);
        } catch (error) {
          console.error('Error updating avatar:', error);
          setFieldStatus(prev => ({ ...prev, avatar_url: 'error' }));
          toast.error('Failed to save image');
          
          setTimeout(() => {
            setFieldStatus(prev => ({ ...prev, avatar_url: 'idle' }));
          }, 3000);
        }
        
        setUploadingImage(false);
      };
      reader.onerror = () => {
        setUploadingImage(false);
        setFieldStatus(prev => ({ ...prev, avatar_url: 'error' }));
        toast.error('Failed to upload image');
        
        setTimeout(() => {
          setFieldStatus(prev => ({ ...prev, avatar_url: 'idle' }));
        }, 3000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingImage(false);
      setFieldStatus(prev => ({ ...prev, avatar_url: 'error' }));
      toast.error('Failed to upload image');
      
      setTimeout(() => {
        setFieldStatus(prev => ({ ...prev, avatar_url: 'idle' }));
      }, 3000);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getFieldStatusIcon = (field: string) => {
    const status = fieldStatus[field];
    switch (status) {
      case 'saving':
        return <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      case 'saved':
        return <Check className="h-4 w-4 text-green-400 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400 animate-pulse" />;
      default:
        return null;
    }
  };

  const getFieldStatusColor = (field: string) => {
    const status = fieldStatus[field];
    switch (status) {
      case 'saving':
        return 'ring-blue-500 border-blue-500';
      case 'saved':
        return 'ring-green-500 border-green-500';
      case 'error':
        return 'ring-red-500 border-red-500';
      default:
        return focusedField === field ? 'ring-emerald-500 border-emerald-500' : 'border-gray-600';
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700/50 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/30 to-blue-900/30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <User className="h-6 w-6 text-emerald-400 animate-pulse" />
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Profile Settings
              </span>
            </h2>
            {hasUnsavedChanges && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-xs text-yellow-400">Auto-saving...</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-full text-gray-400 transition-all duration-300 hover:scale-110 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <img
                src={formData.avatar_url}
                alt="Avatar"
                className={`w-24 h-24 rounded-full bg-gray-600 object-cover transition-all duration-300 border-4 ${
                  fieldStatus.avatar_url === 'saving' ? 'opacity-70 scale-95 border-blue-400' : 
                  fieldStatus.avatar_url === 'saved' ? 'border-green-400 scale-105' : 
                  fieldStatus.avatar_url === 'error' ? 'border-red-400' : 'border-emerald-400/50'
                }`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`;
                }}
              />
              
              {/* Glow effect */}
              <div className={`absolute inset-0 rounded-full blur transition-opacity duration-300 ${
                fieldStatus.avatar_url === 'saved' ? 'bg-green-400 opacity-30' :
                fieldStatus.avatar_url === 'saving' ? 'bg-blue-400 opacity-30' :
                'bg-emerald-400 opacity-0 group-hover:opacity-20'
              }`}></div>
              
              <div className="absolute -bottom-2 -right-2 flex space-x-2">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={uploadingImage}
                  className="group/btn relative p-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 rounded-full text-white transition-all duration-300 transform hover:scale-110 shadow-lg"
                  title="Upload custom image"
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 group-hover/btn:animate-pulse" />
                  )}
                  <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 animate-pulse" />
                </button>
                
                <button
                  type="button"
                  onClick={generateNewAvatar}
                  disabled={fieldStatus.avatar_url === 'saving'}
                  className="group/btn relative p-2 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 disabled:opacity-50 rounded-full text-white transition-all duration-300 transform hover:scale-110 shadow-lg"
                  title="Generate random avatar"
                >
                  <Camera className="h-4 w-4 group-hover/btn:animate-pulse" />
                  <Zap className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 animate-pulse" />
                </button>
              </div>
              
              {fieldStatus.avatar_url && (
                <div className="absolute -top-2 -right-2">
                  {getFieldStatusIcon('avatar_url')}
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <p className="text-xs text-gray-400 text-center flex items-center space-x-1">
              <Heart className="h-3 w-3 text-pink-400 animate-pulse" />
              <span>Changes save automatically • Upload or generate avatar</span>
              <Sparkles className="h-3 w-3 text-yellow-400 animate-pulse" />
            </p>
          </div>

          <div className="space-y-5">
            <div className="transform transition-all duration-300 hover:scale-105">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-1">
                <User className="h-4 w-4 text-emerald-400" />
                <span>Display Name</span>
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-4 py-3 bg-gray-700/50 backdrop-blur-sm text-white rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 border ${getFieldStatusColor('name')} hover:bg-gray-600/50 focus:scale-105`}
                  required
                  placeholder="Your awesome name"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {getFieldStatusIcon('name')}
                </div>
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 opacity-0 transition-opacity duration-300 pointer-events-none ${
                  focusedField === 'name' ? 'opacity-100' : ''
                }`}></div>
              </div>
            </div>

            <div className="transform transition-all duration-300 hover:scale-105">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-1">
                <AtSign className="h-4 w-4 text-purple-400" />
                <span>Username</span>
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-4 py-3 bg-gray-700/50 backdrop-blur-sm text-white rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 border ${getFieldStatusColor('username')} hover:bg-gray-600/50 focus:scale-105`}
                  required
                  placeholder="cool_username"
                  pattern="[a-zA-Z0-9_]+"
                  title="Username can only contain letters, numbers, and underscores"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {getFieldStatusIcon('username')}
                </div>
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 transition-opacity duration-300 pointer-events-none ${
                  focusedField === 'username' ? 'opacity-100' : ''
                }`}></div>
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                <span>Letters, numbers, and underscores only</span>
              </p>
            </div>

            <div className="transform transition-all duration-300 hover:scale-105">
              <label htmlFor="status_message" className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-1">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                <span>Status Message</span>
              </label>
              <div className="relative group">
                <textarea
                  id="status_message"
                  name="status_message"
                  value={formData.status_message}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('status_message')}
                  onBlur={() => setFocusedField(null)}
                  rows={3}
                  className={`w-full px-4 py-3 bg-gray-700/50 backdrop-blur-sm text-white rounded-xl focus:outline-none focus:ring-2 resize-none transition-all duration-300 border ${getFieldStatusColor('status_message')} hover:bg-gray-600/50 focus:scale-105`}
                  placeholder="What's on your mind?"
                  maxLength={150}
                />
                <div className="absolute top-3 right-3">
                  {getFieldStatusIcon('status_message')}
                </div>
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 transition-opacity duration-300 pointer-events-none ${
                  focusedField === 'status_message' ? 'opacity-100' : ''
                }`}></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-400 flex items-center space-x-1">
                  <span>{formData.status_message.length}/150 characters</span>
                </p>
                {fieldStatus.status_message === 'saved' && (
                  <p className="text-xs text-green-400 flex items-center space-x-1">
                    <Check className="h-3 w-3" />
                    <span>Saved!</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-600/50 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 font-medium transform hover:scale-105 border border-gray-600/50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={signOut}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl transition-all duration-300 font-medium transform hover:scale-105 shadow-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}