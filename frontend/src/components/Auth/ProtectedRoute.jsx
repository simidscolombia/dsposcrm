import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ redirectPath = '/login' }) => {
    // Verificar si existe el token en el localStorage
    const isAuthenticated = !!localStorage.getItem('adminToken');

    if (!isAuthenticated) {
        return <Navigate to={redirectPath} replace />;
    }

    // Si está autenticado, renderizar la ruta hija
    return <Outlet />;
};

export default ProtectedRoute;
