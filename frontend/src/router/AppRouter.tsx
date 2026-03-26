import { Navigate, Route, Routes } from "react-router-dom";
import { APP_ROUTES } from "../config/routes";
import ProtectedRoute from "../router/ProtectedRoute";
import AuthLayout from "../views/layouts/AuthLayout";
import AdminLayout from "../views/layouts/AdminLayout.jsx";
import HostLayout from "../views/layouts/HostLayout";
import MainLayout from "../views/layouts/MainLayout";
import ForgotPasswordPage from "../views/pages/Auth/ForgotPasswordPage";
import LoginPage from "../views/pages/Auth/LoginPage";
import RegisterPage from "../views/pages/Auth/RegisterPage";
import AdminOverview from "../views/pages/Admin/index.jsx";
import KiemDuyetBaiDang from "../views/pages/Admin/KiemDuyetBaiDang/index.jsx";
import PhanQuyenHeThong from "../views/pages/Admin/PhanQuyenHeThong/index.jsx";
import QuanLyNguoiDung from "../views/pages/Admin/QuanLyNguoiDung/index.jsx";
import GuestPayment from "../views/pages/GuestPayment";
import CaiDat from "../views/pages/Host/CaiDat";
import BaoCao from "../views/pages/Host/BaoCao";
import DanhGia from "../views/pages/Host/DanhGia";
import DatPhong from "../views/pages/Host/DatPhong";
import HoTro from "../views/pages/Host/HoTro";
import KhachLuuTru from "../views/pages/Host/KhachLuuTru";
import LichLuuTru from "../views/pages/Host/LichLuuTru";
import ChoNghi from "../views/pages/Host/ChoNghi";
import ThemChoNghi from "../views/pages/Host/ThemChoNghi";
import ThanhToan from "../views/pages/Host/ThanhToan";
import HomePage from "../views/pages/Home/HomePage";
import ListingDetailPage from "../views/pages/ListingDetail/ListingDetailPage";
import NotFoundPage from "../views/pages/NotFound/NotFoundPage";
import SearchPage from "../views/pages/Search/SearchPage";
import DangKyHost from "../views/pages/TroThanhHost/DangKyHost.jsx";
import TrangThaiHost from "../views/pages/TroThanhHost/TrangThai.jsx";
import TroThanhHostLanding from "../views/pages/TroThanhHost/index.jsx";
import ProfilePage from "../views/pages/Trips";
import HostRoute from "./HostRoute";

const AppRouter = () => {
    return (
        <Routes>
            <Route path={APP_ROUTES.home} element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path={APP_ROUTES.search.slice(1)} element={<SearchPage />} />
                <Route path={APP_ROUTES.hostLanding.slice(1)} element={<TroThanhHostLanding />} />
                <Route element={<ProtectedRoute />}>
                    <Route path={APP_ROUTES.accountProfile.slice(1)} element={<ProfilePage />} />
                    <Route path={APP_ROUTES.accountTrips.slice(1)} element={<ProfilePage />} />
                    <Route path={APP_ROUTES.hostRegister.slice(1)} element={<DangKyHost />} />
                    <Route path={APP_ROUTES.hostStatus.slice(1)} element={<TrangThaiHost />} />
                </Route>
                <Route path="villa/:villaId" element={<ListingDetailPage />} />
            </Route>

            <Route element={<AuthLayout />}>
                <Route path={APP_ROUTES.login} element={<LoginPage />} />
                <Route path={APP_ROUTES.register} element={<RegisterPage />} />
                <Route path={APP_ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
            </Route>

            <Route element={<HostRoute />}>
                <Route path="/chu-nha" element={<HostLayout />}>
                    <Route index element={<Navigate to={APP_ROUTES.hostProperties} replace />} />
                    <Route path="cho-nghi" element={<ChoNghi />} />
                    <Route path="cho-nghi/them-moi" element={<ThemChoNghi />} />
                    <Route path="dat-phong" element={<DatPhong />} />
                    <Route path="lich-luu-tru" element={<LichLuuTru />} />
                    <Route path="khach-luu-tru" element={<KhachLuuTru />} />
                    <Route path="thanh-toan" element={<ThanhToan />} />
                    <Route path="danh-gia" element={<DanhGia />} />
                    <Route path="bao-cao" element={<BaoCao />} />
                    <Route path="ho-tro" element={<HoTro />} />
                    <Route path="cai-dat" element={<CaiDat />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
                <Route path={APP_ROUTES.adminOverview} element={<AdminLayout />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="nguoi-dung" element={<QuanLyNguoiDung />} />
                    <Route path="kiem-duyet" element={<KiemDuyetBaiDang />} />
                    <Route path="phan-quyen" element={<PhanQuyenHeThong />} />
                </Route>
            </Route>

            <Route path={APP_ROUTES.hostOverviewLegacy} element={<Navigate to={APP_ROUTES.ownerDashboard} replace />} />
            <Route path={APP_ROUTES.guestPayment} element={<GuestPayment />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRouter;
