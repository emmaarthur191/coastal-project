import React from 'react';
import EnhancedUserManagementForm from '../EnhancedUserManagementForm';
import '../EnhancedUserManagementForm.css';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: string;
}

interface UserManagementSectionProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleCreateUser: (e: React.FormEvent) => void;
  staffMembers: StaffMember[];
  fetchStaffMembers: () => void;
}

const UserManagementSection: React.FC<UserManagementSectionProps> = (props) => {
  return (
    <div className="manager-user-management">
      <EnhancedUserManagementForm {...props} />
    </div>
  );
};

export default UserManagementSection;
