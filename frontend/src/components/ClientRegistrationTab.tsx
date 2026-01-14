import { useState, useRef, useCallback } from 'react';
import { api, authService } from '../services/api';
import CameraCapture from './shared/CameraCapture';
import { Input } from './ui/Input';


// TypeScript Interfaces
interface NextOfKin {
  name: string;
  relationship: string;
  address: string;
  stakePercentage: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  idType: string;
  idNumber: string;
  occupation: string;
  workAddress: string;
  position: string;
  nextOfKin: NextOfKin[];
  passportPicture: File | null;
  photo: string | null;
  otpCode: string;
  registrationId: number | null;
}

interface FormErrors {
  [key: string]: string | string[] | undefined;
  submit?: string;
  otp?: string;
}

/**
 * Client Registration Tab Component for Dashboards
 * Embedded version of the client registration form with SMS OTP verification
 */
function ClientRegistrationTab() {
  const [formData, setFormData] = useState<FormData>({
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

    // Photo (Base64)
    photo: null,

    // OTP
    otpCode: '',
    registrationId: null
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: OTP, 3: Success
  const [successMessage, setSuccessMessage] = useState('');
  const [_filePreviews, setFilePreviews] = useState<Record<string, string>>({});

  // Refs for accessibility
  const formRef = useRef<HTMLFormElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  // Validation rules
  const validateField = useCallback((name: string, value: unknown, _allData: FormData = formData): string | string[] | null => {
    // Helper to safely convert value to string
    const asString = (v: unknown): string => (typeof v === 'string' ? v : '');
    const asFile = (v: unknown): File | null => (v instanceof File ? v : null);
    const asNextOfKin = (v: unknown): NextOfKin[] => (Array.isArray(v) ? v : []);

    switch (name) {
      case 'firstName':
      case 'lastName': {
        const strValue = asString(value);
        if (!strValue) return `${name === 'firstName' ? 'First' : 'Last'} name is required`;
        if (!/^[a-zA-Z\s]+$/.test(strValue)) return 'Name must contain only letters and spaces';
        if (strValue.length < 2) return 'Name must be at least 2 characters';
        if (strValue.length > 100) return 'Name must be less than 100 characters';
        return null;
      }

      case 'dateOfBirth': {
        const strValue = asString(value);
        if (!strValue) return 'Date of birth is required';
        const birthDate = new Date(strValue);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear() -
          (today.getMonth() < birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
        if (age < 18) return 'You must be at least 18 years old';
        if (age > 120) return 'Please enter a valid date of birth';
        return null;
      }

      case 'phoneNumber': {
        const strValue = asString(value);
        if (!strValue) return 'Phone number is required';
        // International format validation (basic)
        if (!/^\+?[1-9]\d{1,14}$/.test(strValue.replace(/\s/g, ''))) {
          return 'Please enter a valid international phone number';
        }
        return null;
      }

      case 'email': {
        const strValue = asString(value);
        if (strValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
          return 'Please enter a valid email address';
        }
        return null;
      }

      case 'idType': {
        const strValue = asString(value);
        if (!strValue) return 'ID type is required';
        return null;
      }

      case 'idNumber': {
        const strValue = asString(value);
        if (!strValue) return 'ID number is required';
        if (strValue.length < 5) return 'ID number must be at least 5 characters';
        return null;
      }

      case 'occupation':
      case 'workAddress':
      case 'position': {
        const strValue = asString(value);
        if (!strValue) return `${name.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
        if (strValue.length < 2) return 'Must be at least 2 characters';
        return null;
      }

      case 'nextOfKin': {
        const kinArray = asNextOfKin(value);
        const errors: string[] = [];
        kinArray.forEach((kin, index) => {
          if (!kin.name && !kin.relationship && !kin.address && !kin.stakePercentage) {
            return; // Skip empty entries
          }

          if (!kin.name) errors.push(`Next of kin ${index + 1}: Name is required`);
          if (!kin.relationship) errors.push(`Next of kin ${index + 1}: Relationship is required`);
          if (!kin.address) errors.push(`Next of kin ${index + 1}: Address is required`);
          if (!kin.stakePercentage) errors.push(`Next of kin ${index + 1}: Stake percentage is required`);
          else {
            const percentage = parseFloat(kin.stakePercentage);
            if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
              errors.push(`Next of kin ${index + 1}: Stake percentage must be between 0 and 100`);
            }
          }
        });

        // Check total stake percentage
        const totalStake = kinArray.reduce((sum, kin) => {
          const percentage = parseFloat(kin.stakePercentage || '0');
          return sum + (isNaN(percentage) ? 0 : percentage);
        }, 0);

        if (totalStake > 100) {
          errors.push('Total stake percentage across all next of kin cannot exceed 100%');
        }

        return errors.length > 0 ? errors : null;
      }

      case 'passportPicture': {
        const file = asFile(value);
        if (!file) return 'Passport picture is required';
        if (file.size > 5 * 1024 * 1024) return 'File size must be less than 5MB';
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
          return 'File must be a JPG or PNG image';
        }
        return null;
      }

      case 'otpCode': {
        const strValue = asString(value);
        if (!strValue) return 'OTP code is required';
        if (!/^\d{6}$/.test(strValue)) return 'OTP must be 6 digits';
        return null;
      }

      default:
        return null;
    }
  }, [formData]);


  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type, files } = e.target;
    const newValue = type === 'file' ? files[0] : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Real-time validation
    if (name !== 'otpCode') { // Don't validate OTP in real-time
      const error = validateField(name, newValue);
      setFormErrors(prev => ({ ...prev, [name]: error }));
    }

    // Handle file previews
    if (type === 'file' && files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => ({
          ...prev,
          [name]: e.target.result
        }));
      };
      reader.readAsDataURL(files[0]);
    }
  }, [validateField]);

  // Handle next of kin changes
  const handleNextOfKinChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newNextOfKin = [...prev.nextOfKin];
      newNextOfKin[index] = { ...newNextOfKin[index], [field]: value };
      return { ...prev, nextOfKin: newNextOfKin };
    });

    // Validate next of kin
    setTimeout(() => {
      const newData = { ...formData };
      newData.nextOfKin[index] = { ...newData.nextOfKin[index], [field]: value };
      const error = validateField('nextOfKin', newData.nextOfKin, newData);
      setFormErrors(prev => ({ ...prev, nextOfKin: error }));
    }, 0);
  }, [formData, validateField]);

  // Add next of kin entry
  const addNextOfKin = useCallback(() => {
    if (formData.nextOfKin.length < 4) {
      setFormData(prev => ({
        ...prev,
        nextOfKin: [...prev.nextOfKin, { name: '', relationship: '', address: '', stakePercentage: '' }]
      }));
    }
  }, [formData.nextOfKin.length]);

  // Remove next of kin entry
  const removeNextOfKin = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      nextOfKin: prev.nextOfKin.filter((_, i) => i !== index)
    }));
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    const errors = {};

    // Validate all fields
    const fieldsToValidate = [
      'firstName', 'lastName', 'dateOfBirth', 'phoneNumber', 'email',
      'idType', 'idNumber', 'occupation', 'workAddress', 'position',
      'nextOfKin', 'passportPicture'
    ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  // Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      errorSummaryRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setFormErrors({});

    try {
      // Prepare form data for submission
      const submitData = new FormData();

      // Add basic fields
      Object.keys(formData).forEach(key => {
        if (key === 'nextOfKin') {
          // Filter out empty next of kin entries
          const validKin = formData.nextOfKin.filter(kin =>
            kin.name || kin.relationship || kin.address || kin.stakePercentage
          );
          submitData.append('next_of_kin_data', JSON.stringify(validKin));
        } else if (key === 'passportPicture' || key === 'idDocument') {
          if (formData[key]) {
            submitData.append(key, formData[key]);
          }
        } else if (key !== 'otpCode' && key !== 'registrationId' && formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      const result = await authService.submitClientRegistration(submitData);

      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          registrationId: result.data.id
        }));

        setCurrentStep(2); // Move to OTP step
        setSuccessMessage('Registration submitted successfully! Please verify with OTP.');
      } else {
        setFormErrors({
          submit: result.error || 'Registration failed. Please try again.'
        });
      }

    } catch (error) {
      setFormErrors({
        submit: error.message || 'Registration failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send OTP
  const handleSendOTP = async () => {
    if (!formData.registrationId) return;

    setIsLoading(true);
    try {
      const result = await authService.sendClientRegistrationOTP(String(formData.registrationId));
      if (result.success) {
        setSuccessMessage('OTP sent successfully to your phone number.');
      } else {
        setFormErrors({
          otp: result.error || 'Failed to send OTP. Please try again.'
        });
      }
    } catch (error) {
      setFormErrors({
        otp: error.message || 'Failed to send OTP. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!formData.registrationId || !formData.otpCode) {
      setFormErrors({ otp: 'Please enter the OTP code' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.verifyClientRegistrationOTP(String(formData.registrationId), formData.otpCode);

      if (result.success && result.data) {
        setCurrentStep(3); // Move to success step
        const accountNumber = result.data.account_number;
        if (accountNumber) {
          setSuccessMessage(`Registration completed successfully! Account Number: ${accountNumber}. Your account will be reviewed by our team.`);
        } else {
          setSuccessMessage('Registration completed successfully! Your account will be reviewed by our team.');
        }
      } else {
        setFormErrors({
          otp: result.error || 'Invalid OTP. Please try again.'
        });
      }

    } catch (error) {
      setFormErrors({
        otp: error.message || 'Invalid OTP. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', dateOfBirth: '', phoneNumber: '', email: '',
      idType: '', idNumber: '', occupation: '', workAddress: '', position: '',
      nextOfKin: [{ name: '', relationship: '', address: '', stakePercentage: '' }],
      passportPicture: null, photo: null, otpCode: '', registrationId: null
    });
    setFormErrors({});
    setCurrentStep(1);
    setSuccessMessage('');
    setFilePreviews({});
  };

  // Clear field error
  const clearFieldError = (fieldName: string) => {
    setFormErrors(prev => ({ ...prev, [fieldName]: undefined }));
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-6">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-12 h-1 mx-2 ${currentStep > step ? 'bg-blue-500' : 'bg-gray-200'
                }`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center text-sm text-gray-600 mb-6">
        <span className={currentStep === 1 ? 'font-medium' : ''}>Registration Form</span>
        <span className="mx-4">→</span>
        <span className={currentStep === 2 ? 'font-medium' : ''}>OTP Verification</span>
        <span className="mx-4">→</span>
        <span className={currentStep === 3 ? 'font-medium' : ''}>Complete</span>
      </div>

      {/* Step 1: Registration Form */}
      {currentStep === 1 && (
        <form onSubmit={handleSubmit} ref={formRef} className="space-y-6">

          {/* Error summary */}
          {Object.keys(formErrors).length > 0 && (
            <div ref={errorSummaryRef} className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
              <h3 className="text-sm font-semibold text-red-800 mb-2">Please fix the following errors:</h3>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {Object.entries(formErrors).map(([field, error]) => (
                  <li key={field}>
                    {Array.isArray(error) ? error.join(', ') : error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Photo Capture Section */}
          <CameraCapture
            photo={formData.photo}
            onPhotoCapture={(photoData) => setFormData(prev => ({ ...prev, photo: photoData }))}
            label="📷 Customer Passport Photo"
            description="Capture or upload a passport-style photo of the customer for identification."
          />

          {/* Personal Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                id="firstName"
                name="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleInputChange}
                onFocus={() => clearFieldError('firstName')}
                required
                error={Array.isArray(formErrors.firstName) ? formErrors.firstName[0] : formErrors.firstName}
              />
              <Input
                label="Last Name *"
                id="lastName"
                name="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleInputChange}
                onFocus={() => clearFieldError('lastName')}
                required
                error={Array.isArray(formErrors.lastName) ? formErrors.lastName[0] : formErrors.lastName}
              />
              <Input
                label="Date of Birth *"
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                title="Select date of birth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                onFocus={() => clearFieldError('dateOfBirth')}
                required
                error={Array.isArray(formErrors.dateOfBirth) ? formErrors.dateOfBirth[0] : formErrors.dateOfBirth}
              />
              <Input
                label="Phone Number *"
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                onFocus={() => clearFieldError('phoneNumber')}
                placeholder="+233 XXX XXX XXX"
                required
                error={Array.isArray(formErrors.phoneNumber) ? formErrors.phoneNumber[0] : formErrors.phoneNumber}
              />
              <Input
                label="Email Address"
                type="email"
                id="email"
                name="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleInputChange}
                onFocus={() => clearFieldError('email')}
                className="md:col-span-2"
                error={Array.isArray(formErrors.email) ? formErrors.email[0] : formErrors.email}
              />
            </div>
          </div>

          {/* Identification */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                as="select"
                label="ID Type *"
                id="idType"
                name="idType"
                title="Select the type of ID provided"
                value={formData.idType}
                onChange={handleInputChange}
                onFocus={() => clearFieldError('idType')}
                required
                error={Array.isArray(formErrors.idType) ? formErrors.idType[0] : formErrors.idType}
              >
                <option value="">Select ID Type</option>
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="drivers_license">Driver's License</option>
              </Input>
              <Input
                label="ID Number *"
                id="idNumber"
                name="idNumber"
                title="Enter the ID document number"
                value={formData.idNumber}
                onChange={handleInputChange}
                onFocus={() => clearFieldError('idNumber')}
                required
                error={Array.isArray(formErrors.idNumber) ? formErrors.idNumber[0] : formErrors.idNumber}
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
            <div className="space-y-4">
              <Input
                label="Occupation *"
                id="occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                onFocus={() => clearFieldError('occupation')}
                required
                error={Array.isArray(formErrors.occupation) ? formErrors.occupation[0] : formErrors.occupation}
              />
              <Input
                as="textarea"
                label="Work Address *"
                id="workAddress"
                name="workAddress"
                value={formData.workAddress}
                onChange={handleInputChange}
                onFocus={() => clearFieldError('workAddress')}
                rows={3}
                required
                error={Array.isArray(formErrors.workAddress) ? formErrors.workAddress[0] : formErrors.workAddress}
              />
              <Input
                label="Position *"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                onFocus={() => clearFieldError('position')}
                required
                error={Array.isArray(formErrors.position) ? formErrors.position[0] : formErrors.position}
              />
            </div>
          </div>

          {/* Next of Kin */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Next of Kin</h3>
              {formData.nextOfKin.length < 4 && (
                <button
                  type="button"
                  onClick={addNextOfKin}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Add Next of Kin
                </button>
              )}
            </div>

            {formData.nextOfKin.map((kin, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium">Next of Kin {index + 1}</h4>
                  {formData.nextOfKin.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeNextOfKin(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Name *"
                    id={`kin-name-${index}`}
                    value={kin.name}
                    onChange={(e) => handleNextOfKinChange(index, 'name', e.target.value)}
                    title={`Enter name for next of kin ${index + 1}`}
                  />
                  <Input
                    as="select"
                    label="Relationship *"
                    id={`kin-relationship-${index}`}
                    value={kin.relationship}
                    onChange={(e) => handleNextOfKinChange(index, 'relationship', e.target.value)}
                    title={`Select relationship for next of kin ${index + 1}`}
                  >
                    <option value="">Select Relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="sibling">Sibling</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                  </Input>
                  <Input
                    as="textarea"
                    label="Address *"
                    id={`kin-address-${index}`}
                    value={kin.address}
                    onChange={(e) => handleNextOfKinChange(index, 'address', e.target.value)}
                    rows={2}
                    className="md:col-span-2"
                    title={`Enter address for next of kin ${index + 1}`}
                  />
                  <Input
                    label="Stake Percentage *"
                    type="number"
                    id={`kin-stake-${index}`}
                    min="0"
                    max="100"
                    step="0.01"
                    value={kin.stakePercentage}
                    onChange={(e) => handleNextOfKinChange(index, 'stakePercentage', e.target.value)}
                    title={`Enter stake percentage for next of kin ${index + 1}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Note: Photo capture moved to CameraCapture component at top of form */}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isLoading ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>
      )}

      {/* Step 2: OTP Verification */}
      {currentStep === 2 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">OTP Verification</h3>

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-digit OTP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="otpCode"
                value={formData.otpCode}
                onChange={handleInputChange}
                onFocus={() => clearFieldError('otpCode')}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-center text-2xl tracking-widest"
                maxLength={6}
              />
              {formErrors.otp && (
                <p className="text-sm text-red-600 mt-1">{formErrors.otp}</p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleVerifyOTP}
                disabled={isLoading || !formData.otpCode}
                className="flex-1 py-3 px-6 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="px-6 py-3 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm border border-blue-300 rounded-xl"
              >
                Resend OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {currentStep === 3 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Registration Complete!</h3>
          <p className="text-gray-600 mb-4">{successMessage}</p>
          <button
            onClick={resetForm}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold"
          >
            Register Another Client
          </button>
        </div>
      )}
    </div>
  );
}

export default ClientRegistrationTab;
