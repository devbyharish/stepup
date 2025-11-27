import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

export default function ProtectedRoute({ allowed = ['sysadmin','opsadmin','educator','supervisor'], children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Checking access...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowed.includes('*') || allowed.includes(user.role)) return children;
  return <div className="p-6">Access denied — your role <strong>{user.role}</strong> is not authorized for this page.</div>;
}
