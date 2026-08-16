import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect user to their role's default view if trying to access unauthorized route
    const defaultPath = user.role === 'teacher' ? '/teacher' : '/';
    return <Navigate to={defaultPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
