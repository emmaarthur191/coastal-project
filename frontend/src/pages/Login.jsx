import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';

/**
 * Production-ready, accessible login component with modern best practices
 * Features WCAG 2.1 AA compliance, comprehensive validation, and responsive design
 */
function LoginPage() {
  // State management
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [validationWarnings, setValidationWarnings] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lastInput, setLastInput] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Accessibility and refs
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const formRef = useRef(null);
  const errorSummaryRef = useRef(null);
  const { login, checkAuth, getDashboardRoute, user } = useAuth();
  const navigate = useNavigate();

  // Password validation disabled - we only check if password exists now
  // Complex password rules are handled by the backend during registration

  // Email validation
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    if (email.length > 254) return 'Email address is too long';
    return null;
  }, []);

  // Password validation - simplified (just require password exists)
  const validatePassword = useCallback((password) => {
    if (!password) return [{ message: 'Password is required' }];
    return []; // No complex rules - just need a password
  }, []);

  // Real-time validation
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'email':
        const emailError = validateEmail(value);
        return { email: emailError };
      case 'password':
        const passwordErrors = validatePassword(value);
        return {
          password: passwordErrors.length > 0 ?
            `Password must contain: ${passwordErrors.map(rule => rule.message).join(', ')}` :
            null
        };
      default:
        return {};
    }
  }, [validateEmail, validatePassword]);

  // Update form data and validate
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Real-time validation for focused field
    if (name === 'email' || name === 'password') {
      const errors = validateField(name, newValue);
      setFormErrors(prev => ({ ...prev, ...errors }));
    }

    setLastInput(name);
  }, [validateField]);

  // Form validation on submit
  const validateForm = useCallback(() => {
    const errors = {};

    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    // Password validation
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      errors.password = `Password must contain: ${passwordErrors.map(rule => rule.message).join(', ')}`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.email, formData.password, validateEmail, validatePassword]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Focus first error field
      if (errorSummaryRef.current) {
        errorSummaryRef.current.focus();
      } else if (emailInputRef.current && formErrors.email) {
        emailInputRef.current.focus();
      } else if (passwordInputRef.current && formErrors.password) {
        passwordInputRef.current.focus();
      }
      return;
    }

    setIsLoading(true);
    setFormErrors({});
    setSuccessMessage('');

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        setSuccessMessage('Login successful! Redirecting...');

        // Store remember me preference
        if (formData.rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Calculate route directly from login response user data (not async state)
        const userRole = result.user?.role;
        console.log('[DEBUG] User role from login response:', userRole);

        const roleRoutes = {
          customer: '/member-dashboard',
          cashier: '/cashier-dashboard',
          mobile_banker: '/mobile-banker-dashboard',
          manager: '/manager-dashboard',
          operations_manager: '/operations-dashboard',
          administrator: '/dashboard',
          superuser: '/dashboard',
        };

        const targetRoute = roleRoutes[userRole] || '/dashboard';
        console.log('[DEBUG] Calculated target route:', targetRoute);

        // Navigate using React Router to preserve state (User object from login response)
        // This avoids a full page reload which would lose the state and force a checkAuth (which might fail if cookies aren't ready)
        navigate(targetRoute);
      } else {
        setFormErrors({ submit: result.error || 'Login failed. Please try again.' });
        passwordInputRef.current?.focus();
      }
    } catch (error) {
      setFormErrors({
        submit: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear specific field error
  const clearFieldError = (fieldName) => {
    setFormErrors(prev => ({ ...prev, [fieldName]: undefined }));
  };

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }
  }, []);

  // Pre-fill email from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const prefillEmail = urlParams.get('email');
    if (prefillEmail) {
      setFormData(prev => ({ ...prev, email: prefillEmail }));
    }
  }, []);

  // Simplified password strength calculation (for login, not registration)
  const getPasswordStrength = useCallback((password) => {
    if (!password) return 0;

    let strength = 0;

    // Basic checks for visual feedback
    if (password.length >= 8) strength += 25;
    if (password.length > 12) strength += 15;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;

    return Math.min(100, strength);
  }, []);

  const passwordStrength = getPasswordStrength(formData.password);

  // Keyboard navigation support
  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Skip to main content link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50">
        Skip to main content
      </a>

      {/* Left Column - Hero/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 to-secondary-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-700/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-accent-600/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Coastal Banking Logo" className="h-16 w-auto object-contain bg-white/10 rounded-lg p-1 backdrop-blur-md border border-white/20" />
            <span className="text-white text-xl font-bold tracking-tight">Coastal Banking</span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight">
            Banking built for <span className="text-accent-400">your future.</span>
          </h1>
          <p className="text-primary-100 text-xl max-w-lg mb-8 leading-relaxed">
            Experience secure, seamless, and smart banking solutions designed to help you grow.
          </p>

          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white/90 text-sm">
              <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></span>
              System Operational
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white/90 text-sm">
              <span>🛡️</span> 256-bit Secure
            </div>
          </div>
        </div>

        <div className="relative z-10 text-primary-200 text-sm">
          © 2025 Coastal Auto Tech Cooperative Credit Union
        </div>
      </div>

      {/* Right Column - Login Form */}
      <main id="main-content" className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative">

        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="lg:hidden mb-10 text-center">
            <img src={logo} alt="Coastal Banking Logo" className="h-24 mx-auto mb-6 object-contain" />
            <h2 className="text-3xl font-bold text-secondary-900">Sign In</h2>
          </div>

          <div className="mb-8">
            <h2 className="hidden lg:block text-3xl font-bold text-secondary-900 mb-2">Welcome Back</h2>
            <p className="text-secondary-500">Please enter your credentials to access your account.</p>
          </div>

          {/* Error Summary */}
          {(formErrors.submit || Object.keys(formErrors).length > 1) && (
            <div ref={errorSummaryRef} className="mb-6 p-4 bg-error-50 border border-error-100 rounded-xl flex items-start ring-1 ring-error-200" role="alert" tabIndex={-1}>
              <span className="text-error-500 mt-0.5 mr-3">⚠️</span>
              <div>
                <h3 className="text-sm font-semibold text-error-800">Authentication Failed</h3>
                <ul className="mt-1 text-sm text-error-700 list-disc list-inside">
                  {formErrors.submit && <li>{formErrors.submit}</li>}
                  {formErrors.email && <li>{formErrors.email}</li>}
                  {formErrors.password && <li>{formErrors.password}</li>}
                </ul>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-success-50 border border-success-100 rounded-xl flex items-center ring-1 ring-success-200" role="alert">
              <span className="text-success-500 mr-3">✓</span>
              <p className="text-sm font-medium text-success-800">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} ref={formRef} noValidate className="space-y-6">



            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
                  📧
                </div>
                <input
                  ref={emailInputRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => clearFieldError('email')}
                  className={`block w-full pl-10 pr-3 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 text-sm transition-colors ${formErrors.email
                    ? 'border-error-300 focus:border-error-500 focus:ring-error-200 bg-error-50 text-error-900'
                    : 'bg-white border-secondary-300 focus:border-primary-500 focus:ring-primary-100 text-secondary-900'
                    }`}
                  placeholder="name@example.com"
                />
              </div>
              {formErrors.email && <p className="mt-1 text-sm text-error-600">{formErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700">Password</label>
                <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
                  🔒
                </div>
                <input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => clearFieldError('password')}
                  className={`block w-full pl-10 pr-10 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 text-sm transition-colors ${formErrors.password
                    ? 'border-error-300 focus:border-error-500 focus:ring-error-200 bg-error-50 text-error-900'
                    : 'bg-white border-secondary-300 focus:border-primary-500 focus:ring-primary-100 text-secondary-900'
                    }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600 cursor-pointer focus:outline-none"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              {/* Password Strength Bar */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-secondary-500 mb-1">
                    <span>Password Strength</span>
                    <span className={`${passwordStrength < 40 ? 'text-error-600' : 'text-success-600'}`}>
                      {passwordStrength < 40 ? 'Weak' : passwordStrength < 80 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength < 40 ? 'bg-error-500' :
                        passwordStrength < 80 ? 'bg-warning-500' : 'bg-success-500'
                        }`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}
              {formErrors.password && <p className="mt-1 text-sm text-error-600">{formErrors.password}</p>}
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-700 cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-wait transition-all"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2"></span>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-secondary-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Live Region */}
      <div className="sr-only" aria-live="polite">
        {successMessage || Object.values(formErrors).join(', ')}
      </div>
    </div>
  );
}

export default LoginPage;