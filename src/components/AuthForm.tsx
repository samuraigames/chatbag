import React, { useState } from 'react';
import { Mail, Lock, User, MessageCircle, AtSign, Sparkles, Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
}

export function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const { signIn, signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(formData.email, formData.password, formData.name, formData.username);
      } else {
        await signIn(formData.email, formData.password);
      }
    } catch (error) {
      // Error handling is done in the auth hook
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-10 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-emerald-400 to-blue-500 p-4 rounded-full shadow-lg transform hover:scale-110 transition-all duration-300 hover:rotate-12 group">
              <MessageCircle className="h-8 w-8 text-white group-hover:animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-2 animate-fade-in">
            {mode === 'signin' ? (
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Welcome back!
              </span>
            ) : (
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Join the fun!
              </span>
            )}
          </h2>
          <p className="mt-2 text-gray-300 animate-fade-in-delay">
            {mode === 'signin' 
              ? 'Ready to chat with your friends?' 
              : 'Create your account and start connecting!'
            }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="transform transition-all duration-300 hover:scale-105">
                  <label htmlFor="name" className="sr-only">
                    Full name
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-300 ${
                      focusedField === 'name' ? 'text-emerald-400 scale-110' : 'text-gray-400'
                    }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 transition-all duration-300 hover:bg-gray-700/50 focus:scale-105"
                      placeholder="Your awesome name"
                    />
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 -z-10 blur transition-opacity duration-300 ${
                      focusedField === 'name' ? 'opacity-20' : ''
                    }`}></div>
                  </div>
                </div>

                <div className="transform transition-all duration-300 hover:scale-105">
                  <label htmlFor="username" className="sr-only">
                    Username
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-300 ${
                      focusedField === 'username' ? 'text-purple-400 scale-110' : 'text-gray-400'
                    }`}>
                      <AtSign className="h-5 w-5" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 transition-all duration-300 hover:bg-gray-700/50 focus:scale-105"
                      placeholder="cool_username"
                      pattern="[a-zA-Z0-9_]+"
                      title="Username can only contain letters, numbers, and underscores"
                    />
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 -z-10 blur transition-opacity duration-300 ${
                      focusedField === 'username' ? 'opacity-20' : ''
                    }`}></div>
                  </div>
                </div>
              </>
            )}

            <div className="transform transition-all duration-300 hover:scale-105">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-300 ${
                  focusedField === 'email' ? 'text-blue-400 scale-110' : 'text-gray-400'
                }`}>
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 transition-all duration-300 hover:bg-gray-700/50 focus:scale-105"
                  placeholder="your@email.com"
                />
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 -z-10 blur transition-opacity duration-300 ${
                  focusedField === 'email' ? 'opacity-20' : ''
                }`}></div>
              </div>
            </div>

            <div className="transform transition-all duration-300 hover:scale-105">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-300 ${
                  focusedField === 'password' ? 'text-pink-400 scale-110' : 'text-gray-400'
                }`}>
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:z-10 transition-all duration-300 hover:bg-gray-700/50 focus:scale-105"
                  placeholder="Super secret password"
                  minLength={6}
                />
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 opacity-0 -z-10 blur transition-opacity duration-300 ${
                  focusedField === 'password' ? 'opacity-20' : ''
                }`}></div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:hover:scale-100"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles className="h-5 w-5 text-white group-hover:animate-pulse" />
                )}
              </span>
              {loading ? 'Creating magic...' : (mode === 'signin' ? 'Let\'s chat!' : 'Join the party!')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-emerald-400 hover:text-emerald-300 text-sm transition-all duration-300 hover:scale-105 transform inline-flex items-center space-x-1 group"
            >
              <Heart className="h-4 w-4 group-hover:animate-pulse" />
              <span>
                {mode === 'signin' 
                  ? "New here? Create an account!" 
                  : 'Already part of the family? Sign in!'
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}