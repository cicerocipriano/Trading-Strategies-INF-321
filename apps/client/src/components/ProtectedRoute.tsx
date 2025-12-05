import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export interface ProtectedRouteProps {
    isAuthenticated: boolean;
    children: ReactElement;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, loading, error } = useAuth();
    const location = useLocation();

    if (loading) {
        return null;
    }

    if (!isAuthenticated || error) {
        return (
            <Navigate
                to="/"
                replace
                state={{ from: location }}
            />
        );
    }

    return children;
};

export default ProtectedRoute;