import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, accessToken } = useAuthStore();

  // Si l'utilisateur n'est pas loggé ou n'a pas de token, on le renvoie au login
  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  // Contrôle par rôle : si la page nécessite un rôle précis ("ROLE_ADMIN") que l'utilisateur n'a pas
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />; // Ou rediriger vers la home
  }

  return <Outlet />;
};
