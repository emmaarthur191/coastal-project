# User Management Interface Update - Comprehensive Design

## Current System Analysis

### Frontend Components
1. **Manager Dashboard** (`ManagerDashboard.tsx`):
   - Uses `UserManagementSection` component from `components/manager/UserManagementSection.tsx`
   - Basic form with: Name, Email, Phone, Role, OTP verification
   - No file uploads or additional fields

2. **Operations Manager Dashboard** (`OperationsManagerDashboard.tsx`):
   - Uses `UserManagementSection` component from `components/UserManagementSection.jsx`
   - More detailed form with: First Name, Last Name, Email, Phone, Password, Role, OTP verification
   - No file uploads or additional fields

### Backend Models
1. **User Model** (`users/models.py`):
   - Basic user fields: email, first_name, last_name, role, etc.
   - Extended by `UserProfile` model with additional fields

2. **UserProfile Model** (`users/models.py`):
   - Already contains the required fields: house_address, contact_address, government_id, ssnit_number
   - Already contains bank account fields: bank_name, account_number, branch_code, routing_number
   - Has validation methods for these fields

3. **UserDocuments Model** (`users/models.py`):
   - Already supports document uploads with proper file type and size validation
   - Supports passport_picture, application_letter, appointment_letter
   - Has file size limits: 2MB for passport, 5MB for letters

4. **Serializers** (`users/serializers.py`):
   - `UserManagementSerializer` already includes all required fields
   - Has comprehensive validation for government_id, ssnit_number, account_number, routing_number, branch_code
   - Supports file upload handling

## Design Requirements

### New Form Fields
1. **Address Information** (Mandatory):
   - House Address (TextField, min 10 chars)
   - Contact Address (TextField, min 10 chars)

2. **Identification Information** (Mandatory):
   - Government ID (CharField, alphanumeric, 6-20 chars)
   - SSNIT Number (CharField, 12 digits format: AAA-NN-NNNNN)

3. **File Uploads** (Mandatory):
   - Passport Picture (JPEG/PNG, max 2MB)
   - Copy of Application Letter (PDF, max 5MB)
   - Copy of Appointment Letter (PDF, max 5MB)

4. **Bank Account Details** (Mandatory):
   - Bank Name (CharField)
   - Account Number (CharField, alphanumeric, 8-20 chars)
   - Branch Code (CharField, alphanumeric, 3-10 chars)
   - Routing Number (CharField, 9 digits)

### Validation Rules
1. **Address Validation**:
   - Minimum 10 characters for both house and contact addresses
   - Cannot be empty or whitespace only

2. **Government ID Validation**:
   - Alphanumeric only (letters and numbers)
   - Length between 6-20 characters
   - No special characters allowed

3. **SSNIT Number Validation**:
   - Exactly 12 digits
   - Format: AAA-NN-NNNNN (where A=letter, N=number)
   - Can accept with or without dashes

4. **File Upload Validation**:
   - Passport Picture: JPEG/PNG only, max 2MB
   - Application Letter: PDF only, max 5MB
   - Appointment Letter: PDF only, max 5MB

5. **Bank Account Validation**:
   - Account Number: 8-20 alphanumeric characters
   - Branch Code: 3-10 alphanumeric characters
   - Routing Number: Exactly 9 digits

## Implementation Plan

### Database Schema Updates
**No schema changes needed** - All required fields already exist in the `UserProfile` model and `UserDocuments` model.

### Backend API Updates
**No API changes needed** - The `UserManagementSerializer` already handles all required fields with proper validation.

### Frontend Implementation

#### 1. Enhanced User Management Form Component
Create a new `EnhancedUserManagementForm.tsx` component that will be used by both dashboards:

```typescript
// Components needed:
- AddressFieldsSection
- IdentificationFieldsSection
- FileUploadSection
- BankAccountFieldsSection
- ValidationErrorDisplay
```

#### 2. Form Structure
```typescript
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
```

#### 3. Validation Functions
```typescript
// Address validation
const validateAddress = (address: string): string | null => {
  if (!address || address.trim().length < 10) {
    return "Address must be at least 10 characters long";
  }
  return null;
};

// Government ID validation
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

// SSNIT validation
const validateSSNIT = (ssnit: string): string | null => {
  const cleanSSNIT = ssnit.replace(/[\s-]/g, '');
  if (!cleanSSNIT) return "SSNIT number is required";
  if (!/^\d{12}$/.test(cleanSSNIT)) {
    return "SSNIT number must be 12 digits (format: AAA-NN-NNNNN)";
  }
  return null;
};

// File validation
const validateFile = (file: File, type: 'passport' | 'letter'): string | null => {
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

// Bank account validation
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
```

#### 4. File Upload Component
```typescript
interface FileUploadProps {
  label: string;
  accept: string;
  maxSize: number;
  onFileChange: (file: File | null) => void;
  error: string | null;
  currentFile?: File | null;
}

const FileUploadComponent = ({
  label,
  accept,
  maxSize,
  onFileChange,
  error,
  currentFile
}: FileUploadProps) => {
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
```

#### 5. Form Submission Logic
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate all fields
  const addressError = validateAddress(formData.house_address) ||
                      validateAddress(formData.contact_address);
  const idError = validateGovernmentId(formData.government_id);
  const ssnitError = validateSSNIT(formData.ssnit_number);
  const passportError = validateFile(formData.passport_picture, 'passport');
  const appLetterError = validateFile(formData.application_letter, 'letter');
  const appointLetterError = validateFile(formData.appointment_letter, 'letter');
  const accountError = validateAccountNumber(formData.account_number);
  const branchError = validateBranchCode(formData.branch_code);
  const routingError = validateRoutingNumber(formData.routing_number);

  // Set all errors
  setErrors({
    house_address: validateAddress(formData.house_address),
    contact_address: validateAddress(formData.contact_address),
    government_id: idError,
    ssnit_number: ssnitError,
    passport_picture: passportError,
    application_letter: appLetterError,
    appointment_letter: appointLetterError,
    account_number: accountError,
    branch_code: branchError,
    routing_number: routingError
  });

  // Check if any errors exist
  if (addressError || idError || ssnitError || passportError ||
      appLetterError || appointLetterError || accountError ||
      branchError || routingError) {
    return;
  }

  // Prepare form data for API submission
  const submissionData = {
    ...formData,
    // Convert files to base64 or use FormData for upload
    passport_picture: formData.passport_picture,
    application_letter: formData.application_letter,
    appointment_letter: formData.appointment_letter
  };

  try {
    setIsSubmitting(true);
    const response = await authService.createUser(submissionData);

    if (response.success) {
      // Handle success
      alert('User created successfully!');
      resetForm();
    } else {
      // Handle API errors
      alert(`Failed to create user: ${response.error}`);
    }
  } catch (error) {
    console.error('Error creating user:', error);
    alert('An error occurred while creating the user.');
  } finally {
    setIsSubmitting(false);
  }
};
```

## Integration with Existing Dashboards

### Manager Dashboard Integration
1. Replace current `UserManagementSection` with new `EnhancedUserManagementForm`
2. Update the `ManagerDashboard.tsx` to pass all required props
3. Ensure OTP verification still works with new form

### Operations Manager Dashboard Integration
1. Replace current `UserManagementSection` with new `EnhancedUserManagementForm`
2. Update the `OperationsManagerDashboard.tsx` to pass all required props
3. Ensure existing functionality is preserved

## Backward Compatibility
1. **Database**: No schema changes needed - all fields already exist
2. **API**: Existing API endpoints work with new fields
3. **Existing Records**: All current user records remain unaffected
4. **Optional Fields**: New fields are optional in serializers for backward compatibility

## Security Considerations
1. **File Storage**: Use secure storage with proper access controls
2. **Data Validation**: Comprehensive validation on both client and server
3. **Error Handling**: Clear error messages without exposing sensitive information
4. **File Size Limits**: Enforce size limits to prevent DoS attacks

## Implementation Steps for Code Mode

1. **Create Enhanced Form Component**
   - Develop `EnhancedUserManagementForm.tsx` with all new fields
   - Implement validation functions
   - Create file upload components

2. **Update Manager Dashboard**
   - Replace existing form with new component
   - Ensure all props are passed correctly
   - Test OTP verification integration

3. **Update Operations Manager Dashboard**
   - Replace existing form with new component
   - Ensure all props are passed correctly
   - Test form submission

4. **Update API Service**
   - Ensure `authService.createUser` handles file uploads properly
   - Add proper error handling for file uploads

5. **Add CSS Styling**
   - Style new form components to match existing dashboard design
   - Ensure responsive layout

6. **Testing**
   - Test all validation scenarios
   - Test file upload functionality
   - Test form submission with all fields
   - Test backward compatibility

## Timeline Estimate
- Design & Planning: 1 day (completed)
- Frontend Implementation: 2-3 days
- Backend Integration: 1 day
- Testing & Debugging: 1-2 days
- Deployment: 1 day

Total: 5-7 days