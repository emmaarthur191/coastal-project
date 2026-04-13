import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';
import { Button } from '../components/ui/Button';
import { 
  AlertCircle, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight
} from 'lucide-react';
import './Login.css';

// Type definitions
interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  user?: { role?: string };
}

/**
 * Premium, high-fidelity login component with frost-glass aesthetics and motion backgrounds.
 */
function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setFormErrors({ submit: 'Authentication credentials required.' });
      return;
    }
    setIsLoading(true);
    setFormErrors({});
    try {
      const result = await login(formData.email, formData.password) as LoginResult;
      if (result.success) {
        const userRole = result.user?.role;
        const roleRoutes: Record<string, string> = {
          customer: '/member-dashboard',
          cashier: '/cashier-dashboard',
          mobile_banker: '/mobile-banker-dashboard',
          manager: '/manager-dashboard',
          operations_manager: '/operations-dashboard',
          administrator: '/dashboard',
          superuser: '/dashboard',
        };
        const targetRoute = roleRoutes[userRole || ''] || '/dashboard';
        setTimeout(() => navigate(targetRoute), 800);
      } else {
        setFormErrors({ submit: result.error || 'Access Denied: Invalid Login ID or Password' });
        passwordInputRef.current?.focus();
      }
    } catch (_err) {
      setFormErrors({ submit: 'Connection Latency: Gateway unreachable.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-white">
      {/* Left Column - Branding (Vibrant Blue Gradient) */}
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
            transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
            className="mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-300 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Established 2026</span>
            <h1 className="text-8xl font-black text-white leading-[0.85] mb-8 tracking-tighter">
              Finance <br/>
              <span className="text-blue-300">Perfected.</span>
            </h1>
            <p className="text-white/70 text-xl max-w-md leading-relaxed font-medium">
              Join the elite ecosystem of modern practitioners and high-growth professionals.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 text-white/20 text-[10px] font-black uppercase tracking-[0.6em]">
          Coastal Auto Tech Cooperative Credit Union
        </div>
      </motion.div>

      {/* Right Column - Frost Glass White Login Interface */}
      <main className="flex-1 flex flex-col justify-center items-center py-16 px-8 relative bg-slate-50/50 overflow-hidden">
        {/* Animated Background Elements for Frost Glass Depth */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ 
              x: [0, 50, 0], 
              y: [0, -30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-40"
          />
          <motion.div 
            animate={{ 
              x: [0, -40, 0], 
              y: [0, 60, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-60"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
          className="w-full max-w-md relative z-10"
        >
          {/* Frost Glass Card Container */}
          <div className="p-8 lg:p-10 rounded-[2rem] glass-premium backdrop-blur-3xl">
            <div className="mb-8 text-center bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 ring-4 ring-slate-100/50">
                  <img src={logo} alt="Coastal Logo" className="w-12 h-12 object-contain" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter leading-tight uppercase">Coastal AutoTech <br/> Credit Union</h2>
              <p className="text-slate-900 font-black text-[10px] uppercase tracking-widest opacity-60">Secure membership authentication</p>
            </div>

            <AnimatePresence mode="wait">
              {formErrors.submit && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6 p-4 bg-red-50/50 backdrop-blur-sm border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-3 font-bold shadow-sm"
                >
                  <AlertCircle className="w-5 h-5" /> {formErrors.submit}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="group relative">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] mb-2 ml-1">Login ID</label>
                  <div className="relative">
                    <input
                      ref={emailInputRef}
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-white/30 border-white focus:bg-white text-slate-950 px-6 py-4 rounded-2xl transition-all outline-none border focus:ring-8 focus:ring-blue-600/5 focus:border-blue-600 font-bold text-base shadow-sm placeholder:text-slate-300"
                      placeholder="Enter Login ID"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                      <User className="w-5 h-5" />
                    </span>
                  </div>
                </div>

                <div className="group">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Password</label>
                    <Link to="/forgot-password" title="Forgot password link" className="text-slate-900 hover:text-blue-600 transition-colors text-[9px] font-black uppercase tracking-widest underline decoration-slate-900/20 underline-offset-4">Reset Password</Link>
                  </div>
                  <div className="relative">
                    <input
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full bg-white/30 border-white focus:bg-white text-slate-950 px-6 py-4 rounded-2xl transition-all outline-none border focus:ring-8 focus:ring-blue-600/5 focus:border-blue-600 font-bold text-base shadow-sm placeholder:text-slate-300"
                      placeholder="••••••••••••"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest opacity-60">{showPassword ? 'Hide' : 'Show'}</span>
                      {showPassword ? <EyeOff className="w-4 h-4 text-slate-900" /> : <Eye className="w-4 h-4 text-slate-900" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  variant="primary"
                  className="w-full py-5 rounded-2xl text-lg shadow-xl shadow-blue-200 font-black uppercase tracking-[0.4em] transition-all hover:translate-y-[-2px] active:translate-y-[1px] bg-[#0052CC] hover:bg-[#0041a3] text-white border-none group"
                >
                  {isLoading ? 'Processing...' : (
                    <span className="flex items-center justify-center gap-2">
                      Secure Access
                      <ArrowRight className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-10 flex items-center justify-between text-slate-900 text-[9px] font-black uppercase tracking-[0.3em] px-2 opacity-60">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Active Link
              </div>
              <div className="flex gap-4">
                <span className="hover:text-blue-600 cursor-pointer transition-colors border-b border-transparent hover:border-slate-900">Security Audit</span>
                <span className="hover:text-blue-600 cursor-pointer transition-colors border-b border-transparent hover:border-slate-900">Help Center</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default LoginPage;
