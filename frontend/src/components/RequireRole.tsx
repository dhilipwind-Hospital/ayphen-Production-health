import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  roles: string[];
  children: React.ReactNode;
}

const RequireRole: React.FC<Props> = ({ roles, children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const role = String(user?.role || '').toLowerCase();
  const allowed = roles.map(r => r.toLowerCase()).includes(role);
  if (!allowed) return <Navigate to="/403" replace />;
  return <>{children}</>;
};

export default RequireRole;
