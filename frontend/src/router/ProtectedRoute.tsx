import { Navigate, Outlet, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../config/routes";
import { getDefaultRouteForRole } from "../services/authService";
import { getCurrentUser, isAdminUser, type AuthUser, type UserRole } from "../store/authStore";

type ProtectedRouteProps = {
    allowedRoles?: UserRole[];
    redirectTo?: string;
};

const hasAllowedRole = (user: AuthUser, allowedRoles: UserRole[]) =>
    allowedRoles.some((role) => {
        if (String(role).toLowerCase() === "admin") {
            return isAdminUser(user);
        }

        return user.role === role;
    });

const ProtectedRoute = ({ allowedRoles, redirectTo = APP_ROUTES.login }: ProtectedRouteProps) => {
    const location = useLocation();
    const currentUser = getCurrentUser();

    if (!currentUser) {
        const nextSearchParams = new URLSearchParams({
            redirectTo: `${location.pathname}${location.search}`,
        });

        return <Navigate to={`${redirectTo}?${nextSearchParams.toString()}`} replace />;
    }

    if (allowedRoles && !hasAllowedRole(currentUser, allowedRoles)) {
        return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
