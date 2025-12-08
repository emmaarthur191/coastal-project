# User Management Update - Implementation Plan

## Summary
This implementation plan outlines the step-by-step approach to update the User Management interfaces on both the Manager Dashboard and Operations Manager Dashboard with the new required fields and file upload functionality.

## Current Status
✅ **Design Complete** - All requirements analyzed, database schema verified, validation rules defined
✅ **No Database Changes Needed** - All required fields already exist in UserProfile and UserDocuments models
✅ **Backend Ready** - UserManagementSerializer already supports all new fields with validation
✅ **Security Validated** - File upload handling and storage design complete

## Implementation Steps

### Phase 1: Create Enhanced Form Component
**File**: `frontend/src/components/EnhancedUserManagementForm.tsx`

```typescript
// Step 1: Create new form component
import React, { useState } from 'react';
import { authService } from '../services/api.ts';

// Step 2: Define interfaces
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

// Step 3: Implement validation functions
const EnhancedUserManagementForm = ({
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

  // Validation functions (implement all from design doc)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate all fields and set errors
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

  // Render form with all sections
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

      {/* Staff Members List (existing functionality) */}
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

// File Upload Component
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileChange(file);
  };

  return (
    <div className="file-upload-container">
      <label className="file-upload-label">{label}</label>
      <div className="file-upload-input-container">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="file-upload-input"
        />
        <div className="file-info">
          {currentFile ? (
            <>
              <span className="file-name">{currentFile.name}</span>
              <span className="file-size">({(currentFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </>
          ) : (
            <span className="file-placeholder">No file selected</span>
          )}
        </div>
      </div>
      <div className="file-requirements">
        <span>Max size: {maxSize}MB</span>
        <span>Accepted formats: {accept.replace('image/', '').replace('application/', '')}</span>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default EnhancedUserManagementForm;
```

### Phase 2: Update Manager Dashboard
**File**: `frontend/src/components/manager/UserManagementSection.tsx`

```typescript
// Replace existing UserManagementSection with EnhancedUserManagementForm
import EnhancedUserManagementForm from '../EnhancedUserManagementForm';

const UserManagementSection = (props) => {
  return <EnhancedUserManagementForm {...props} />;
};

export default UserManagementSection;
```

### Phase 3: Update Operations Manager Dashboard
**File**: `frontend/src/components/UserManagementSection.jsx`

```typescript
// Replace existing UserManagementSection with EnhancedUserManagementForm
import EnhancedUserManagementForm from './EnhancedUserManagementForm';

function UserManagementSection(props) {
  return <EnhancedUserManagementForm {...props} />;
}

export default UserManagementSection;
```

### Phase 4: Update API Service
**File**: `frontend/src/services/api.ts`

```typescript
// Ensure createUser method handles file uploads properly
const createUser = async (userData) => {
  try {
    // Prepare form data for file uploads
    const formData = new FormData();

    // Add regular fields
    Object.keys(userData).forEach(key => {
      if (key !== 'passport_picture' && key !== 'application_letter' && key !== 'appointment_letter') {
        formData.append(key, userData[key]);
      }
    });

    // Add files if they exist
    if (userData.passport_picture) {
      formData.append('passport_picture', userData.passport_picture);
    }
    if (userData.application_letter) {
      formData.append('application_letter', userData.application_letter);
    }
    if (userData.appointment_letter) {
      formData.append('appointment_letter', userData.appointment_letter);
    });

    const response = await fetch('/api/users/create/', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to create user' };
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Network error occurred' };
  }
};
```

### Phase 5: Add CSS Styling
**File**: `frontend/src/components/EnhancedUserManagementForm.css`

```css
/* Add comprehensive styling for the new form */
.enhanced-user-management-form {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.form-section {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.form-section h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: bold;
  color: #1e293b;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-weight: 600;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.error-message {
  color: #ef4444;
  font-size: 14px;
  margin-top: 4px;
}

.file-uploads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.file-upload-container {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.file-upload-input {
  display: none;
}

.file-upload-input-container {
  margin: 12px 0;
  padding: 16px;
  background: #f8fafc;
  border-radius: 6px;
  cursor: pointer;
}

.file-info {
  margin-top: 8px;
  font-size: 14px;
  color: #64748b;
}

.file-requirements {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
}

.otp-section {
  background: #f0fdf4;
  border: 1px solid #10b981;
  border-radius: 8px;
  padding: 16px;
}

.verified-status {
  color: #10b981;
  font-weight: 600;
}

.submit-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  margin-top: 24px;
}

.submit-button:disabled {
  background: #6b7280;
  cursor: not-allowed;
  opacity: 0.6;
}

.staff-list-section {
  margin-top: 40px;
  border-top: 1px solid #e2e8f0;
  padding-top: 30px;
}

.staff-list {
  display: grid;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.staff-member {
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 8px;
  background: #f9f9f9;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .file-uploads-grid {
    grid-template-columns: 1fr;
  }
}
```

### Phase 6: Testing Plan

```markdown
### Test Cases

1. **Form Validation Test**
   - Test all required fields show errors when empty
   - Test address fields with <10 characters
   - Test government ID with invalid formats
   - Test SSNIT with invalid formats
   - Test bank account fields with invalid formats

2. **File Upload Test**
   - Test uploading valid passport picture (JPEG/PNG ≤2MB)
   - Test uploading invalid passport picture (wrong type, too large)
   - Test uploading valid PDF letters (≤5MB)
   - Test uploading invalid PDF letters (wrong type, too large)

3. **OTP Verification Test**
   - Test OTP sending and verification flow
   - Test form submission without OTP verification

4. **Form Submission Test**
   - Test successful form submission with all valid data
   - Test error handling for API failures
   - Test form reset after successful submission

5. **Backward Compatibility Test**
   - Test existing user records are unaffected
   - Test existing functionality still works

6. **Responsive Design Test**
   - Test form layout on mobile devices
   - Test form layout on tablet devices
   - Test form layout on desktop

7. **Cross-Browser Test**
   - Test on Chrome, Firefox, Safari, Edge
   - Test file upload functionality across browsers
```

## Implementation Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Create Enhanced Form Component | 2-3 hours |
| 2 | Implement Validation Functions | 1-2 hours |
| 3 | Create File Upload Components | 1-2 hours |
| 4 | Update Manager Dashboard | 30 minutes |
| 5 | Update Operations Manager Dashboard | 30 minutes |
| 6 | Update API Service | 1 hour |
| 7 | Add CSS Styling | 1-2 hours |
| 8 | Testing & Debugging | 2-3 hours |
| 9 | Final Review & Deployment | 1 hour |

**Total Estimated Time**: 10-15 hours

## Risk Assessment

| Risk | Mitigation Strategy |
|------|---------------------|
| File upload issues | Test thoroughly with different file types/sizes |
| Validation conflicts | Ensure client-side validation matches server-side |
| Performance issues | Optimize form rendering and validation |
| Browser compatibility | Test on multiple browsers, use polyfills if needed |
| Backward compatibility | Ensure all existing functionality remains intact |

## Success Criteria

✅ All new fields are present and mandatory
✅ File uploads work with proper validation
✅ Form validation shows clear error messages
✅ OTP verification still works
✅ Both dashboards updated consistently
✅ Existing user records unaffected
✅ UI matches existing dashboard design
✅ Responsive design works on all devices
✅ All tests pass

## Next Steps

1. **Switch to Code Mode** to begin implementation
2. **Create EnhancedUserManagementForm.tsx** component
3. **Update both dashboard components** to use new form
4. **Update API service** for file upload handling
5. **Add CSS styling** for new components
6. **Test thoroughly** and fix any issues
7. **Deploy** to production

The implementation is ready to begin. All design work is complete, database schema is verified, and the implementation plan is detailed and comprehensive.