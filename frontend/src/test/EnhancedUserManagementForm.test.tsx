import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EnhancedUserManagementForm from '../components/EnhancedUserManagementForm';

describe('EnhancedUserManagementForm', () => {
  const mockProps = {
    formData: {
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
    },
    setFormData: jest.fn(),
    otpCode: '',
    setOtpCode: jest.fn(),
    phoneVerified: false,
    setPhoneVerified: jest.fn(),
    otpSent: false,
    setOtpSent: jest.fn(),
    otpExpiresIn: 0,
    setOtpExpiresIn: jest.fn(),
    handleSendOTP: jest.fn(),
    handleVerifyOTP: jest.fn(),
    handleCreateUser: jest.fn(),
    staffMembers: [],
    fetchStaffMembers: jest.fn()
  };

  test('renders all form sections', () => {
    render(<EnhancedUserManagementForm {...mockProps} />);

    // Check personal information section
    expect(screen.getByText('📋 Personal Information')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email *')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number *')).toBeInTheDocument();
    expect(screen.getByLabelText('Role *')).toBeInTheDocument();

    // Check address information section
    expect(screen.getByText('🏠 Address Information')).toBeInTheDocument();
    expect(screen.getByLabelText('House Address *')).toBeInTheDocument();
    expect(screen.getByLabelText('Contact Address *')).toBeInTheDocument();

    // Check identification information section
    expect(screen.getByText('🆔 Identification Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Government ID *')).toBeInTheDocument();
    expect(screen.getByLabelText('SSNIT Number *')).toBeInTheDocument();

    // Check file uploads section
    expect(screen.getByText('📁 Document Uploads')).toBeInTheDocument();
    expect(screen.getByText('Passport Picture (JPEG/PNG, ≤2MB) *')).toBeInTheDocument();
    expect(screen.getByText('Application Letter (PDF, ≤5MB) *')).toBeInTheDocument();
    expect(screen.getByText('Appointment Letter (PDF, ≤5MB) *')).toBeInTheDocument();

    // Check bank account details section
    expect(screen.getByText('🏦 Bank Account Details')).toBeInTheDocument();
    expect(screen.getByLabelText('Bank Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Number *')).toBeInTheDocument();
    expect(screen.getByLabelText('Branch Code *')).toBeInTheDocument();
    expect(screen.getByLabelText('Routing Number *')).toBeInTheDocument();

    // Check OTP verification section
    expect(screen.getByText('📱 Phone Verification')).toBeInTheDocument();
    expect(screen.getByText('Send OTP Code')).toBeInTheDocument();

    // Check submit button
    expect(screen.getByText('Verify Phone to Create User')).toBeInTheDocument();
  });

  test('input fields update form data', () => {
    render(<EnhancedUserManagementForm {...mockProps} />);

    fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'John' } });
    expect(mockProps.setFormData).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'John' }));

    fireEvent.change(screen.getByLabelText('House Address *'), { target: { value: '123 Main St' } });
    expect(mockProps.setFormData).toHaveBeenCalledWith(expect.objectContaining({ house_address: '123 Main St' }));
  });

  test('file upload fields work', () => {
    render(<EnhancedUserManagementForm {...mockProps} />);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Passport Picture (JPEG/PNG, ≤2MB) *').querySelector('input[type="file"]');
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
      expect(mockProps.setFormData).toHaveBeenCalledWith(expect.objectContaining({ passport_picture: file }));
    }
  });

  test('form validation shows errors', () => {
    render(<EnhancedUserManagementForm {...mockProps} />);

    // Try to submit with empty required fields
    fireEvent.submit(screen.getByRole('form'));

    // Should show validation errors
    expect(screen.getByText('Address must be at least 10 characters long')).toBeInTheDocument();
    expect(screen.getByText('Government ID is required')).toBeInTheDocument();
    expect(screen.getByText('SSNIT number is required')).toBeInTheDocument();
    expect(screen.getByText('File is required')).toBeInTheDocument();
    expect(screen.getByText('Account number is required')).toBeInTheDocument();
  });
});