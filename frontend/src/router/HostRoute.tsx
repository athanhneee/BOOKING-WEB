import ProtectedRoute from "./ProtectedRoute";

const HostRoute = () => {
    return <ProtectedRoute allowedRoles={["host", "host new", "Admin"]} />;
};

export default HostRoute;
