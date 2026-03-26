import ProtectedRoute from "./ProtectedRoute";

const HostRoute = () => {
    return <ProtectedRoute allowedRoles={["Host", "Host new", "Admin"]} />;
};

export default HostRoute;
