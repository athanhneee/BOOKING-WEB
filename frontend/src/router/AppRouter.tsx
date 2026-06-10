import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { APP_ROUTES } from "../config/routes";
import ProtectedRoute from "../router/ProtectedRoute";
import AuthLayout from "../views/layouts/AuthLayout";
import AdminLayout from "../views/layouts/AdminLayout.jsx";
import HostLayout from "../views/layouts/HostLayout";
import MainLayout from "../views/layouts/MainLayout";
import HostRoute from "./HostRoute";
import PageLoadingFallback from "../views/components/common/PageLoadingFallback";

// ── Static: HomePage (landing page, cần FCP nhanh) ──
import HomePage from "../views/pages/Home/HomePage";

// ── Lazy-loaded pages ──
const LoginPage = lazy(() => import("../views/pages/Auth/LoginPage"));
const RegisterPage = lazy(() => import("../views/pages/Auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../views/pages/Auth/ForgotPasswordPage"));

const SearchPage = lazy(() => import("../views/pages/Search/SearchPage"));
const AiSearchPage = lazy(() => import("../views/pages/AiSearch/AiSearchPage"));

const BlogPage = lazy(() => import("../views/pages/Blog/BlogPage"));
const BlogDetailPage = lazy(() => import("../views/pages/Blog/BlogDetailPage"));
const ContactPage = lazy(() => import("../views/pages/Contact/ContactPage"));

const ListingDetailPage = lazy(() => import("../views/pages/ListingDetail/ListingDetailPage"));
const HostMessagePage = lazy(() => import("../views/pages/HostMessage/HostMessagePage"));
const MessagesPage = lazy(() => import("../views/pages/Messages/MessagesPage"));

const ProfilePage = lazy(() => import("../views/pages/Trips"));
const WishlistPage = lazy(() => import("../views/pages/Wishlist/WishlistPage"));
const MultiBookingPage = lazy(() => import("../views/pages/MultiBooking/MultiBookingPage"));
const GuestPayment = lazy(() => import("../views/pages/GuestPayment"));
const PaymentResultPage = lazy(() => import("../views/pages/GuestPayment/PaymentResultPage"));

const TroThanhHostLanding = lazy(() => import("../views/pages/TroThanhHost/index.jsx"));
const DangKyHost = lazy(() => import("../views/pages/TroThanhHost/DangKyHost.jsx"));
const TrangThaiHost = lazy(() => import("../views/pages/TroThanhHost/TrangThai.jsx"));

// ── Admin pages ──
const AdminOverview = lazy(() => import("../views/pages/Admin/index.jsx"));
const KiemDuyetBaiDang = lazy(() => import("../views/pages/Admin/KiemDuyetBaiDang/index.jsx"));
const HoSoHost = lazy(() => import("../views/pages/Admin/HoSoHost/index.jsx"));
const PhanQuyenHeThong = lazy(() => import("../views/pages/Admin/PhanQuyenHeThong/index.jsx"));
const QuanLyNguoiDung = lazy(() => import("../views/pages/Admin/QuanLyNguoiDung/index.jsx"));

// ── Host pages ──
const CaiDat = lazy(() => import("../views/pages/Host/CaiDat"));
const BaoCao = lazy(() => import("../views/pages/Host/BaoCao"));
const DanhGia = lazy(() => import("../views/pages/Host/DanhGia"));
const DatPhong = lazy(() => import("../views/pages/Host/DatPhong"));
const HoTro = lazy(() => import("../views/pages/Host/HoTro"));
const KhachLuuTru = lazy(() => import("../views/pages/Host/KhachLuuTru"));
const LichLuuTru = lazy(() => import("../views/pages/Host/LichLuuTru"));
const ChoNghi = lazy(() => import("../views/pages/Host/ChoNghi"));
const ThemChoNghi = lazy(() => import("../views/pages/Host/ThemChoNghi"));
const ThanhToan = lazy(() => import("../views/pages/Host/ThanhToan"));
const TinNhan = lazy(() => import("../views/pages/Host/TinNhan"));

const NotFoundPage = lazy(() => import("../views/pages/NotFound/NotFoundPage"));

const AppRouter = () => {
    return (
        <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
                <Route path={APP_ROUTES.home} element={<MainLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path={APP_ROUTES.search.slice(1)} element={<SearchPage />} />
                    <Route path={APP_ROUTES.searchLegacy.slice(1)} element={<SearchPage />} />
                    <Route path={APP_ROUTES.aiSearch.slice(1)} element={<AiSearchPage />} />
                    <Route path={APP_ROUTES.blog.slice(1)} element={<BlogPage />} />
                    <Route path={APP_ROUTES.blogDetail.slice(1)} element={<BlogDetailPage />} />
                    <Route path={APP_ROUTES.contact.slice(1)} element={<ContactPage />} />
                    <Route path="news" element={<Navigate to={APP_ROUTES.contact} replace />} />
                    <Route path={APP_ROUTES.hostLanding.slice(1)} element={<TroThanhHostLanding />} />
                    <Route element={<ProtectedRoute />}>
                        <Route path={APP_ROUTES.accountProfile.slice(1)} element={<ProfilePage />} />
                        <Route path={APP_ROUTES.accountTrips.slice(1)} element={<ProfilePage />} />
                        <Route path={APP_ROUTES.accountWishlist.slice(1)} element={<WishlistPage />} />
                        <Route path={APP_ROUTES.multiBooking.slice(1)} element={<MultiBookingPage />} />
                        <Route path={APP_ROUTES.messages.slice(1)} element={<MessagesPage />} />
                        <Route path={APP_ROUTES.hostRegister.slice(1)} element={<DangKyHost />} />
                        <Route path={APP_ROUTES.hostStatus.slice(1)} element={<TrangThaiHost />} />
                    </Route>
                    <Route path="villa/:villaId" element={<ListingDetailPage />} />
                    <Route path="villa/:villaId/nhan-tin-host" element={<HostMessagePage />} />
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
                        <Route path="tin-nhan" element={<Navigate to={APP_ROUTES.hostMessages} replace />} />
                        <Route path="thanh-toan" element={<ThanhToan />} />
                        <Route path="danh-gia" element={<DanhGia />} />
                        <Route path="bao-cao" element={<BaoCao />} />
                        <Route path="ho-tro" element={<HoTro />} />
                        <Route path="cai-dat" element={<CaiDat />} />
                    </Route>
                </Route>

                <Route element={<HostRoute />}>
                    <Route path="/host" element={<HostLayout />}>
                        <Route index element={<Navigate to={APP_ROUTES.hostMessages} replace />} />
                        <Route path="tin-nhan" element={<TinNhan />} />
                    </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
                    <Route path={APP_ROUTES.adminOverview} element={<AdminLayout />}>
                        <Route index element={<AdminOverview />} />
                        <Route path="nguoi-dung" element={<QuanLyNguoiDung />} />
                        <Route path="kiem-duyet" element={<KiemDuyetBaiDang />} />
                        <Route path="ho-so-host" element={<HoSoHost />} />
                        <Route path="phan-quyen" element={<PhanQuyenHeThong />} />
                    </Route>
                </Route>

                <Route path={APP_ROUTES.hostOverviewLegacy} element={<Navigate to={APP_ROUTES.ownerDashboard} replace />} />

                <Route path={APP_ROUTES.guestPaymentResult} element={<PaymentResultPage />} />
                <Route path={APP_ROUTES.guestPayment} element={<GuestPayment />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
};

export default AppRouter;
