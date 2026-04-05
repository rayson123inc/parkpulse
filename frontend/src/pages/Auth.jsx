import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navigation, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { APP_NAME, APP_TAGLINE } from '@/lib/config';

export default function Auth() {
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (isSignup) {
      if (!name) {
        setError('Name is required');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isSignup
        ? 'http://localhost:3000/api/auth/signup'
        : 'http://localhost:3000/api/auth/login';

      const body = isSignup
        ? { email, password, name }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isSignup) {
        // after signup → switch to login
        setIsSignup(false);
        setError('Account created. Please log in.');
      } else {
        // login success
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('name', JSON.stringify(data.name));
        navigate('/Home');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex items-center justify-center">
      <div className="px-5 w-full max-w-md mx-auto py-8">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Navigation className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-sm text-slate-400 mt-1">{APP_TAGLINE}</p>
        </motion.div>

        {/* CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">

            <h2 className="text-lg font-semibold mb-1">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h2>

            <p className="text-sm text-slate-400 mb-6">
              {isSignup
                ? 'Start finding carparks near you'
                : 'Sign in to your account'}
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* NAME (signup only) */}
              {isSignup && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12 bg-slate-900/50 border-slate-700"
                    />
                  </div>
                </div>
              )}

              {/* EMAIL */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-slate-900/50 border-slate-700"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-slate-900/50 border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              {isSignup && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 bg-slate-900/50 border-slate-700"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-teal-500"
              >
                {loading ? 'Loading...' : isSignup ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {/* TOGGLE */}
            <p className="text-center text-sm text-slate-400 mt-6">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                }}
                className="text-teal-400"
              >
                {isSignup ? 'Sign in' : 'Create one'}
              </button>
            </p>

          </div>
        </motion.div>
      </div>
    </div>
  );
}