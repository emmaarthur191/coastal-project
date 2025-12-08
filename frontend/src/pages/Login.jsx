import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Production-ready, accessible login component with modern best practices
 * Features WCAG 2.1 AA compliance, comprehensive validation, and responsive design
 */
function LoginPage() {
  // State management
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    role: 'member'
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
  const { login } = useAuth();
  const navigate = useNavigate();

  // Password validation rules
  const passwordRules = [
    { test: (password) => password.length >= 8, message: 'At least 8 characters long' },
    { test: (password) => /[A-Z]/.test(password), message: 'One uppercase letter' },
    { test: (password) => /[a-z]/.test(password), message: 'One lowercase letter' },
    { test: (password) => /\d/.test(password), message: 'One number' },
    { test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), message: 'One special character' },
  ];

  // Email validation
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    if (email.length > 254) return 'Email address is too long';
    return null;
  }, []);

  // Password validation
  const validatePassword = useCallback((password) => {
    if (!password) return 'Password is required';
    const failingRules = passwordRules.filter(rule => !rule.test(password));
    return failingRules;
  }, [passwordRules]);

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
      const result = await login(formData.email, formData.password, formData.role);

      if (result.success) {
        setSuccessMessage('Login successful! Redirecting...');

        // Store remember me preference
        if (formData.rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Navigate after brief delay for UX
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
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

  // Enhanced password strength calculation
  const getPasswordStrength = useCallback((password) => {
    if (!password) return 0;
    
    let strength = 0;
    passwordRules.forEach(rule => {
      if (rule.test(password)) strength += 20;
    });
    
    // Length bonus
    if (password.length > 12) strength += 20;
    else if (password.length > 8) strength += 10;
    
    return Math.min(100, strength);
  }, [passwordRules]);

  const passwordStrength = getPasswordStrength(formData.password);

  // Keyboard navigation support
  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Skip to main content link for screen readers */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-500 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>


      {/* Main login container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-3xl mb-6 shadow-elevated">
            <svg 
              className="w-10 h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-neutral-600 text-lg">
            Coastal Auto Tech Cooperative Credit Union
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-50 rounded-full border border-primary-200">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse-gentle" aria-hidden="true"></div>
            <span className="text-sm font-medium text-primary-700">Secure Banking Portal</span>
          </div>
        </div>
      </div>

      {/* Login form card */}
      <main id="main-content" className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-float rounded-2xl border border-neutral-200 sm:px-10 relative animate-scale-in">
          
          {/* Error summary for screen readers */}
          {(formErrors.submit || Object.keys(formErrors).length > 1) && (
            <div 
              ref={errorSummaryRef}
              className="mb-6 p-4 bg-error-50 border border-error-200 rounded-xl"
              role="alert"
              aria-labelledby="error-summary-title"
              tabIndex={-1}
            >
              <h2 id="error-summary-title" className="text-sm font-semibold text-error-800 mb-2">
                Please fix the following errors:
              </h2>
              <ul className="list-disc list-inside text-sm text-error-700 space-y-1">
                {formErrors.submit && <li>{formErrors.submit}</li>}
                {formErrors.email && <li>{formErrors.email}</li>}
                {formErrors.password && <li>{formErrors.password}</li>}
              </ul>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div 
              className="mb-6 p-4 bg-success-50 border border-success-200 rounded-xl animate-slide-down"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-success-800">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} ref={formRef} noValidate className="space-y-6">
            
            {/* Role selection */}
            <div>
              <label 
                htmlFor="role" 
                className="block text-sm font-semibold text-neutral-700 mb-2"
              >
                Access Role <span className="text-error-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 font-medium focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 appearance-none cursor-pointer min-h-touch"
                  aria-describedby="role-help"
                  aria-required="true"
                >
                  <option value="member"> Member - Personal Banking</option>
                  <option value="cashier"> Cashier - Teller Services</option>
                  <option value="mobile_banker"> Mobile Banker - Field Services</option>
                  <option value="manager"> Manager - Branch Management</option>
                  <option value="operations_manager"> Operations Manager - System Admin</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" aria-hidden="true">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p id="role-help" className="mt-1 text-sm text-neutral-500">
                Select your access level to continue
              </p>
            </div>

            {/* Email input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-neutral-700 mb-2"
              >
                Email Address <span className="text-error-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  ref={emailInputRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => clearFieldError('email')}
                  required
                  placeholder="Enter your email address"
                  className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-xl text-neutral-900 placeholder-neutral-400 focus:bg-white focus:ring-4 transition-all duration-200 min-h-touch ${
                    formErrors.email 
                      ? 'border-error-500 focus:border-error-500 focus:ring-error-100' 
                      : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-100'
                  }`}
                  aria-describedby={formErrors.email ? 'email-error' : undefined}
                  aria-invalid={!!formErrors.email}
                  aria-required="true"
                />
              </div>
              {formErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-error-600 flex items-center gap-1" role="alert">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Password input */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-neutral-700 mb-2"
              >
                Password <span className="text-error-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => clearFieldError('password')}
                  required
                  placeholder="Enter your password"
                  className={`w-full pl-12 pr-12 py-3.5 bg-white border rounded-xl text-neutral-900 placeholder-neutral-400 focus:bg-white focus:ring-4 transition-all duration-200 min-h-touch ${
                    formErrors.password 
                      ? 'border-error-500 focus:border-error-500 focus:ring-error-100' 
                      : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-100'
                  }`}
                  aria-describedby={formErrors.password ? 'password-error' : 'password-help'}
                  aria-invalid={!!formErrors.password}
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  onKeyDown={(e) => handleKeyDown(e, () => setShowPassword(!showPassword))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                    <span>Password strength</span>
                    <span className={
                      passwordStrength < 40 ? 'text-error-600' :
                      passwordStrength < 80 ? 'text-warning-600' : 'text-success-600'
                    }>
                      {passwordStrength < 40 ? 'Weak' : passwordStrength < 80 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2" role="progressbar" aria-valuenow={passwordStrength} aria-valuemin="0" aria-valuemax="100" aria-label="Password strength">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength < 40 ? 'bg-error-500' :
                        passwordStrength < 80 ? 'bg-warning-500' : 'bg-success-500'
                      }`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {formErrors.password && (
                <p id="password-error" className="mt-1 text-sm text-error-600 flex items-center gap-1" role="alert">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formErrors.password}
                </p>
              )}
              <p id="password-help" className="mt-1 text-sm text-neutral-500">
                Use at least 8 characters with uppercase, lowercase, numbers, and symbols
              </p>
            </div>

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded transition-colors"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-700">
                  Remember me
                </label>
              </div>
              <Link 
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-lg font-semibold transition-all duration-200 min-h-touch relative overflow-hidden"
              aria-describedby="submit-help"
              aria-label={isLoading ? 'Signing in, please wait' : 'Sign in to your account'}
            >
              {isLoading ? (
                <>
                  <div className="spinner w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" aria-hidden="true"></div>
                  <span>Signing in...</span>
                  <div className="absolute inset-0 bg-white opacity-20 animate-shimmer" aria-hidden="true"></div>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In Securely</span>
                </>
              )}
            </button>
            <p id="submit-help" className="sr-only">
              {isLoading ? 'Form is being submitted, please wait' : 'Click to sign in to your account'}
            </p>
          </form>



          {/* Registration link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
              >
                Create one here
              </Link>
            </p>
          </div>

          {/* Security notice */}
          <div className="mt-8 pt-6 border-t border-neutral-100">
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
              <svg className="w-4 h-4 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">256-bit SSL Encrypted • PCI DSS Compliant</span>
            </div>
            <p className="text-center text-xs text-neutral-400 mt-2">
              © 2025 Coastal Auto Tech Cooperative Credit Union. All rights reserved.
            </p>
          </div>
        </div>

        {/* Additional trust indicators */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center border border-neutral-100 shadow-soft">
            <div className="text-primary-600 font-bold text-lg">24/7</div>
            <div className="text-xs text-neutral-600 mt-1">Support</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center border border-neutral-100 shadow-soft">
            <div className="text-success font-bold text-lg">100%</div>
            <div className="text-xs text-neutral-600 mt-1">Secure</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center border border-neutral-100 shadow-soft">
            <div className="text-warning-600 font-bold text-lg">FDIC</div>
            <div className="text-xs text-neutral-600 mt-1">Insured</div>
          </div>
        </div>
      </main>

      {/* Live region for announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="live-region"
      >
        {successMessage || Object.values(formErrors).join(', ')}
      </div>
    </div>
  );
}

export default LoginPage;