import { Navigate, Outlet, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../config/routes";
import { getDefaultRouteForRole } from "../services/authService";
import { getCurrentUser, type UserRole } from "../store/authStore";

type ProtectedRouteProps = {
    allowedRoles?: UserRole[];
    redirectTo?: string;
};

const ProtectedRoute = ({ allowedRoles, redirectTo = APP_ROUTES.login }: ProtectedRouteProps) => {
    const location = useLocation();
    const currentUser = getCurrentUser();

    if (!currentUser) {
        const nextSearchParams = new URLSearchParams({
            redirectTo: `${location.pathname}${location.search}`,
        });

        return <Navigate to={`${redirectTo}?${nextSearchParams.toString()}`} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
