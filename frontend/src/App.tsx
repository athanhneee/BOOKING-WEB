import { Route, Routes } from "react-router-dom";
import { APP_ROUTES } from "./config/routes";
import AuthLayout from "./views/layouts/AuthLayout";
import MainLayout from "./views/layouts/MainLayout";
import ForgotPasswordPage from "./views/pages/Auth/ForgotPasswordPage";
import LoginPage from "./views/pages/Auth/LoginPage";
import RegisterPage from "./views/pages/Auth/RegisterPage";
import HomePage from "./views/pages/Home/HomePage";
import ListingDetailPage from "./views/pages/ListingDetail/ListingDetailPage";

function App() {
    return (
        <Routes>
            <Route path={APP_ROUTES.home} element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path={APP_ROUTES.search} element={<>Tim kiem</>} />
                <Route path="villa/:villaId" element={<ListingDetailPage />} />
            </Route>

            <Route element={<AuthLayout />}>
                <Route path={APP_ROUTES.login} element={<LoginPage />} />
                <Route path={APP_ROUTES.register} element={<RegisterPage />} />
                <Route path={APP_ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
            </Route>

            <Route path="*" element={<>Khong tim thay trang</>} />
        </Routes>
    );
}

export default App;
