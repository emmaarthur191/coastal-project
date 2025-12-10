import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, User, Shield, Briefcase } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Note: Staff verification endpoint will be created in backend

/**
 * StaffVerificationPanel - Document upload and verification for new staff members
 * 
 * New staff members created by superuser must:
 * 1. Upload required verification documents
 * 2. Complete their profile information
 * 3. Wait for admin approval before accessing dashboard
 */
const StaffVerificationPanel = () => {
    const navigate = useNavigate();
    const { user, checkAuth } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [step, setStep] = useState(1);

    // Document upload states
    const [documents, setDocuments] = useState({
        id_document: null,
        employment_letter: null,
        profile_photo: null,
    });

    // Profile form state
    const [profile, setProfile] = useState({
        phone: '',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        department: user?.role || '',
    });

    // Document upload handler
    const onDrop = useCallback((acceptedFiles, documentType) => {
        if (acceptedFiles.length > 0) {
            setDocuments(prev => ({
                ...prev,
                [documentType]: acceptedFiles[0]
            }));
        }
    }, []);

    // Dropzone configurations
    const idDropzone = useDropzone({
        onDrop: (files) => onDrop(files, 'id_document'),
        accept: { 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024 // 5MB
    });

    const letterDropzone = useDropzone({
        onDrop: (files) => onDrop(files, 'employment_letter'),
        accept: { 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024
    });

    const photoDropzone = useDropzone({
        onDrop: (files) => onDrop(files, 'profile_photo'),
        accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
        maxFiles: 1,
        maxSize: 2 * 1024 * 1024 // 2MB for photo
    });

    // Handle profile form changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    // Submit verification documents
    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validate all required documents
            if (!documents.id_document) {
                throw new Error('Please upload your ID document');
            }
            if (!documents.profile_photo) {
                throw new Error('Please upload your profile photo');
            }

            // Validate profile information
            if (!profile.phone || !profile.address) {
                throw new Error('Please complete all required profile fields');
            }

            // Create form data for file upload
            const formData = new FormData();
            formData.append('id_document', documents.id_document);
            if (documents.employment_letter) {
                formData.append('employment_letter', documents.employment_letter);
            }
            formData.append('profile_photo', documents.profile_photo);
            formData.append('phone', profile.phone);
            formData.append('address', profile.address);
            formData.append('emergency_contact', profile.emergency_contact);
            formData.append('emergency_phone', profile.emergency_phone);
            formData.append('department', profile.department);

            // TODO: Submit to verification endpoint when backend is ready
            // For now, simulate successful submission
            // await fetch('/api/users/staff/verify/', { method: 'POST', body: formData });

            setSuccess('Verification documents submitted successfully! An administrator will review your application.');
            setStep(3);

            // Refresh auth state
            await checkAuth();
        } catch (err) {
            setError(err.message || 'Failed to submit verification documents');
        } finally {
            setLoading(false);
        }
    };

    // Role display names
    const roleDisplayNames = {
        cashier: 'Cashier',
        mobile_banker: 'Mobile Banker',
        manager: 'Manager',
        operations_manager: 'Operations Manager',
        administrator: 'Administrator',
    };

    // If user is already verified, redirect to dashboard
    if (user && !user.needs_verification) {
        const dashboardRoutes = {
            cashier: '/cashier-dashboard',
            mobile_banker: '/mobile-banker-dashboard',
            manager: '/manager-dashboard',
            operations_manager: '/operations-dashboard',
            administrator: '/dashboard',
            superuser: '/dashboard',
        };
        navigate(dashboardRoutes[user.role] || '/dashboard');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Verification</h1>
                    <p className="text-gray-600">
                        Welcome, {user?.first_name || 'Staff Member'}! Complete your verification to access your {roleDisplayNames[user?.role] || 'Staff'} dashboard.
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    {[1, 2, 3].map((s) => (
                        <React.Fragment key={s}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-green-700">{success}</p>
                    </div>
                )}

                {/* Step 1: Document Upload */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Upload Verification Documents
                        </h2>

                        {/* ID Document */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ID Document (Required) *
                            </label>
                            <div
                                {...idDropzone.getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${idDropzone.isDragActive ? 'border-blue-500 bg-blue-50' :
                                    documents.id_document ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                                    }`}
                            >
                                <input {...idDropzone.getInputProps()} />
                                {documents.id_document ? (
                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                        <CheckCircle className="w-5 h-5" />
                                        <span>{documents.id_document.name}</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-500">
                                        <Upload className="w-8 h-8 mx-auto mb-2" />
                                        <p>Drop your ID document here or click to browse</p>
                                        <p className="text-sm text-gray-400">PNG, JPG or PDF up to 5MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Employment Letter */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Employment Letter (Optional)
                            </label>
                            <div
                                {...letterDropzone.getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${letterDropzone.isDragActive ? 'border-blue-500 bg-blue-50' :
                                    documents.employment_letter ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                                    }`}
                            >
                                <input {...letterDropzone.getInputProps()} />
                                {documents.employment_letter ? (
                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                        <CheckCircle className="w-5 h-5" />
                                        <span>{documents.employment_letter.name}</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-500">
                                        <Briefcase className="w-8 h-8 mx-auto mb-2" />
                                        <p>Drop your employment letter here or click to browse</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Photo */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Profile Photo (Required) *
                            </label>
                            <div
                                {...photoDropzone.getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${photoDropzone.isDragActive ? 'border-blue-500 bg-blue-50' :
                                    documents.profile_photo ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                                    }`}
                            >
                                <input {...photoDropzone.getInputProps()} />
                                {documents.profile_photo ? (
                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                        <CheckCircle className="w-5 h-5" />
                                        <span>{documents.profile_photo.name}</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-500">
                                        <User className="w-8 h-8 mx-auto mb-2" />
                                        <p>Drop your profile photo here or click to browse</p>
                                        <p className="text-sm text-gray-400">PNG or JPG up to 2MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!documents.id_document || !documents.profile_photo}
                            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue to Profile Information
                        </button>
                    </div>
                )}

                {/* Step 2: Profile Information */}
                {step === 2 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Complete Your Profile
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="+233 XX XXX XXXX"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                                <textarea
                                    name="address"
                                    value={profile.address}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Your residential address"
                                    rows={2}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                                <input
                                    type="text"
                                    name="emergency_contact"
                                    value={profile.emergency_contact}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Name of emergency contact"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                                <input
                                    type="tel"
                                    name="emergency_phone"
                                    value={profile.emergency_phone}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="+233 XX XXX XXXX"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !profile.phone || !profile.address}
                                className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Submit for Verification'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Pending Approval */}
                {step === 3 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Submitted!</h2>
                        <p className="text-gray-600 mb-6">
                            Your documents have been submitted successfully. An administrator will review your application and activate your account shortly.
                        </p>
                        <p className="text-sm text-gray-500">
                            You will receive an email notification once your account is verified.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="mt-8 py-3 px-6 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Return to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffVerificationPanel;
