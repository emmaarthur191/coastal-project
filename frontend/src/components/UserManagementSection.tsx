import React from 'react';
import EnhancedUserManagementForm from './EnhancedUserManagementForm';
import './EnhancedUserManagementForm.css';

function UserManagementSection(props) {
  return (
    <div className="operations-user-management">
      <EnhancedUserManagementForm {...props} />
    </div>
  );
}

export default UserManagementSection;
