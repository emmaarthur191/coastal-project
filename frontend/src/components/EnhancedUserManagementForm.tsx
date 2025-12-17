import React, { useState } from 'react';
import { authService } from '../services/api.ts';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import GlassCard from './ui/modern/GlassCard';

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

  // Validation functions (kept as is)
  const validateAddress = (address: string): string | null => {
    if (!address || address.trim().length < 10) return "Address must be at least 10 characters long";
    return null;
  };

  const validateGovernmentId = (id: string): string | null => {
    const cleanId = id.replace(/[\s-]/g, '').toUpperCase();
    if (!cleanId) return "Government ID is required";
    if (!/^[A-Z0-9]+$/.test(cleanId)) return "Government ID must contain only letters and numbers";
    if (cleanId.length < 6 || cleanId.length > 20) return "Government ID must be between 6 and 20 characters long";
    return null;
  };

  const validateSSNIT = (ssnit: string): string | null => {
    const cleanSSNIT = ssnit.replace(/[\s-]/g, '');
    if (!cleanSSNIT) return "SSNIT number is required";
    if (!/^\d{12}$/.test(cleanSSNIT)) return "SSNIT number must be 12 digits (format: AAA-NN-NNNNN)";
    return null;
  };

  const validateFile = (file: File | null, type: 'passport' | 'letter'): string | null => {
    if (!file) return "File is required";
    const maxSize = type === 'passport' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) return `File size exceeds ${type === 'passport' ? '2MB' : '5MB'} limit`;
    const validTypes = type === 'passport' ? ['image/jpeg', 'image/jpg', 'image/png'] : ['application/pdf'];
    if (!validTypes.includes(file.type)) return type === 'passport' ? "Only JPEG/JPG/PNG files are allowed" : "Only PDF files are allowed";
    return null;
  };

  const validateAccountNumber = (accountNumber: string): string | null => {
    if (!accountNumber) return "Account number is required";
    if (!/^[A-Z0-9]+$/.test(accountNumber)) return "Account number must contain only letters and numbers";
    if (accountNumber.length < 8 || accountNumber.length > 20) return "Account number must be between 8 and 20 characters long";
    return null;
  };

  const validateBranchCode = (branchCode: string): string | null => {
    if (!branchCode) return "Branch code is required";
    if (!/^[A-Z0-9]+$/.test(branchCode)) return "Branch code must contain only letters and numbers";
    if (branchCode.length < 3 || branchCode.length > 10) return "Branch code must be between 3 and 10 characters long";
    return null;
  };

  const validateRoutingNumber = (routingNumber: string): string | null => {
    const cleanRouting = routingNumber.replace(/[\s-]/g, '');
    if (!cleanRouting) return "Routing number is required";
    if (!/^\d{9}$/.test(cleanRouting)) return "Routing number must be 9 digits";
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
    if (!validateForm()) return;
    if (!phoneVerified) {
      alert('Please verify your phone number with OTP before creating the user.');
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await authService.createUser(formData);
      if (response.success) {
        alert(`User created! ID: ${response.data.staff_id || 'N/A'}`);
        setFormData({
          first_name: '', last_name: '', email: '', phone: '', role: 'cashier',
          house_address: '', contact_address: '', government_id: '', ssnit_number: '',
          passport_picture: null, application_letter: null, appointment_letter: null,
          bank_name: '', account_number: '', branch_code: '', routing_number: ''
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
    <div className="space-y-8">
      <div className="flex items-center space-x-2">
        <h3 className="text-2xl font-bold text-gray-800">👥 Enhanced User Management - Create New User</h3>
      </div>

      <GlassCard className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div>
            <h4 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">📋 Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name *"
                value={formData.first_name || ''}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
              <Input
                label="Last Name *"
                value={formData.last_name || ''}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
              <Input
                label="Email *"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              <Input
                label="Phone Number *"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                placeholder="+233 XX XXX XXXX"
                className="mb-2"
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Role *</label>
                <select
                  value={formData.role || 'cashier'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none"
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
          <div>
            <h4 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">🏠 Address Information</h4>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">House Address *</label>
                <textarea
                  value={formData.house_address || ''}
                  onChange={(e) => setFormData({ ...formData, house_address: e.target.value })}
                  rows={3}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none"
                />
                {errors.house_address && <div className="text-red-500 text-sm mt-1">{errors.house_address}</div>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Contact Address *</label>
                <textarea
                  value={formData.contact_address || ''}
                  onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                  rows={3}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none"
                />
                {errors.contact_address && <div className="text-red-500 text-sm mt-1">{errors.contact_address}</div>}
              </div>
            </div>
          </div>

          {/* Identification Information Section */}
          <div>
            <h4 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">🆔 Identification Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Government ID *"
                value={formData.government_id || ''}
                onChange={(e) => setFormData({ ...formData, government_id: e.target.value })}
                required
                placeholder="Enter government ID"
                error={errors.government_id || undefined}
              />
              <Input
                label="SSNIT Number *"
                value={formData.ssnit_number || ''}
                onChange={(e) => setFormData({ ...formData, ssnit_number: e.target.value })}
                required
                placeholder="Format: AAA-NN-NNNNN"
                error={errors.ssnit_number || undefined}
              />
            </div>
          </div>

          {/* File Uploads Section */}
          <div>
            <h4 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">📁 Document Uploads</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FileUploadComponent
                label="Passport Picture (JPEG/PNG, ≤2MB) *"
                accept="image/jpeg,image/jpg,image/png"
                maxSize={2}
                onFileChange={(file) => setFormData({ ...formData, passport_picture: file })}
                error={errors.passport_picture}
                currentFile={formData.passport_picture}
              />
              <FileUploadComponent
                label="Application Letter (PDF, ≤5MB) *"
                accept="application/pdf"
                maxSize={5}
                onFileChange={(file) => setFormData({ ...formData, application_letter: file })}
                error={errors.application_letter}
                currentFile={formData.application_letter}
              />
              <FileUploadComponent
                label="Appointment Letter (PDF, ≤5MB) *"
                accept="application/pdf"
                maxSize={5}
                onFileChange={(file) => setFormData({ ...formData, appointment_letter: file })}
                error={errors.appointment_letter}
                currentFile={formData.appointment_letter}
              />
            </div>
          </div>

          {/* Bank Account Details Section */}
          <div>
            <h4 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">🏦 Bank Account Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Bank Name *"
                value={formData.bank_name || ''}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                required
              />
              <Input
                label="Account Number *"
                value={formData.account_number || ''}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                required
                placeholder="8-20 alphanumeric characters"
                error={errors.account_number || undefined}
              />
              <Input
                label="Branch Code *"
                value={formData.branch_code || ''}
                onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                required
                placeholder="3-10 alphanumeric characters"
                error={errors.branch_code || undefined}
              />
              <Input
                label="Routing Number *"
                value={formData.routing_number || ''}
                onChange={(e) => setFormData({ ...formData, routing_number: e.target.value })}
                required
                placeholder="9 digits"
                error={errors.routing_number || undefined}
              />
            </div>
          </div>

          {/* OTP Verification Section */}
          <div>
            <h4 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">📱 Phone Verification</h4>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              {!otpSent ? (
                <Button type="button" onClick={handleSendOTP}>
                  Send OTP Code
                </Button>
              ) : !phoneVerified ? (
                <div className="space-y-4">
                  <Input
                    label="Enter OTP"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                  />
                  <div className="flex gap-4">
                    <Button type="button" onClick={handleVerifyOTP} variant="success">
                      Verify OTP
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                        setOtpExpiresIn(0);
                      }}
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Code expires in: {Math.floor(otpExpiresIn / 60)}:{String(otpExpiresIn % 60).padStart(2, '0')}
                  </p>
                </div>
              ) : (
                <div className="text-emerald-600 font-bold flex items-center gap-2">
                  ✅ Phone Verified!
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!phoneVerified || isSubmitting}
            variant={phoneVerified && !isSubmitting ? "primary" : "secondary"}
            className="w-full text-lg py-4"
          >
            {isSubmitting ? 'Creating User...' : phoneVerified ? 'Create User' : 'Verify Phone to Create User'}
          </Button>
        </form>
      </GlassCard>

      {/* Staff Members List */}
      <div>
        <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📋</span> Current Staff Members
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffMembers.length > 0 ? staffMembers.map((staff) => (
            <div key={staff.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:border-coastal-primary transition-colors">
              <div className="font-bold text-lg text-gray-900 text-center">{staff.name}</div>
              <div className="text-sm text-center text-gray-500 mt-2">
                <span className="block">{staff.role}</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase mt-1 ${staff.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {staff.status}
                </span>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center p-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              No staff members yet. Create your first user above! 👆
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced File Upload Component (Modernized)
const FileUploadComponent = ({
  label, accept, maxSize, onFileChange, error, currentFile
}: {
  label: string; accept: string; maxSize: number;
  onFileChange: (file: File | null) => void; error: string | null; currentFile?: File | null;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    /* Validation Logic Skipped for brevity, can implement same rules */
    const file = e.target.files?.[0] || null;
    if (file) {
      setIsUploading(true);
      setTimeout(() => { onFileChange(file); setIsUploading(false); }, 500);
    } else { onFileChange(null); }
  };

  // Basic logic wrapper for drag/drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setIsUploading(true); setTimeout(() => { onFileChange(file); setIsUploading(false); }, 500); }
  };

  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-gray-700 mb-1.5 ml-1">{label}</label>
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer bg-gray-50
            ${isDragOver ? 'border-coastal-primary bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />

        {isUploading ? (
          <div className="text-gray-500"><span className="animate-spin inline-block mr-2">⏳</span> Processing...</div>
        ) : currentFile ? (
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-2">{currentFile.type.startsWith('image/') ? '🖼️' : '📄'}</div>
            <div className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{currentFile.name}</div>
            <button type="button" onClick={(e) => { e.stopPropagation(); onFileChange(null); }} className="text-red-500 text-xs font-bold mt-2 hover:underline">Remove</button>
          </div>
        ) : (
          <div className="text-gray-500">
            <div className="text-2xl mb-2">📁</div>
            <div className="text-sm">Click or Drag & Drop</div>
          </div>
        )}
      </div>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

export default EnhancedUserManagementForm;