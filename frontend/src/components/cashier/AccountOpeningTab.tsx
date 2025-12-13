import React, { useState, useRef, useCallback } from 'react';
import { PlayfulCard, PlayfulButton, PlayfulInput, ErrorBoundary } from './CashierTheme';
import { api } from '../../services/api.ts';

/**
 * Account Opening Tab Component for Cashier Dashboard
 * Unified form matching Mobile Banker's ClientRegistrationTab with camera capture
 */
const AccountOpeningTab: React.FC = () => {
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
      const response = await api.post('banking/account-openings/send_otp/', {
        phone_number: formData.phoneNumber,
        operation_type: 'account_opening'
      });
      setOtpSent(true);
      setDebugOtp(response.data.debug_otp || '');
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

      const response = await api.post('banking/account-openings/verify_and_submit/', {
        otp_code: otpCode,
        phone_number: formData.phoneNumber,
        account_data: submitData
      });

      if (response.data.success) {
        setCurrentStep(3);
        setNewAccountId(response.data.account_id || 'New Account');
        resetForm();
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Verification failed' });
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to verify OTP.' });
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

  // === STYLES ===
  const sectionStyle: React.CSSProperties = {
    background: '#fff',
    border: '2px solid #DFE6E9',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px'
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  };

  // === RENDER ===
  return (
    <ErrorBoundary>
      <PlayfulCard>
        <h2>👶 New Account Registration</h2>
        <p>Complete all sections to register a new customer account.</p>

        {/* Progress Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', gap: '16px' }}>
          {[1, 2, 3].map(step => (
            <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: currentStep >= step ? '#6C5CE7' : '#DFE6E9',
                color: currentStep >= step ? 'white' : '#636E72',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold'
              }}>{step}</div>
              {step < 3 && <div style={{ width: '40px', height: '4px', backgroundColor: currentStep > step ? '#6C5CE7' : '#DFE6E9', margin: '0 8px' }} />}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '24px', fontSize: '14px', color: '#636E72' }}>
          <span style={{ fontWeight: currentStep === 1 ? 'bold' : 'normal' }}>Registration Form</span>
          <span style={{ fontWeight: currentStep === 2 ? 'bold' : 'normal' }}>OTP Verification</span>
          <span style={{ fontWeight: currentStep === 3 ? 'bold' : 'normal' }}>Complete</span>
        </div>

        {/* Message Display */}
        {message.text && (
          <div style={{
            padding: '12px', marginBottom: '20px', borderRadius: '8px',
            backgroundColor: message.type === 'error' ? '#FFEBEE' : '#E8F5E8',
            color: message.type === 'error' ? '#C62828' : '#2E7D32',
            border: `1px solid ${message.type === 'error' ? '#FFCDD2' : '#C8E6C9'}`
          }}>{message.text}</div>
        )}

        {/* Step 1: Registration Form */}
        {currentStep === 1 && (
          <form onSubmit={handleSubmit}>
            {/* Photo Capture Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>📷 Customer Photo</div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '150px', height: '180px', backgroundColor: '#E0E0E0', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  border: '3px solid #DFE6E9', flexShrink: 0
                }}>
                  {formData.photo ? (
                    <img src={formData.photo} alt="Customer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : showCamera ? (
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#636E72' }}>
                      <div style={{ fontSize: '48px' }}>👤</div>
                      <div style={{ fontSize: '12px' }}>No Photo</div>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 15px 0', color: '#636E72', fontSize: '14px' }}>
                    Capture or upload a passport-style photo for identification.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {!showCamera && !formData.photo && (
                      <>
                        <PlayfulButton type="button" onClick={startCamera} variant="primary">📸 Open Camera</PlayfulButton>
                        <PlayfulButton type="button" onClick={() => fileInputRef.current?.click()} variant="primary">📁 Upload Photo</PlayfulButton>
                      </>
                    )}
                    {showCamera && (
                      <>
                        <PlayfulButton type="button" onClick={capturePhoto} variant="success">📷 Capture</PlayfulButton>
                        <PlayfulButton type="button" onClick={stopCamera} variant="danger">✕ Cancel</PlayfulButton>
                      </>
                    )}
                    {formData.photo && (
                      <>
                        <PlayfulButton type="button" onClick={removePhoto} variant="danger">🗑️ Remove</PlayfulButton>
                        <PlayfulButton type="button" onClick={startCamera} variant="primary">🔄 Retake</PlayfulButton>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </div>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Personal Information */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>👤 Personal Information</div>
              <div style={gridStyle}>
                <PlayfulInput label="First Name *" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} placeholder="Enter first name" required />
                <PlayfulInput label="Last Name *" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} placeholder="Enter last name" required />
                <PlayfulInput label="Date of Birth *" type="date" value={formData.dateOfBirth} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} required />
                <PlayfulInput label="Phone Number *" type="tel" value={formData.phoneNumber} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} placeholder="+233 XX XXX XXXX" required />
                <PlayfulInput label="Email Address" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="customer@example.com" />
              </div>
            </div>

            {/* Identification */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>🪪 Identification</div>
              <div style={gridStyle}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#636E72' }}>ID Type *</label>
                  <select value={formData.idType} onChange={(e) => handleInputChange('idType', e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '3px solid #DFE6E9', fontSize: '16px', background: '#F9F9F9' }}>
                    <option value="ghana_card">Ghana Card</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="nhis_card">NHIS Card</option>
                  </select>
                </div>
                <PlayfulInput label="ID Number *" value={formData.idNumber} onChange={(e) => handleInputChange('idNumber', e.target.value)} placeholder="Enter ID number" required />
              </div>
            </div>

            {/* Employment Information */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>💼 Employment Information</div>
              <div style={gridStyle}>
                <PlayfulInput label="Occupation" value={formData.occupation} onChange={(e) => handleInputChange('occupation', e.target.value)} placeholder="e.g., Teacher, Trader" />
                <PlayfulInput label="Position/Title" value={formData.position} onChange={(e) => handleInputChange('position', e.target.value)} placeholder="e.g., Senior Staff" />
                <PlayfulInput label="Work Address" value={formData.workAddress} onChange={(e) => handleInputChange('workAddress', e.target.value)} placeholder="Enter work address" style={{ gridColumn: 'span 2' }} />
              </div>
            </div>

            {/* Next of Kin */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>👨‍👩‍👧‍👦 Next of Kin (Beneficiaries)</div>
              {formData.nextOfKin.map((kin, index) => (
                <div key={index} style={{ background: '#F8F9FA', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 'bold', color: '#636E72' }}>Beneficiary {index + 1}</span>
                    {formData.nextOfKin.length > 1 && (
                      <button type="button" onClick={() => removeNextOfKin(index)} style={{ background: 'none', border: 'none', color: '#FF7675', cursor: 'pointer', fontWeight: 'bold' }}>✕ Remove</button>
                    )}
                  </div>
                  <div style={gridStyle}>
                    <PlayfulInput label="Full Name" value={kin.name} onChange={(e) => handleNextOfKinChange(index, 'name', e.target.value)} placeholder="Beneficiary name" />
                    <PlayfulInput label="Relationship" value={kin.relationship} onChange={(e) => handleNextOfKinChange(index, 'relationship', e.target.value)} placeholder="e.g., Spouse, Child" />
                    <PlayfulInput label="Address" value={kin.address} onChange={(e) => handleNextOfKinChange(index, 'address', e.target.value)} placeholder="Beneficiary address" />
                    <PlayfulInput label="Stake %" type="number" value={kin.stakePercentage} onChange={(e) => handleNextOfKinChange(index, 'stakePercentage', e.target.value)} placeholder="e.g., 50" />
                  </div>
                </div>
              ))}
              {formData.nextOfKin.length < 4 && (
                <PlayfulButton type="button" onClick={addNextOfKin} variant="primary">➕ Add Another Beneficiary</PlayfulButton>
              )}
            </div>

            {/* Account Type */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>🏦 Account Details</div>
              <div style={gridStyle}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#636E72' }}>Account Type *</label>
                  <select value={formData.accountType} onChange={(e) => handleInputChange('accountType', e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '3px solid #DFE6E9', fontSize: '16px', background: '#F9F9F9' }}>
                    <option value="daily_susu">Daily Susu Account</option>
                    <option value="shares">Shares Account</option>
                    <option value="monthly_contribution">Monthly Contribution</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#636E72' }}>Card Type</label>
                  <select value={formData.cardType} onChange={(e) => handleInputChange('cardType', e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '3px solid #DFE6E9', fontSize: '16px', background: '#F9F9F9' }}>
                    <option value="standard">Standard Card</option>
                    <option value="gold">Gold Card</option>
                    <option value="platinum">Platinum Card</option>
                    <option value="none">No Card Required</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#F8F9FA', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2D3436' }}>Ready to Submit?</h3>
              <p style={{ margin: '0 0 20px 0', color: '#636E72' }}>
                Please review all information. OTP verification will be sent to customer's phone.
              </p>
              <PlayfulButton type="submit" disabled={loading} variant="success" style={{ width: '100%' }}>
                {loading ? 'Processing...' : 'Proceed to OTP Verification 📱'}
              </PlayfulButton>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {currentStep === 2 && (
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>📱 Phone Verification</div>
            <p style={{ color: '#636E72', marginBottom: '20px' }}>
              For security, we need to verify the customer's phone number: <strong>{formData.phoneNumber}</strong>
            </p>

            {!otpSent ? (
              <PlayfulButton onClick={sendOtp} disabled={otpLoading} variant="primary" style={{ width: '100%', marginBottom: '15px' }}>
                {otpLoading ? 'Sending...' : '📤 Send OTP Code'}
              </PlayfulButton>
            ) : (
              <div>
                <div style={{ backgroundColor: '#E8F5E8', padding: '12px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>
                  ✅ OTP sent successfully!
                  {debugOtp && <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>Debug OTP: <strong>{debugOtp}</strong></div>}
                </div>

                <PlayfulInput label="Enter 6-digit OTP Code" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456" maxLength={6} />

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <PlayfulButton onClick={verifyAndSubmit} disabled={otpLoading || otpCode.length !== 6} variant="success" style={{ flex: 1 }}>
                    {otpLoading ? 'Verifying...' : '✅ Verify & Submit'}
                  </PlayfulButton>
                  <PlayfulButton onClick={sendOtp} disabled={otpLoading} variant="primary">🔄 Resend</PlayfulButton>
                </div>
              </div>
            )}

            <PlayfulButton onClick={() => setCurrentStep(1)} variant="danger" style={{ width: '100%', marginTop: '15px' }}>
              ← Back to Form
            </PlayfulButton>
          </div>
        )}

        {/* Step 3: Success */}
        {currentStep === 3 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ color: '#2E7D32', marginBottom: '10px' }}>Account Registration Successful!</h2>
            <p style={{ color: '#636E72', marginBottom: '20px' }}>
              New account <strong>{newAccountId}</strong> has been created and is pending approval.
            </p>
            <PlayfulButton onClick={() => { setCurrentStep(1); setShowSuccess(false); }} variant="success">
              Register Another Customer
            </PlayfulButton>
          </div>
        )}
      </PlayfulCard>
    </ErrorBoundary>
  );
};

export default AccountOpeningTab;