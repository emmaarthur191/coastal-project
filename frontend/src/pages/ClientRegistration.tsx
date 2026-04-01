import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

/**
 * Client Registration Page
 * Refactored for Admin-Approved "Paper-First" workflow (No OTP)
 */
function ClientRegistrationPage() {
  // State management
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',

    // Identification
    idType: '',
    idNumber: '',

    // Employment Information
    occupation: '',
    workAddress: '',
    position: '',

    // Next of Kin (up to 4)
    nextOfKin: [
      { name: '', relationship: '', address: '', stakePercentage: '' }
    ],

    // Files
    passportPicture: null,
    idDocument: null,

    // Metadata
    registrationId: null
  });

  const [formErrors, setFormErrors] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: Success
  const [successMessage, setSuccessMessage] = useState('');
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});

  // Refs for accessibility
  const formRef = useRef<HTMLFormElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Validation rules
  const validateField = useCallback((name: string, value: any) => {
    switch (name) {
      case 'firstName':
      case 'lastName': {
        if (!value) return `${name === 'firstName' ? 'First' : 'Last'} name is required`;
        if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name must contain only letters and spaces';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return null;
      }

      case 'dateOfBirth': {
        if (!value) return 'Date of birth is required';
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) return 'You must be at least 18 years old';
        return null;
      }

      case 'phoneNumber': {
        if (!value) return 'Phone number is required';
        if (!/^\+?[1-9]\d{1,14}$/.test(value.replace(/\s/g, ''))) {
          return 'Please enter a valid phone number';
        }
        return null;
      }

      case 'idType':
        return !value ? 'ID type is required' : null;

      case 'idNumber':
        return !value ? 'ID number is required' : null;

      case 'occupation':
      case 'workAddress':
      case 'position':
        return !value ? `${name} is required` : null;

      case 'passportPicture':
        return !value ? 'Passport picture is required' : null;

      default:
        return null;
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    let value: any = target.value;
    
    if (target instanceof HTMLInputElement && target.type === 'file' && target.files) {
      value = target.files[0];
    }

    const { name } = target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error
    setFormErrors(prev => ({ ...prev, [name]: undefined }));

    // Handle file previews
    if (target instanceof HTMLInputElement && target.type === 'file' && target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => ({
          ...prev,
          [name]: e.target?.result as string
        }));
      };
      reader.readAsDataURL(target.files[0]);
    }
  }, []);

  // Next of Kin handlers
  const handleNextOfKinChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newKin = [...prev.nextOfKin];
      newKin[index] = { ...newKin[index], [field]: value };
      return { ...prev, nextOfKin: newKin };
    });
  };

  const addNextOfKin = () => {
    if (formData.nextOfKin.length < 4) {
      setFormData(prev => ({
        ...prev,
        nextOfKin: [...prev.nextOfKin, { name: '', relationship: '', address: '', stakePercentage: '' }]
      }));
    }
  };

  const removeNextOfKin = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nextOfKin: prev.nextOfKin.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, any> = {};
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'phoneNumber',
      'idType', 'idNumber', 'occupation', 'workAddress', 'position',
      'passportPicture'
    ];

    requiredFields.forEach(field => {
      const error = validateField(field, (formData as any)[field]);
      if (error) errors[field] = error;
    });

    // Validate Next of Kin
    formData.nextOfKin.forEach((kin, index) => {
      if (!kin.name) errors[`kin_${index}_name`] = `Next of Kin ${index + 1} name is required`;
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      errorSummaryRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsLoading(true);
    try {
      const submitData = new FormData();
      
      // Append fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'nextOfKin') {
          submitData.append('next_of_kin_data', JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          submitData.append(key, value);
        }
      });

      const result = await apiService.registerClient(submitData);

      if (result.success) {
        setCurrentStep(2);
        setSuccessMessage('Registration submitted! Please visit the Manager\'s office with your physical ID to receive your account credentials.');
        
        // Final redirect after 10s
        setTimeout(() => navigate('/login'), 10000);
      } else {
        setFormErrors({ submit: result.error || 'Submission failed' });
      }
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const clearFieldError = (name: string) => {
    setFormErrors(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight mb-2">
            Coastal Member Registration
          </h1>
          <p className="text-lg text-neutral-600">
            Start your journey with Coastal Auto Tech Cooperative Credit Union
          </p>
        </div>

        {/* Progress */}
        <div className="mb-12 relative">
          <div className="flex items-center justify-center space-x-20">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep === 1 ? 'bg-primary-600 text-white shadow-lg ring-4 ring-primary-100' : 'bg-emerald-500 text-white'}`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span className="mt-2 text-sm font-semibold text-neutral-700">Form</span>
            </div>
            <div className={`flex-1 h-1 max-w-[100px] ${currentStep > 1 ? 'bg-emerald-500' : 'bg-neutral-200'}`} />
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep === 2 ? 'bg-primary-600 text-white shadow-lg ring-4 ring-primary-100' : 'bg-neutral-200 text-neutral-500'}`}>
                2
              </div>
              <span className="mt-2 text-sm font-semibold text-neutral-700">Visit Manager</span>
            </div>
          </div>
        </div>

        {currentStep === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-neutral-100">
            {formErrors.submit && (
              <div ref={errorSummaryRef} className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl animate-pulse">
                {String(formErrors.submit)}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Info */}
              <div className="space-y-6 md:col-span-2">
                <h2 className="text-2xl font-bold text-neutral-800 border-b pb-2 flex items-center gap-2">
                  <span className="text-primary-600">👤</span> Personal Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="firstName" className="text-sm font-bold text-neutral-700">First Name *</label>
                    <input id="firstName" name="firstName" title="First Name" placeholder="First Name" className="px-4 py-3 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-50" value={formData.firstName} onChange={handleInputChange} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="lastName" className="text-sm font-bold text-neutral-700">Last Name *</label>
                    <input id="lastName" name="lastName" title="Last Name" placeholder="Last Name" className="px-4 py-3 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-50" value={formData.lastName} onChange={handleInputChange} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="phoneNumber" className="text-sm font-bold text-neutral-700">Phone Number *</label>
                    <input id="phoneNumber" name="phoneNumber" type="tel" title="Phone Number" placeholder="e.g., +233 24 000 0000" className="px-4 py-3 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-50" value={formData.phoneNumber} onChange={handleInputChange} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="dateOfBirth" className="text-sm font-bold text-neutral-700">Date of Birth *</label>
                    <input id="dateOfBirth" name="dateOfBirth" type="date" title="Date of Birth" className="px-4 py-3 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-50" value={formData.dateOfBirth} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>

              {/* ID Info */}
              <div className="space-y-6 md:col-span-2">
                <h2 className="text-2xl font-bold text-neutral-800 border-b pb-2 flex items-center gap-2">
                  <span className="text-primary-600">💳</span> Identification
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="idType" className="text-sm font-bold text-neutral-700">ID Type *</label>
                    <select id="idType" name="idType" title="ID Type" className="px-4 py-3 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-50" value={formData.idType} onChange={handleInputChange} required>
                      <option value="">Select ID Type</option>
                      <option value="ghana_card">Ghana Card</option>
                      <option value="passport">Passport</option>
                      <option value="voters_id">Voter's ID</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="idNumber" className="text-sm font-bold text-neutral-700">ID Number *</label>
                    <input id="idNumber" name="idNumber" title="ID Number" placeholder="ID Number" className="px-4 py-3 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-50" value={formData.idNumber} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>

              {/* Files */}
              <div className="space-y-6 md:col-span-2">
                <h2 className="text-2xl font-bold text-neutral-800 border-b pb-2 flex items-center gap-2">
                  <span className="text-primary-600">📁</span> Upload Documents
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="passportPicture" className="text-sm font-bold text-neutral-700">Passport Picture *</label>
                    <input id="passportPicture" name="passportPicture" title="Passport Picture" type="file" accept="image/*" onChange={handleInputChange} required />
                    {filePreviews.passportPicture && <img src={filePreviews.passportPicture} className="w-24 h-24 rounded-lg object-cover mt-2 shadow" alt="Preview"/>}
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-4 px-8 bg-primary-600 text-white rounded-2xl font-bold text-xl hover:bg-primary-700 transition-all shadow-xl disabled:bg-neutral-300">
              {isLoading ? 'Processing Registration...' : 'Complete Registration'}
            </button>
          </form>
        ) : (
          <div className="bg-white p-12 rounded-3xl shadow-2xl border border-emerald-100 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
              ✓
            </div>
            <h2 className="text-3xl font-black text-neutral-900 mb-4 tracking-tight">Registration Submitted!</h2>
            <div className="max-w-md mx-auto space-y-6">
              <p className="text-lg text-neutral-600 leading-relaxed">
                {successMessage}
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 text-left rounded-r-xl">
                <p className="text-sm text-amber-800 font-bold mb-1">Next Step:</p>
                <p className="text-sm text-amber-700">
                  Visit the Manager's office with your physical ID card to finalize the account opening and receive your login credentials.
                </p>
              </div>
              <p className="text-xs text-neutral-400 italic">
                You will be redirected back to the login page in 10 seconds.
              </p>
              <button onClick={() => navigate('/login')} className="w-full py-3 px-6 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-all">
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientRegistrationPage;
