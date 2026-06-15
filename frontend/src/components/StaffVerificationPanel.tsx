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
      setDocuments((prev) => ({
        ...prev,
        [documentType]: acceptedFiles[0],
      }));
    }
  }, []);

  // Dropzone configurations
  const idDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'id_document'),
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const letterDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'employment_letter'),
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const photoDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'profile_photo'),
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024, // 2MB for photo
  });

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
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

      setSuccess(
        'Verification documents submitted successfully! An administrator will review your application.'
      );
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
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 transition-colors duration-500">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 dark:bg-amber-500 rounded-2xl mb-4 transition-colors duration-300">
            <Shield className="w-8 h-8 text-white dark:text-slate-950" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
            Staff Verification
          </h1>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
            Welcome, {user?.first_name || 'Staff Member'}! Complete your verification to access your{' '}
            {roleDisplayNames[user?.role] || 'Staff'} dashboard.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= s
                    ? 'bg-blue-600 text-white dark:bg-amber-500 dark:text-slate-950'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 transition-all duration-300 ${step > s ? 'bg-blue-600 dark:bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-550/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3 transition-colors duration-300">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400 text-[10px] font-bold uppercase tracking-wide">
              {error}
            </p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50/50 dark:bg-emerald-550/10 border border-green-200 dark:border-emerald-550/20 rounded-xl flex items-start gap-3 transition-colors duration-300">
            <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wide">
              {success}
            </p>
          </div>
        )}

        {/* Step 1: Document Upload */}
        {step === 1 && (
          <div className="bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-lg p-8 backdrop-blur-md relative overflow-hidden transition-all duration-300">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-amber-500" />
              Upload Verification Documents
            </h2>

            {/* ID Document */}
            <div className="mb-6">
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                ID Document (Required) *
              </label>
              <div
                {...idDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                  idDropzone.isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:border-amber-500 dark:bg-amber-500/5'
                    : documents.id_document
                      ? 'border-emerald-500 bg-emerald-50/50 dark:border-emerald-550/20 dark:bg-emerald-550/5'
                      : 'border-slate-300 dark:border-slate-800 hover:border-blue-400 dark:hover:border-amber-500'
                }`}
              >
                <input {...idDropzone.getInputProps()} />
                {documents.id_document ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-[10px] font-mono font-bold tracking-tight">
                      {documents.id_document.name}
                    </span>
                  </div>
                ) : (
                  <div className="text-slate-400 dark:text-slate-500">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-550" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-650 dark:text-slate-450">
                      Drop your ID document here or click to browse
                    </p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-550 mt-1">
                      PNG, JPG or PDF up to 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Employment Letter */}
            <div className="mb-6">
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                Employment Letter (Optional)
              </label>
              <div
                {...letterDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                  letterDropzone.isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:border-amber-500 dark:bg-amber-500/5'
                    : documents.employment_letter
                      ? 'border-emerald-500 bg-emerald-50/50 dark:border-emerald-550/20 dark:bg-emerald-550/5'
                      : 'border-slate-300 dark:border-slate-800 hover:border-blue-400 dark:hover:border-amber-500'
                }`}
              >
                <input {...letterDropzone.getInputProps()} />
                {documents.employment_letter ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-[10px] font-mono font-bold tracking-tight">
                      {documents.employment_letter.name}
                    </span>
                  </div>
                ) : (
                  <div className="text-slate-400 dark:text-slate-500">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-550" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-650 dark:text-slate-450">
                      Drop your employment letter here or click to browse
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Photo */}
            <div className="mb-8">
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                Profile Photo (Required) *
              </label>
              <div
                {...photoDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                  photoDropzone.isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:border-amber-500 dark:bg-amber-500/5'
                    : documents.profile_photo
                      ? 'border-emerald-500 bg-emerald-50/50 dark:border-emerald-550/20 dark:bg-emerald-550/5'
                      : 'border-slate-300 dark:border-slate-800 hover:border-blue-400 dark:hover:border-amber-500'
                }`}
              >
                <input {...photoDropzone.getInputProps()} />
                {documents.profile_photo ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-[10px] font-mono font-bold tracking-tight">
                      {documents.profile_photo.name}
                    </span>
                  </div>
                ) : (
                  <div className="text-slate-400 dark:text-slate-500">
                    <User className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-550" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-650 dark:text-slate-450">
                      Drop your profile photo here or click to browse
                    </p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-550 mt-1">
                      PNG or JPG up to 2MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!documents.id_document || !documents.profile_photo}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-950 text-white dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:text-slate-200 font-black uppercase text-[9px] tracking-widest rounded-xl transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              Continue to Profile Information
            </button>
          </div>
        )}

        {/* Step 2: Profile Information */}
        {step === 2 && (
          <div className="bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-lg p-8 backdrop-blur-md relative overflow-hidden transition-all duration-300">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600 dark:text-amber-500" />
              Complete Your Profile
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="staff-phone"
                  className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5"
                >
                  Phone Number *
                </label>
                <input
                  id="staff-phone"
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  autoComplete="tel"
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/20 border border-slate-350 dark:border-slate-800/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-amber-500/20 dark:focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white text-xs font-mono transition-all duration-300 placeholder-slate-400 dark:placeholder-slate-650"
                  placeholder="+233 XX XXX XXXX"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="staff-address"
                  className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5"
                >
                  Address *
                </label>
                <textarea
                  id="staff-address"
                  name="address"
                  value={profile.address}
                  onChange={handleProfileChange}
                  autoComplete="street-address"
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/20 border border-slate-350 dark:border-slate-800/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-amber-500/20 dark:focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white text-xs font-mono transition-all duration-300 placeholder-slate-400 dark:placeholder-slate-650"
                  placeholder="Your residential address"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="staff-emergency-contact"
                  className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5"
                >
                  Emergency Contact Name
                </label>
                <input
                  id="staff-emergency-contact"
                  type="text"
                  name="emergency_contact"
                  value={profile.emergency_contact}
                  onChange={handleProfileChange}
                  autoComplete="name"
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/20 border border-slate-350 dark:border-slate-800/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-amber-500/20 dark:focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white text-xs font-mono transition-all duration-300 placeholder-slate-400 dark:placeholder-slate-650"
                  placeholder="Name of emergency contact"
                />
              </div>

              <div>
                <label
                  htmlFor="staff-emergency-phone"
                  className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5"
                >
                  Emergency Contact Phone
                </label>
                <input
                  id="staff-emergency-phone"
                  type="tel"
                  name="emergency_phone"
                  value={profile.emergency_phone}
                  onChange={handleProfileChange}
                  autoComplete="tel"
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/20 border border-slate-350 dark:border-slate-800/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-amber-500/20 dark:focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white text-xs font-mono transition-all duration-300 placeholder-slate-400 dark:placeholder-slate-650"
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 px-4 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-black uppercase text-[9px] tracking-widest rounded-xl transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !profile.phone || !profile.address}
                className="flex-1 py-3.5 px-4 bg-blue-600 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-blue-700 dark:hover:bg-amber-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed font-black uppercase text-[9px] tracking-widest rounded-xl transition-all duration-300 shadow-md hover:scale-[1.01]"
              >
                {loading ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pending Approval */}
        {step === 3 && (
          <div className="bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-lg p-8 text-center backdrop-blur-md relative overflow-hidden transition-all duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200/50 dark:border-emerald-500/25">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-450" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
              Verification Submitted!
            </h2>
            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight mb-6 leading-relaxed">
              Your documents have been submitted successfully. An administrator will review your
              application and activate your account shortly.
            </p>
            <p className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">
              You will receive an email notification once your account is verified.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-8 w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-950 text-white dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:text-slate-200 font-black uppercase text-[9px] tracking-widest rounded-xl transition-all duration-300 shadow-md"
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
