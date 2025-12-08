import React, { useState } from 'react';
import { authService } from '../services/api.ts';

interface UserFormData {
  // Existing fields
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  password?: string;

  // New required fields
  house_address: string;
  contact_address: string;
  government_id: string;
  ssnit_number: string;

  // File uploads
  passport_picture: File | null;
  application_letter: File | null;
  appointment_letter: File | null;

  // Bank account details
  bank_name: string;
  account_number: string;
  branch_code: string;
  routing_number: string;
}

interface FormErrors {
  [key: string]: string | null;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: string;
}

interface EnhancedUserManagementFormProps {
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  otpCode: string;
  setOtpCode: React.Dispatch<React.SetStateAction<string>>;
  phoneVerified: boolean;
  setPhoneVerified: React.Dispatch<React.SetStateAction<boolean>>;
  otpSent: boolean;
  setOtpSent: React.Dispatch<React.SetStateAction<boolean>>;
  otpExpiresIn: number;
  setOtpExpiresIn: React.Dispatch<React.SetStateAction<number>>;
  handleSendOTP: () => void;
  handleVerifyOTP: () => void;
  handleCreateUser: (e: React.FormEvent) => void;
  staffMembers: StaffMember[];
  fetchStaffMembers: () => void;
}

const EnhancedUserManagementForm: React.FC<EnhancedUserManagementFormProps> = ({
  formData,
  setFormData,
  otpCode,
  setOtpCode,
  phoneVerified,
  setPhoneVerified,
  otpSent,
  setOtpSent,
  otpExpiresIn,
  setOtpExpiresIn,
  handleSendOTP,
  handleVerifyOTP,
  handleCreateUser,
  staffMembers,
  fetchStaffMembers
}) => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateAddress = (address: string): string | null => {
    if (!address || address.trim().length < 10) {
      return "Address must be at least 10 characters long";
    }
    return null;
  };

  const validateGovernmentId = (id: string): string | null => {
    const cleanId = id.replace(/[\s-]/g, '').toUpperCase();
    if (!cleanId) return "Government ID is required";
    if (!/^[A-Z0-9]+$/.test(cleanId)) {
      return "Government ID must contain only letters and numbers";
    }
    if (cleanId.length < 6 || cleanId.length > 20) {
      return "Government ID must be between 6 and 20 characters long";
    }
    return null;
  };

  const validateSSNIT = (ssnit: string): string | null => {
    const cleanSSNIT = ssnit.replace(/[\s-]/g, '');
    if (!cleanSSNIT) return "SSNIT number is required";
    if (!/^\d{12}$/.test(cleanSSNIT)) {
      return "SSNIT number must be 12 digits (format: AAA-NN-NNNNN)";
    }
    return null;
  };

  const validateFile = (file: File | null, type: 'passport' | 'letter'): string | null => {
    if (!file) return "File is required";

    const maxSize = type === 'passport' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size exceeds ${type === 'passport' ? '2MB' : '5MB'} limit`;
    }

    const validTypes = type === 'passport'
      ? ['image/jpeg', 'image/jpg', 'image/png']
      : ['application/pdf'];

    if (!validTypes.includes(file.type)) {
      return type === 'passport'
        ? "Only JPEG/JPG/PNG files are allowed"
        : "Only PDF files are allowed";
    }

    return null;
  };

  const validateAccountNumber = (accountNumber: string): string | null => {
    if (!accountNumber) return "Account number is required";
    if (!/^[A-Z0-9]+$/.test(accountNumber)) {
      return "Account number must contain only letters and numbers";
    }
    if (accountNumber.length < 8 || accountNumber.length > 20) {
      return "Account number must be between 8 and 20 characters long";
    }
    return null;
  };

  const validateBranchCode = (branchCode: string): string | null => {
    if (!branchCode) return "Branch code is required";
    if (!/^[A-Z0-9]+$/.test(branchCode)) {
      return "Branch code must contain only letters and numbers";
    }
    if (branchCode.length < 3 || branchCode.length > 10) {
      return "Branch code must be between 3 and 10 characters long";
    }
    return null;
  };

  const validateRoutingNumber = (routingNumber: string): string | null => {
    const cleanRouting = routingNumber.replace(/[\s-]/g, '');
    if (!cleanRouting) return "Routing number is required";
    if (!/^\d{9}$/.test(cleanRouting)) {
      return "Routing number must be 9 digits";
    }
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.house_address = validateAddress(formData.house_address);
    newErrors.contact_address = validateAddress(formData.contact_address);
    newErrors.government_id = validateGovernmentId(formData.government_id);
    newErrors.ssnit_number = validateSSNIT(formData.ssnit_number);
    newErrors.passport_picture = validateFile(formData.passport_picture, 'passport');
    newErrors.application_letter = validateFile(formData.application_letter, 'letter');
    newErrors.appointment_letter = validateFile(formData.appointment_letter, 'letter');
    newErrors.account_number = validateAccountNumber(formData.account_number);
    newErrors.branch_code = validateBranchCode(formData.branch_code);
    newErrors.routing_number = validateRoutingNumber(formData.routing_number);

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!phoneVerified) {
      alert('Please verify your phone number with OTP before creating the user.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authService.createUser(formData);

      if (response.success) {
        alert(`User created! ID: ${response.data.staff_id || 'N/A'}`);
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role: 'cashier',
          house_address: '',
          contact_address: '',
          government_id: '',
          ssnit_number: '',
          passport_picture: null,
          application_letter: null,
          appointment_letter: null,
          bank_name: '',
          account_number: '',
          branch_code: '',
          routing_number: ''
        });
        setOtpCode('');
        setPhoneVerified(false);
        setOtpSent(false);
        fetchStaffMembers();
      } else {
        alert('Failed to create user: ' + response.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('An error occurred while creating the user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="enhanced-user-management-form">
      <h3>👥 Enhanced User Management - Create New User</h3>

      <form onSubmit={handleSubmit} className="user-form">
        {/* Personal Information Section */}
        <div className="form-section">
          <h4>📋 Personal Information</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                value={formData.first_name || ''}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                value={formData.last_name || ''}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <div className="phone-input-group">
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  placeholder="+233 XX XXX XXXX"
                />
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={otpSent && otpExpiresIn > 0}
                >
                  {otpSent && otpExpiresIn > 0 ? `Resend in ${otpExpiresIn}s` : 'Send OTP'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select
                value={formData.role || 'cashier'}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                required
              >
                <option value="cashier">Cashier</option>
                <option value="mobile_banker">Mobile Banker</option>
                <option value="operations_manager">Operations Manager</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="form-section">
          <h4>🏠 Address Information</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>House Address *</label>
              <textarea
                value={formData.house_address || ''}
                onChange={(e) => setFormData({...formData, house_address: e.target.value})}
                rows={3}
                required
              />
              {errors.house_address && <div className="error-message">{errors.house_address}</div>}
            </div>
            <div className="form-group">
              <label>Contact Address *</label>
              <textarea
                value={formData.contact_address || ''}
                onChange={(e) => setFormData({...formData, contact_address: e.target.value})}
                rows={3}
                required
              />
              {errors.contact_address && <div className="error-message">{errors.contact_address}</div>}
            </div>
          </div>
        </div>

        {/* Identification Information Section */}
        <div className="form-section">
          <h4>🆔 Identification Information</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Government ID *</label>
              <input
                type="text"
                value={formData.government_id || ''}
                onChange={(e) => setFormData({...formData, government_id: e.target.value})}
                required
                placeholder="Enter government ID (6-20 characters)"
              />
              {errors.government_id && <div className="error-message">{errors.government_id}</div>}
            </div>
            <div className="form-group">
              <label>SSNIT Number *</label>
              <input
                type="text"
                value={formData.ssnit_number || ''}
                onChange={(e) => setFormData({...formData, ssnit_number: e.target.value})}
                required
                placeholder="Format: AAA-NN-NNNNN"
              />
              {errors.ssnit_number && <div className="error-message">{errors.ssnit_number}</div>}
            </div>
          </div>
        </div>

        {/* File Uploads Section */}
        <div className="form-section">
          <h4>📁 Document Uploads</h4>
          <div className="file-uploads-grid">
            <FileUploadComponent
              label="Passport Picture (JPEG/PNG, ≤2MB) *"
              accept="image/jpeg,image/jpg,image/png"
              maxSize={2}
              onFileChange={(file) => setFormData({...formData, passport_picture: file})}
              error={errors.passport_picture}
              currentFile={formData.passport_picture}
            />
            <FileUploadComponent
              label="Application Letter (PDF, ≤5MB) *"
              accept="application/pdf"
              maxSize={5}
              onFileChange={(file) => setFormData({...formData, application_letter: file})}
              error={errors.application_letter}
              currentFile={formData.application_letter}
            />
            <FileUploadComponent
              label="Appointment Letter (PDF, ≤5MB) *"
              accept="application/pdf"
              maxSize={5}
              onFileChange={(file) => setFormData({...formData, appointment_letter: file})}
              error={errors.appointment_letter}
              currentFile={formData.appointment_letter}
            />
          </div>
        </div>

        {/* Bank Account Details Section */}
        <div className="form-section">
          <h4>🏦 Bank Account Details</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Bank Name *</label>
              <input
                type="text"
                value={formData.bank_name || ''}
                onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Account Number *</label>
              <input
                type="text"
                value={formData.account_number || ''}
                onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                required
                placeholder="8-20 alphanumeric characters"
              />
              {errors.account_number && <div className="error-message">{errors.account_number}</div>}
            </div>
            <div className="form-group">
              <label>Branch Code *</label>
              <input
                type="text"
                value={formData.branch_code || ''}
                onChange={(e) => setFormData({...formData, branch_code: e.target.value})}
                required
                placeholder="3-10 alphanumeric characters"
              />
              {errors.branch_code && <div className="error-message">{errors.branch_code}</div>}
            </div>
            <div className="form-group">
              <label>Routing Number *</label>
              <input
                type="text"
                value={formData.routing_number || ''}
                onChange={(e) => setFormData({...formData, routing_number: e.target.value})}
                required
                placeholder="9 digits"
              />
              {errors.routing_number && <div className="error-message">{errors.routing_number}</div>}
            </div>
          </div>
        </div>

        {/* OTP Verification Section */}
        <div className="form-section">
          <h4>📱 Phone Verification</h4>
          <div className="otp-section">
            {!otpSent ? (
              <button type="button" onClick={handleSendOTP} className="otp-button">
                Send OTP Code
              </button>
            ) : !phoneVerified ? (
              <div className="otp-verification">
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  className="otp-input"
                />
                <div className="otp-actions">
                  <button type="button" onClick={handleVerifyOTP} className="verify-button">
                    Verify OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                      setOtpExpiresIn(0);
                    }}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
                <p className="otp-timer">
                  Code expires in: {Math.floor(otpExpiresIn / 60)}:{String(otpExpiresIn % 60).padStart(2, '0')}
                </p>
              </div>
            ) : (
              <div className="verified-status">
                ✅ Phone Verified!
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!phoneVerified || isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Creating User...' : phoneVerified ? 'Create User' : 'Verify Phone to Create User'}
        </button>
      </form>

      {/* Staff Members List */}
      <div className="staff-list-section">
        <h4>📋 Current Staff Members</h4>
        <div className="staff-list">
          {staffMembers.length > 0 ? staffMembers.map((staff) => (
            <div key={staff.id} className="staff-member">
              <div className="staff-info">
                <div className="staff-name">{staff.name}</div>
                <div className="staff-details">Role: {staff.role} | Status: {staff.status}</div>
              </div>
            </div>
          )) : (
            <div className="no-staff">No staff members yet. Create your first user above! 👆</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced File Upload Component with Drag & Drop
const FileUploadComponent = ({
  label,
  accept,
  maxSize,
  onFileChange,
  error,
  currentFile
}: {
  label: string;
  accept: string;
  maxSize: number;
  onFileChange: (file: File | null) => void;
  error: string | null;
  currentFile?: File | null;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Size validation
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Type validation
    const validTypes = accept.split(',');
    if (!validTypes.includes(file.type)) {
      const expectedTypes = accept.replace('image/', '').replace('application/', '').toUpperCase();
      return `Invalid file type. Expected: ${expectedTypes}`;
    }

    // Security: Check for executable files
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar', '.msi'];
    const fileName = file.name.toLowerCase();
    if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
      return 'Executable files are not allowed for security reasons';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        alert(validationError);
        // Clear the input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      setIsUploading(true);
      // Simulate upload delay for better UX
      setTimeout(() => {
        onFileChange(file);
        setIsUploading(false);
      }, 500);
    } else {
      onFileChange(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validationError = validateFile(file);
      if (validationError) {
        alert(validationError);
        return;
      }
      setIsUploading(true);
      setTimeout(() => {
        onFileChange(file);
        setIsUploading(false);
      }, 500);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    return '📎';
  };

  return (
    <div className="enhanced-file-upload-container">
      <label className="file-upload-label">{label}</label>

      <div
        className={`file-upload-dropzone ${isDragOver ? 'drag-over' : ''} ${error ? 'error' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="file-upload-input-hidden"
          style={{ display: 'none' }}
        />

        {isUploading ? (
          <div className="upload-progress">
            <div className="spinner">⏳</div>
            <p>Processing file...</p>
          </div>
        ) : currentFile ? (
          <div className="file-preview">
            <div className="file-icon">{getFileIcon(currentFile.type)}</div>
            <div className="file-details">
              <div className="file-name">{currentFile.name}</div>
              <div className="file-meta">
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB • {currentFile.type}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="remove-file-btn"
              title="Remove file"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📁</div>
            <div className="upload-text">
              <p><strong>Click to browse</strong> or drag and drop</p>
              <p className="upload-hint">Select a file from your computer</p>
            </div>
          </div>
        )}
      </div>

      <div className="file-requirements">
        <div className="requirement-item">
          <span className="req-icon">📏</span>
          <span>Max size: {maxSize}MB</span>
        </div>
        <div className="requirement-item">
          <span className="req-icon">📄</span>
          <span>Formats: {accept.replace('image/', '').replace('application/', '').toUpperCase()}</span>
        </div>
        <div className="requirement-item">
          <span className="req-icon">🔒</span>
          <span>Secure upload with validation</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default EnhancedUserManagementForm;