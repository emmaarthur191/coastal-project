import React, { useState, useRef, useCallback, useId } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';

/**
 * Account Opening Tab Component for Cashier Dashboard
 * Unified form matching Mobile Banker's ClientRegistrationTab with camera capture
 */
const AccountOpeningTab: React.FC = () => {
  // Response interfaces
  interface OtpResponse {
    debug_otp?: string;
  }

  interface SubmitResponse {
    success: boolean;
    account_id?: string;
    error?: string;
  }

  // Form data state - matching ClientRegistrationTab structure
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',

    // Identification
    idType: 'ghana_card',
    idNumber: '',

    // Employment Information
    occupation: '',
    workAddress: '',
    position: '',

    // Next of Kin (up to 4)
    nextOfKin: [
      { name: '', relationship: '', address: '', stakePercentage: '' }
    ],

    // Account Type
    accountType: 'daily_susu',
    cardType: 'standard',

    // Photo
    photo: null as string | null
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [newAccountId, setNewAccountId] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: OTP, 3: Success

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');

  const idTypeSelectId = useId();
  const accountTypeSelectId = useId();
  const cardTypeSelectId = useId();


  // === CAMERA FUNCTIONS ===
  const startCamera = useCallback(async () => {
    try {
      setShowCamera(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setShowCamera(false);
      setMessage({ type: 'error', text: 'Unable to access camera. Please check permissions or upload a photo.' });
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, photo: dataUrl }));
        stopCamera();
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removePhoto = useCallback(() => {
    setFormData(prev => ({ ...prev, photo: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // === FORM HANDLERS ===
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNextOfKinChange = useCallback((index: number, field: string, value: string) => {
    setFormData(prev => {
      const newNextOfKin = [...prev.nextOfKin];
      newNextOfKin[index] = { ...newNextOfKin[index], [field]: value };
      return { ...prev, nextOfKin: newNextOfKin };
    });
  }, []);

  const addNextOfKin = useCallback(() => {
    if (formData.nextOfKin.length < 4) {
      setFormData(prev => ({
        ...prev,
        nextOfKin: [...prev.nextOfKin, { name: '', relationship: '', address: '', stakePercentage: '' }]
      }));
    }
  }, [formData.nextOfKin.length]);

  const removeNextOfKin = useCallback((index: number) => {
    if (formData.nextOfKin.length > 1) {
      setFormData(prev => ({
        ...prev,
        nextOfKin: prev.nextOfKin.filter((_, i) => i !== index)
      }));
    }
  }, [formData.nextOfKin.length]);

  // === VALIDATION ===
  const validateForm = useCallback(() => {
    if (!formData.firstName.trim()) {
      setMessage({ type: 'error', text: 'First name is required' });
      return false;
    }
    if (!formData.lastName.trim()) {
      setMessage({ type: 'error', text: 'Last name is required' });
      return false;
    }
    if (!formData.dateOfBirth) {
      setMessage({ type: 'error', text: 'Date of birth is required' });
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setMessage({ type: 'error', text: 'Phone number is required' });
      return false;
    }
    if (!formData.idNumber.trim()) {
      setMessage({ type: 'error', text: 'ID number is required' });
      return false;
    }
    // Age validation
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      setMessage({ type: 'error', text: 'Customer must be at least 18 years old' });
      return false;
    }
    return true;
  }, [formData]);

  // === FORM SUBMISSION ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setCurrentStep(2);
    setMessage({ type: '', text: '' });
  };

  const sendOtp = async () => {
    if (!formData.phoneNumber.trim()) {
      setMessage({ type: 'error', text: 'Phone number is required' });
      return;
    }
    try {
      setOtpLoading(true);
      const response = await api.post<OtpResponse>('banking/account-openings/send-otp/', {
        phone_number: formData.phoneNumber,
        operation_type: 'account_opening'
      });
      setOtpSent(true);
      setDebugOtp(response.data?.debug_otp || '');
      setMessage({ type: 'success', text: `OTP sent to ${formData.phoneNumber}` });
    } catch (error) {
      console.error('Error sending OTP:', error);
      setMessage({ type: 'error', text: 'Failed to send OTP. Please try again.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyAndSubmit = async () => {
    if (!otpCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter the OTP code' });
      return;
    }
    try {
      setOtpLoading(true);
      const submitData = {
        account_type: formData.accountType,
        card_type: formData.cardType,
        id_type: formData.idType,
        id_number: formData.idNumber,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        phone_number: formData.phoneNumber,
        email: formData.email,
        occupation: formData.occupation,
        work_address: formData.workAddress,
        position: formData.position,
        next_of_kin: formData.nextOfKin,
        photo: formData.photo
      };

      const response = await api.post<SubmitResponse>('banking/account-openings/verify-and-submit/', {
        otp_code: otpCode,
        phone_number: formData.phoneNumber,
        account_data: submitData
      });

      if (response.data?.success) {
        setCurrentStep(3);
        setNewAccountId(response.data?.account_id || 'New Account');
        resetForm();
      } else {
        setMessage({ type: 'error', text: response.data?.error || 'Verification failed' });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setOtpLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', dateOfBirth: '', phoneNumber: '', email: '',
      idType: 'ghana_card', idNumber: '',
      occupation: '', workAddress: '', position: '',
      nextOfKin: [{ name: '', relationship: '', address: '', stakePercentage: '' }],
      accountType: 'daily_susu', cardType: 'standard', photo: null
    });
    setOtpCode('');
    setOtpSent(false);
    setDebugOtp('');
  };

  // === RENDER ===
  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <GlassCard className="p-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
          <span>👶</span> New Account Registration
        </h2>

        <div className="flex justify-center gap-4 mb-6">
          {[1, 2, 3].map(step => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep >= step ? 'bg-coastal-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                {step}
              </div>
              {step < 3 && <div className={`w-10 h-1 mx-2 ${currentStep > step ? 'bg-coastal-primary' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-10 text-sm text-gray-500">
          <span className={currentStep === 1 ? 'font-bold text-coastal-primary' : ''}>Registration Form</span>
          <span className={currentStep === 2 ? 'font-bold text-coastal-primary' : ''}>OTP Verification</span>
          <span className={currentStep === 3 ? 'font-bold text-coastal-primary' : ''}>Complete</span>
        </div>
      </GlassCard>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      {/* Step 1: Registration Form */}
      {currentStep === 1 && (
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Photo Capture Section */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><span>📷</span> Customer Photo</h3>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-40 h-48 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-inner flex-shrink-0">
                {formData.photo ? (
                  <img src={formData.photo} alt="Customer" className="w-full h-full object-cover" />
                ) : showCamera ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-4xl">👤</div>
                    <div className="text-xs mt-1">No Photo</div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-sm mb-4">
                  Capture or upload a passport-style photo for identification. This is required for account security.
                </p>
                <div className="flex flex-wrap gap-3">
                  {!showCamera && !formData.photo && (
                    <>
                      <Button type="button" onClick={startCamera} variant="primary">📸 Open Camera</Button>
                      <Button type="button" onClick={() => fileInputRef.current?.click()} variant="secondary">📁 Upload Photo</Button>
                    </>
                  )}
                  {showCamera && (
                    <>
                      <Button type="button" onClick={capturePhoto} variant="success">📷 Capture</Button>
                      <Button type="button" onClick={stopCamera} variant="danger">✕ Cancel</Button>
                    </>
                  )}
                  {formData.photo && (
                    <>
                      <Button type="button" onClick={removePhoto} variant="danger">🗑️ Remove</Button>
                      <Button type="button" onClick={startCamera} variant="secondary">🔄 Retake</Button>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-label="Upload customer photo"
                  title="Upload customer photo"
                />
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </GlassCard>

          {/* Personal Information */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><span>👤</span> Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="First Name *" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} placeholder="Enter first name" required />
              <Input label="Last Name *" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} placeholder="Enter last name" required />
              <Input label="Date of Birth *" type="date" value={formData.dateOfBirth} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} required />
              <Input label="Phone Number *" type="tel" value={formData.phoneNumber} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} placeholder="+233 XX XXX XXXX" required />
              <Input label="Email Address" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="customer@example.com" />
            </div>
          </GlassCard>

          {/* Identification */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><span>🪪</span> Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                as="select"
                label="ID Type *"
                id={idTypeSelectId}
                title="Select the type of ID provided by the customer"
                value={formData.idType}
                onChange={(e) => handleInputChange('idType', e.target.value)}
              >
                <option value="ghana_card">Ghana Card</option>
                <option value="voter_id">Voter ID</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
                <option value="nhis_card">NHIS Card</option>
              </Input>
              <Input label="ID Number *" value={formData.idNumber} onChange={(e) => handleInputChange('idNumber', e.target.value)} placeholder="Enter ID number" required />
            </div>
          </GlassCard>

          {/* Employment Information */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><span>💼</span> Employment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Occupation" value={formData.occupation} onChange={(e) => handleInputChange('occupation', e.target.value)} placeholder="e.g., Teacher, Trader" />
              <Input label="Position/Title" value={formData.position} onChange={(e) => handleInputChange('position', e.target.value)} placeholder="e.g., Senior Staff" />
              <div className="md:col-span-2">
                <Input label="Work Address" value={formData.workAddress} onChange={(e) => handleInputChange('workAddress', e.target.value)} placeholder="Enter work address" />
              </div>
            </div>
          </GlassCard>

          {/* Next of Kin */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><span>👨‍👩‍👧‍👦</span> Next of Kin (Beneficiaries)</h3>
            <div className="space-y-4">
              {formData.nextOfKin.map((kin, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-gray-600">Beneficiary {index + 1}</span>
                    {formData.nextOfKin.length > 1 && (
                      <button type="button" onClick={() => removeNextOfKin(index)} className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors">✕ Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input label="Full Name" value={kin.name} onChange={(e) => handleNextOfKinChange(index, 'name', e.target.value)} placeholder="Beneficiary name" />
                    <Input label="Relationship" value={kin.relationship} onChange={(e) => handleNextOfKinChange(index, 'relationship', e.target.value)} placeholder="e.g., Spouse" />
                    <Input label="Address" value={kin.address} onChange={(e) => handleNextOfKinChange(index, 'address', e.target.value)} placeholder="Beneficiary address" />
                    <Input label="Stake %" type="number" value={kin.stakePercentage} onChange={(e) => handleNextOfKinChange(index, 'stakePercentage', e.target.value)} placeholder="e.g., 50" />
                  </div>
                </div>
              ))}
            </div>
            {formData.nextOfKin.length < 4 && (
              <div className="mt-4">
                <Button type="button" onClick={addNextOfKin} variant="secondary" size="sm">➕ Add Another Beneficiary</Button>
              </div>
            )}
          </GlassCard>

          {/* Account Type */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><span>🏦</span> Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                as="select"
                label="Account Type *"
                id={accountTypeSelectId}
                title="Select the type of account to open"
                value={formData.accountType}
                onChange={(e) => handleInputChange('accountType', e.target.value)}
              >
                <option value="daily_susu">Daily Susu Account</option>
                <option value="shares">Shares Account</option>
                <option value="monthly_contribution">Monthly Contribution</option>
              </Input>
              <Input
                as="select"
                label="Card Type"
                id={cardTypeSelectId}
                title="Select the type of ATM card requested, if any"
                value={formData.cardType}
                onChange={(e) => handleInputChange('cardType', e.target.value)}
              >
                <option value="standard">Standard Card</option>
                <option value="gold">Gold Card</option>
                <option value="platinum">Platinum Card</option>
                <option value="none">No Card Required</option>
              </Input>
            </div>
          </GlassCard>

          {/* Submit Button */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
            <h3 className="text-gray-900 font-bold mb-2">Ready to Submit?</h3>
            <p className="text-gray-500 mb-4">
              Please review all information. OTP verification will be sent to customer's phone.
            </p>
            <Button type="submit" disabled={loading} variant="primary" className="w-full md:w-auto md:min-w-[300px]">
              {loading ? 'Processing...' : 'Proceed to OTP Verification 📱'}
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: OTP Verification */}
      {currentStep === 2 && (
        <GlassCard className="p-8 max-w-lg mx-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Phone Verification</h3>
          <p className="text-gray-500 mb-6 text-center">
            For security, we need to verify the customer's phone number: <span className="font-bold text-gray-800">{formData.phoneNumber}</span>
          </p>

          {!otpSent ? (
            <Button onClick={sendOtp} disabled={otpLoading} variant="primary" className="w-full">
              {otpLoading ? 'Sending...' : '📤 Send OTP Code'}
            </Button>
          ) : (
            <div className="space-y-6">
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-center border border-emerald-100">
                <div className="font-bold mb-1">✅ OTP sent successfully!</div>
                {debugOtp && <div className="text-xs opacity-75">Debug OTP: {debugOtp}</div>}
              </div>

              <Input
                label="Enter 6-digit OTP Code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />

              <div className="flex gap-4">
                <Button onClick={verifyAndSubmit} disabled={otpLoading || otpCode.length !== 6} variant="success" className="flex-1">
                  {otpLoading ? 'Verifying...' : '✅ Verify & Submit'}
                </Button>
                <Button onClick={sendOtp} disabled={otpLoading} variant="secondary">🔄 Resend</Button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Button onClick={() => setCurrentStep(1)} variant="ghost" className="w-full text-gray-500 hover:text-gray-700">
              ← Back to Registration Form
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Step 3: Success */}
      {currentStep === 3 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold text-emerald-600 mb-2">Account Registration Successful!</h2>
          <p className="text-gray-500 mb-8 text-lg">
            New account <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-lg">{newAccountId}</span> has been created and is pending approval.
          </p>
          <Button onClick={() => { setCurrentStep(1); setShowSuccess(false); }} variant="primary" size="lg">
            Register Another Customer
          </Button>
        </div>
      )}
    </div>
  );
};

export default AccountOpeningTab;
