import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';
import { Button } from '../components/ui/Button';
import { AlertCircle, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import './Login.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Extract token from URL query params: /reset-password?token=...
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing security token. Please request a new recovery link.');
      setTokenError(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenError) return;

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/auth/password-reset/confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Failed to securely update password.');
      }

      setIsSuccess(true);
    } catch (err) {
      setError((err as Error).message || 'A network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container antialiased min-h-[100dvh] flex flex-col lg:flex-row relative overflow-hidden bg-white">
      {/* Left Column - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as const }}
        className="hidden lg:flex lg:w-1/2 p-24 flex-col justify-between relative bg-gradient-to-br from-[#001D3A] via-[#0052CC] to-[#011627]"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-dot-pattern"></div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex items-center gap-4"
          >
            <div className="bg-white p-2 rounded-xl shadow-lg border border-white/20">
              <img src={logo} alt="Coastal Logo" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-white text-3xl font-black tracking-tighter">Coastal</span>
          </motion.div>
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
            className="mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-sm font-bold uppercase tracking-wider mb-6">
              Secure Gateway
            </span>
            <h1 className="text-8xl font-black text-white leading-[0.85] mb-8 tracking-tighter">
              Update <br />
              <span className="text-emerald-400">Credentials.</span>
            </h1>
            <p className="text-white/70 text-xl max-w-md leading-relaxed font-medium">
              Establish a new secure password for your banking profile.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 text-blue-200 text-sm font-bold uppercase tracking-widest">
          Coastal Auto Tech Cooperative Credit Union
        </div>
      </motion.div>

      {/* Right Column - Form Interface */}
      <main className="flex-1 flex flex-col justify-center items-center py-16 px-8 relative bg-slate-50 overflow-hidden">
        <div className="w-full max-w-md relative z-10 animate-[fadeIn_0.5s_ease-out]">
          {/* Solid Professional Card Container */}
          <div className="p-8 lg:p-12 rounded-2xl bg-white shadow-[0_20px_50px_rgb(0,0,0,0.07)] border border-slate-200">
            <div className="mb-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white rounded-2xl border-2 border-slate-100">
                  <Lock className="w-12 h-12 text-[#001D3A]" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-[#001D3A] mb-3 leading-tight uppercase tracking-tight">
                New Password
              </h2>
              <p className="text-slate-600 font-bold text-sm uppercase tracking-wider">
                Secure Token Validated
              </p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6 p-4 bg-red-50/50 backdrop-blur-sm border border-red-100 text-red-700 text-sm rounded-xl flex items-center gap-3 font-bold shadow-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {!isSuccess && !tokenError ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div className="group relative">
                    <label
                      htmlFor="reset-password"
                      className="block text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 ml-1"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="reset-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full bg-white border-slate-300 focus:bg-white text-slate-900 px-5 py-4 rounded-xl transition-all outline-none border-2 focus:ring-4 focus:ring-[#0052CC]/10 focus:border-[#0052CC] font-bold text-base shadow-sm placeholder:text-slate-400"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0052CC] transition-colors flex items-center gap-1.5 p-2 -mr-2"
                      >
                        <span className="text-sm font-bold text-[#0052CC]">
                          {showPassword ? 'Hide' : 'Show'}
                        </span>
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-[#0052CC]" />
                        ) : (
                          <Eye className="w-4 h-4 text-[#0052CC]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="group relative">
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 ml-1"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full bg-white border-slate-300 focus:bg-white text-slate-900 px-5 py-4 rounded-xl transition-all outline-none border-2 focus:ring-4 focus:ring-[#0052CC]/10 focus:border-[#0052CC] font-bold text-base shadow-sm placeholder:text-slate-400"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0052CC] transition-colors flex items-center gap-1.5 p-2 -mr-2"
                      >
                        <span className="text-sm font-bold text-[#0052CC]">
                          {showConfirmPassword ? 'Hide' : 'Show'}
                        </span>
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-[#0052CC]" />
                        ) : (
                          <Eye className="w-4 h-4 text-[#0052CC]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    variant="primary"
                    className="w-full py-4 rounded-xl text-base shadow-lg shadow-blue-600/20 font-bold uppercase tracking-wider transition-all hover:translate-y-[-1px] active:translate-y-[1px] bg-[#0052CC] hover:bg-[#0041a3] text-white border-none"
                  >
                    {isLoading ? 'Updating Security Key...' : 'Confirm New Password'}
                  </Button>
                </div>
              </form>
            ) : isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Password Updated</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-8">
                  Your credentials have been securely updated. You can now access your dashboard.
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  className="w-full py-4 rounded-xl text-base font-bold uppercase tracking-wider bg-[#0052CC] text-white border-none flex items-center justify-center gap-2"
                >
                  Proceed to Login <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            ) : null}

            {tokenError && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
                <Link
                  to="/forgot-password"
                  className="text-sm font-bold text-[#0052CC] hover:text-[#001D3A] transition-colors underline decoration-[#0052CC]/30 underline-offset-4"
                >
                  Request a New SMS Link
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
