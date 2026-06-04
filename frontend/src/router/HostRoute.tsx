import { Navigate, Outlet, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../config/routes";
import { getDefaultRouteForRole } from "../services/authService";
import { getCurrentUser, isAdminUser, isHostUser } from "../store/authStore";

const HostRoute = () => {
    const location = useLocation();
    const currentUser = getCurrentUser();

    if (!currentUser) {
        const nextSearchParams = new URLSearchParams({
            redirectTo: `${location.pathname}${location.search}`,
        });

        return <Navigate to={`${APP_ROUTES.login}?${nextSearchParams.toString()}`} replace />;
    }

    if (isAdminUser(currentUser) || !isHostUser(currentUser)) {
        return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
    }

    return <Outlet />;
};

export default HostRoute;
