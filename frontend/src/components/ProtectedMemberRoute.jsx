import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedMemberRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMemberAccess = () => {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('accessToken');

      if (!token) {
        navigate('/login');
        return;
      }

      // Check if we're in test mode - allow all authenticated users
      const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

      if (isTestMode) {
        console.log('Test mode enabled - allowing member dashboard access for all authenticated users');
        setUser(userData);
        setLoading(false);
        return;
      }

      if (userData.role !== 'customer') {
        // Redirect based on role
        if (userData.role === 'staff' || userData.role === 'cashier') {
          navigate('/staff-dashboard');
        } else {
          navigate('/unauthorized');
        }
        return;
      }

      setUser(userData);
      setLoading(false);
    };

    checkMemberAccess();
  }, [navigate]);

  if (loading) {
    return <div>Checking member access...</div>;
  }

  return user?.role === 'customer' ? children : null;
};

export default ProtectedMemberRoute;