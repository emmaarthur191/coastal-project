import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';
import { Button } from '../components/ui/Button';
import { AlertCircle, User, ArrowLeft, Smartphone } from 'lucide-react';
import './Login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Login ID / Email is required.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/auth/password-reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Only show explicit errors. Django will return 200 for security if email not found.
        throw new Error(data.error || data.detail || 'Failed to process request.');
      }

      setIsSuccess(true);
    } catch (err) {
      setError((err as Error).message || 'A network error occurred while reaching the server.');
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
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-300 text-sm font-bold uppercase tracking-wider mb-6">
              Security Portal
            </span>
            <h1 className="text-8xl font-black text-white leading-[0.85] mb-8 tracking-tighter">
              Account <br />
              <span className="text-blue-300">Recovery.</span>
            </h1>
            <p className="text-white/70 text-xl max-w-md leading-relaxed font-medium">
              Securely regain access to your elite banking ecosystem via SMS verification.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 text-blue-200 text-sm font-bold uppercase tracking-widest">
          Coastal Auto Tech Cooperative Credit Union
        </div>
      </motion.div>

      {/* Right Column - Recovery Interface */}
      <main className="flex-1 flex flex-col justify-center items-center py-16 px-8 relative bg-slate-50 overflow-hidden">
        <div className="w-full max-w-md relative z-10 animate-[fadeIn_0.5s_ease-out]">
          {/* Solid Professional Card Container */}
          <div className="p-8 lg:p-12 rounded-2xl bg-white shadow-[0_20px_50px_rgb(0,0,0,0.07)] border border-slate-200">
            <div className="mb-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white rounded-2xl border-2 border-slate-100">
                  <img src={logo} alt="Coastal Logo" className="w-12 h-12 object-contain" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-[#001D3A] mb-3 leading-tight uppercase tracking-tight">
                Password <br /> Recovery
              </h2>
              <p className="text-slate-600 font-bold text-sm uppercase tracking-wider">
                SMS Token Verification
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

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Enter your Login ID or registered email. We will send a secure recovery link via
                    SMS to your verified mobile number.
                  </p>

                  <div className="group relative">
                    <label
                      htmlFor="forgot-email"
                      className="block text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 ml-1"
                    >
                      Login ID / Email
                    </label>
                    <div className="relative">
                      <input
                        id="forgot-email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                        className="w-full bg-white border-slate-300 focus:bg-white text-slate-900 px-5 py-4 rounded-xl transition-all outline-none border-2 focus:ring-4 focus:ring-[#0052CC]/10 focus:border-[#0052CC] font-bold text-base shadow-sm placeholder:text-slate-400"
                        placeholder="Enter your registered email"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors">
                        <User className="w-5 h-5" />
                      </span>
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
                    {isLoading ? 'Processing...' : 'Send SMS Recovery Link'}
                  </Button>
                </div>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 bg-blue-50 text-[#0052CC] border-2 border-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Check Your Phone</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-8">
                  If <strong>{email}</strong> matches an active account, a secure SMS recovery link
                  has been dispatched to the registered mobile device.
                </p>
                <p className="text-slate-500 text-xs italic">Link expires in 15 minutes.</p>
              </motion.div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
              <Link
                to="/login"
                className="flex items-center gap-2 text-sm font-bold text-[#0052CC] hover:text-[#001D3A] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
