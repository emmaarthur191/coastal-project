import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Phone, AlertCircle, CheckCircle, RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';

/**
 * StaffOTPVerificationPage - First-login OTP verification for new staff members
 *
 * New staff created by superuser must verify their phone number via OTP
 * before accessing their role-specific dashboard.
 */
const StaffOTPVerificationPage = () => {
    const navigate = useNavigate();
    const { user, checkAuth, getDashboardRoute } = useAuth();

    // OTP state
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpExpiresIn, setOtpExpiresIn] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

    // OTP expiration time (5 minutes)
    const OTP_EXPIRATION_SECONDS = 300;
    const MAX_ATTEMPTS = 5;
    const BLOCK_DURATION_SECONDS = 300; // 5 minutes block after max attempts

    // Countdown timer for OTP expiration
    useEffect(() => {
        let timer;
        if (otpExpiresIn > 0) {
            timer = setInterval(() => {
                setOtpExpiresIn(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setError('OTP code has expired. Please request a new one.');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [otpExpiresIn]);

    // Block timer countdown
    useEffect(() => {
        let timer;
        if (blockTimeRemaining > 0) {
            timer = setInterval(() => {
                setBlockTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsBlocked(false);
                        setAttempts(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [blockTimeRemaining]);

    // If user is already verified, redirect to dashboard
    useEffect(() => {
        // SECURITY: OTP verification status is tracked on the backend (user.otp_verified)
        // Do NOT rely on localStorage for security-sensitive state
        if (user?.otp_verified) {
            const dashboardRoute = getDashboardRoute ? getDashboardRoute() : '/dashboard';
            navigate(dashboardRoute, { replace: true });
        }
    }, [user, navigate, getDashboardRoute]);

    // Send OTP to user's phone
    const handleSendOTP = async () => {
        if (isBlocked) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const phone = user?.phone || user?.two_factor_phone;
            if (!phone) {
                throw new Error('No phone number found on your account. Please contact an administrator.');
            }

            const response = await authService.sendOTP({
                phone_number: phone,
                verification_type: 'staff_onboarding'
            });

            if (response.success) {
                setOtpSent(true);
                setOtpExpiresIn(OTP_EXPIRATION_SECONDS);
                setSuccess('OTP code sent to your phone. Please check your messages.');
                setError('');
            } else {
                throw new Error(response.error || 'Failed to send OTP');
            }
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP code
    const handleVerifyOTP = async () => {
        if (isBlocked || !otpCode || otpCode.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const phone = user?.phone || user?.two_factor_phone;

            const response = await authService.verifyOTP({
                phone_number: phone,
                otp_code: otpCode,
                verification_type: 'staff_onboarding'
            });

            if (response.success) {
                // SECURITY: OTP verification is tracked on the backend via user.otp_verified
                // The checkAuth() call below will refresh the user state from the server

                setSuccess('Phone verified successfully! Redirecting to your dashboard...');

                // Refresh auth state and redirect
                await checkAuth();

                setTimeout(() => {
                    const dashboardRoute = getDashboardRoute ? getDashboardRoute() : '/dashboard';
                    navigate(dashboardRoute, { replace: true });
                }, 1500);
            } else {
                // Handle invalid OTP
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= MAX_ATTEMPTS) {
                    setIsBlocked(true);
                    setBlockTimeRemaining(BLOCK_DURATION_SECONDS);
                    setError(`Too many failed attempts. Please wait ${Math.ceil(BLOCK_DURATION_SECONDS / 60)} minutes before trying again.`);
                } else {
                    setError(`Invalid OTP code. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
                }
                setOtpCode('');
            }
        } catch (err) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            if (newAttempts >= MAX_ATTEMPTS) {
                setIsBlocked(true);
                setBlockTimeRemaining(BLOCK_DURATION_SECONDS);
                setError(`Too many failed attempts. Please wait ${Math.ceil(BLOCK_DURATION_SECONDS / 60)} minutes before trying again.`);
            } else {
                setError(err.message || 'Verification failed. Please try again.');
            }
            setOtpCode('');
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP input change (only allow digits)
    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtpCode(value);
        setError('');
    };

    // Handle resend OTP
    const handleResendOTP = () => {
        setOtpCode('');
        setOtpSent(false);
        setOtpExpiresIn(0);
        setError('');
        setSuccess('');
        handleSendOTP();
    };

    // Format time for display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Role display names
    const roleDisplayNames = {
        cashier: 'Cashier',
        mobile_banker: 'Mobile Banker',
        manager: 'Manager',
        operations_manager: 'Operations Manager',
        administrator: 'Administrator',
        superuser: 'Superuser',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6 shadow-lg">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Identity</h1>
                    <p className="text-gray-600">
                        Welcome, {user?.first_name || 'Staff Member'}!
                        <br />
                        <span className="text-sm">Complete phone verification to access your <strong>{roleDisplayNames[user?.role] || 'Staff'}</strong> dashboard.</span>
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Phone Info */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
                        <Phone className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="text-sm text-gray-500">Verification will be sent to:</p>
                            <p className="font-medium text-gray-900">
                                {user?.phone ? `${user.phone.slice(0, 4)}****${user.phone.slice(-4)}` : 'No phone registered'}
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-green-700 text-sm">{success}</p>
                        </div>
                    )}

                    {/* Blocked State */}
                    {isBlocked ? (
                        <div className="text-center py-8">
                            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Temporarily Locked</h3>
                            <p className="text-gray-600 mb-4">Too many failed attempts. Please wait before trying again.</p>
                            <div className="text-2xl font-mono font-bold text-amber-600">
                                {formatTime(blockTimeRemaining)}
                            </div>
                        </div>
                    ) : !otpSent ? (
                        /* Send OTP Button */
                        <button
                            onClick={handleSendOTP}
                            disabled={loading || !user?.phone}
                            className="w-full py-4 px-6 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Phone className="w-5 h-5" />
                                    Send Verification Code
                                </>
                            )}
                        </button>
                    ) : (
                        /* OTP Input and Verify */
                        <div className="space-y-6">
                            {/* OTP Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter 6-digit verification code
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={handleOtpChange}
                                    placeholder="000000"
                                    className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 px-6 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoFocus
                                    disabled={loading}
                                />
                            </div>

                            {/* Timer */}
                            {otpExpiresIn > 0 && (
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">
                                        Code expires in: <span className="font-mono font-semibold text-blue-600">{formatTime(otpExpiresIn)}</span>
                                    </p>
                                </div>
                            )}

                            {/* Verify Button */}
                            <button
                                onClick={handleVerifyOTP}
                                disabled={loading || otpCode.length !== 6 || otpExpiresIn === 0}
                                className="w-full py-4 px-6 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Verify Code
                                    </>
                                )}
                            </button>

                            {/* Resend Option */}
                            <div className="text-center">
                                {otpExpiresIn === 0 ? (
                                    <button
                                        onClick={handleResendOTP}
                                        disabled={loading}
                                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                    >
                                        <RefreshCw className="w-4 h-4 inline mr-1" />
                                        Resend verification code
                                    </button>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Didn't receive the code? Wait for timer to resend.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>
                        Having trouble? Contact your administrator for assistance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StaffOTPVerificationPage;
