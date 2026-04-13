import React, { useState } from 'react';
import { authService } from '../services/api';
import { 
  Users, 
  User, 
  Home, 
  Fingerprint, 
  FolderOpen, 
  Building2, 
  ListChecks, 
  Loader2, 
  Image as ImageIcon, 
  FileText, 
  UploadCloud, 
  Trash2 
} from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import GlassCard from './ui/modern/GlassCard';

export interface UserFormData {
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
  [key: string]: string | number | boolean | File | null | undefined;
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

interface UserManagementSectionProps {
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  handleCreateUser: (e: React.FormEvent) => void;
  staffMembers: StaffMember[];
  fetchStaffMembers: () => void;
}

const EnhancedUserManagementForm: React.FC<UserManagementSectionProps> = ({
  formData,
  setFormData,
  staffMembers,
  fetchStaffMembers,
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
    const cleanSSNIT = ssnit.replace(/[\s-]/g, '').toUpperCase();
    if (!cleanSSNIT) return "SSNIT number is required";
    if (!/^[A-Z][0-9]{12}$/.test(cleanSSNIT)) return "SSNIT number must be in legacy format (e.g., C123456789012)";
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-slate-900 rounded-lg">
          <Users className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">User Management</h3>
      </div>
b
      <GlassCard className="p-5 shadow-lg border border-slate-200/50">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div>
            <h4 className="text-[10px] font-black text-slate-900 mb-3 border-b border-slate-200 pb-1.5 flex items-center gap-2 uppercase tracking-widest">
              <User className="w-4 h-4 text-blue-600" /> Personal Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <Input
                as="select"
                label="Role *"
                id="user-role"
                title="Select the user's role in the system"
                value={formData.role || 'cashier'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="cashier">Cashier</option>
                <option value="mobile_banker">Mobile Banker</option>
                <option value="operations_manager">Operations Manager</option>
                <option value="manager">Manager</option>
              </Input>
            </div>
          </div>

          {/* Address Information Section */}
          <div>
            <h4 className="text-[10px] font-black text-slate-900 mb-3 border-b border-slate-200 pb-1.5 flex items-center gap-2 uppercase tracking-widest">
              <Home className="w-4 h-4 text-blue-600" /> Address Details
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <Input
                as="textarea"
                label="House Address *"
                id="house-address"
                title="Enter the residential address"
                value={formData.house_address || ''}
                onChange={(e) => setFormData({ ...formData, house_address: e.target.value })}
                rows={3}
                required
                error={errors.house_address || undefined}
              />
              <Input
                as="textarea"
                label="Contact Address *"
                id="contact-address"
                title="Enter the contact or mailing address"
                value={formData.contact_address || ''}
                onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                rows={3}
                required
                error={errors.contact_address || undefined}
              />
            </div>
          </div>

          {/* Identification Information Section */}
          <div>
            <h4 className="text-[10px] font-black text-slate-900 mb-3 border-b border-slate-200 pb-1.5 flex items-center gap-2 uppercase tracking-widest">
              <Fingerprint className="w-4 h-4 text-blue-600" /> Identification
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <h4 className="text-[10px] font-black text-slate-900 mb-3 border-b border-slate-200 pb-1.5 flex items-center gap-2 uppercase tracking-widest">
              <FolderOpen className="w-4 h-4 text-blue-600" /> Documents
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FileUploadComponent
                label="Passport Picture *"
                accept="image/jpeg,image/jpg,image/png"
                onFileChange={(file) => setFormData({ ...formData, passport_picture: file })}
                error={errors.passport_picture}
                currentFile={formData.passport_picture}
              />
              <FileUploadComponent
                label="Application Letter *"
                accept="application/pdf"
                onFileChange={(file) => setFormData({ ...formData, application_letter: file })}
                error={errors.application_letter}
                currentFile={formData.application_letter}
              />
              <FileUploadComponent
                label="Appointment Letter *"
                accept="application/pdf"
                onFileChange={(file) => setFormData({ ...formData, appointment_letter: file })}
                error={errors.appointment_letter}
                currentFile={formData.appointment_letter}
              />
            </div>
          </div>

          {/* Bank Account Details Section */}
          <div>
            <h4 className="text-[10px] font-black text-slate-900 mb-3 border-b border-slate-200 pb-1.5 flex items-center gap-2 uppercase tracking-widest">
              <Building2 className="w-4 h-4 text-blue-600" /> Financial Routing
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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


          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            variant={!isSubmitting ? "primary" : "secondary"}
            className="w-full text-base py-3"
          >
            {isSubmitting ? 'Creating User...' : 'Establish Staff Identity'}
          </Button>
        </form>
      </GlassCard>

      {/* Staff Members List */}
      <div>
        <h4 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2 tracking-tighter uppercase">
          <ListChecks className="w-5 h-5 text-emerald-600" /> Staff Directory
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {staffMembers.length > 0 ? staffMembers.map((staff) => (
            <div key={staff.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:border-blue-600 transition-colors">
              <div className="font-black text-sm text-slate-900 text-center tracking-tight truncate">{staff.name}</div>
              <div className="text-[8px] text-center text-slate-500 font-bold uppercase tracking-widest mt-1">
                <span className="block">{staff.role.replace('_', ' ')}</span>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase mt-1 ${staff.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'
                  }`}>
                  {staff.status}
                </span>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center p-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              No staff members yet. Create your first user above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced File Upload Component (Modernized)
const FileUploadComponent = ({
  label, accept, onFileChange, error, currentFile
}: {
  label: string; accept: string;
  onFileChange: (file: File | null) => void; error: string | null; currentFile?: File | null;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setIsUploading(true);
      setTimeout(() => { onFileChange(file); setIsUploading(false); }, 500);
    } else { onFileChange(null); }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setIsUploading(true); setTimeout(() => { onFileChange(file); setIsUploading(false); }, 500); }
  };

  const inputId = label.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="flex flex-col">
      <label htmlFor={inputId} className="text-[10px] font-black text-slate-900 mb-2 ml-1 uppercase tracking-tight">{label}</label>
      {/* Hidden file input moved outside interactive div to fix accessibility issue */}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        title={label}
      />
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer bg-white
            ${isDragOver ? 'border-blue-600 bg-blue-50' : 'border-slate-300 hover:border-slate-500'}
            ${error ? 'border-red-400 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
      >
        {isUploading ? (
          <div className="text-gray-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-coastal-primary" />
            <span className="text-xs font-bold uppercase tracking-widest">Processing...</span>
          </div>
        ) : currentFile ? (
          <div className="flex flex-col items-center">
            <div className="mb-2">
              {currentFile.type.startsWith('image/') ? (
                <ImageIcon className="w-6 h-6 text-coastal-primary" />
              ) : (
                <FileText className="w-6 h-6 text-coastal-primary" />
              )}
            </div>
            <div className="text-sm font-black text-gray-700 uppercase tracking-widest">Upload</div>
            <div className="text-xs text-coastal-primary mt-1">Click to change</div>
          </div>
        ) : (
          <div className="text-gray-500 flex flex-col items-center">
            <UploadCloud className="w-8 h-8 mb-2 opacity-50" />
            <div className="text-sm font-bold">Click or Drag & Drop</div>
          </div>
        )}
      </div>
      {currentFile && (
        <div className="flex justify-end mt-1">
          <button type="button" onClick={() => onFileChange(null)} className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Remove {label.replace(' *', '')}
          </button>
        </div>
      )}
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

export default EnhancedUserManagementForm;
