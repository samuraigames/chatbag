import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for placeholder values
const isPlaceholderUrl = !supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co';
const isPlaceholderKey = !supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here';

if (!supabaseUrl || !supabaseAnonKey || isPlaceholderUrl || isPlaceholderKey) {
  console.error('❌ Supabase Configuration Issue:', {
    url: supabaseUrl ? (isPlaceholderUrl ? 'Placeholder' : 'Set') : 'Missing',
    key: supabaseAnonKey ? (isPlaceholderKey ? 'Placeholder' : 'Set') : 'Missing'
  });
  
  const errorMessage = `
🔧 Supabase Setup Required

Please update your .env file with your actual Supabase credentials:

1. Go to https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Go to Project Settings → API
4. Copy your Project URL and Public anon key
5. Update the .env file in your project root

Current status:
- VITE_SUPABASE_URL: ${supabaseUrl ? (isPlaceholderUrl ? 'Placeholder value' : 'Set') : 'Missing'}
- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? (isPlaceholderKey ? 'Placeholder value' : 'Set') : 'Missing'}
  `;
  
  throw new Error(errorMessage);
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  throw new Error(`Invalid Supabase URL format. Expected: https://your-project-id.supabase.co, Got: ${supabaseUrl}`);
}

// Log connection details for debugging (but hide sensitive info)
console.log('🔧 Supabase Configuration:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length,
  keyPrefix: supabaseAnonKey.substring(0, 20) + '...'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 30
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'realtime-messaging-app'
    }
  }
});

// Test connection with better error handling
let connectionTested = false;

export const testSupabaseConnection = async (): Promise<boolean> => {
  if (connectionTested) return true;
  
  try {
    const { error } = await supabase.from('users').select('count').limit(0);
    
    if (error && !error.message.includes('JWT') && !error.message.includes('RLS')) {
      console.warn('⚠️ Supabase connection test warning:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection verified');
    connectionTested = true;
    return true;
  } catch (error: any) {
    console.error('❌ Supabase connection test failed:', error.message);
    return false;
  }
};

// Database types
export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar_url: string;
  status_message: string;
  last_active: string;
  created_at: string;
}

export interface Chat {
  id: string;
  is_group: boolean;
  participants: string[];
  created_at: string;
  last_message: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'ai';
  mood: 'happy' | 'sad' | 'angry' | 'anxious' | 'neutral';
  created_at: string;
  sender?: User;
}

export interface ChatWithUsers extends Chat {
  other_user?: User;
  users?: User[];
}