import { useMemo, useState } from "react";
import { FiEye, FiKey, FiLock, FiUnlock } from "react-icons/fi";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import { useAdminOutletContext } from "../../../layouts/AdminLayout.jsx";
import {
    FilterTabs,
    PageHeader,
} from "../../Host/shared";
import {
    getInitials,
    hostCardClass,
    inputClassName,
    labelClassName,
    pageWrapperClass,
    primaryButtonClass,
    secondaryButtonClass,
    tableClassName,
} from "../../Host/sharedStyles";

const roleOptions = [
    { label: "Tất cả", value: "all" },
    { label: "Khách", value: "Guest" },
    { label: "Host", value: "Host" },
    { label: "Host mới", value: "Host new" },
    { label: "Admin", value: "Admin" },
];

const statusOptions = [
    { label: "Tất cả", value: "all" },
    { label: "Đang hoạt động", value: "active" },
    { label: "Bị khóa", value: "locked" },
    { label: "Chờ duyệt", value: "pending" },
];

const emptyPasswordState = { password: "", confirmPassword: "" };

const QuanLyNguoiDung = () => {
    const { users, logs, lockUser, unlockUser, resetPassword } = useAdminOutletContext();
    const [searchValue, setSearchValue] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [lockTargetId, setLockTargetId] = useState(null);
    const [lockReason, setLockReason] = useState("");
    const [lockError, setLockError] = useState("");
    const [passwordTargetId, setPasswordTargetId] = useState(null);
    const [passwordState, setPasswordState] = useState(emptyPasswordState);
    const [passwordError, setPasswordError] = useState("");
    const [detailTargetId, setDetailTargetId] = useState(null);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchValue.trim().toLowerCase();

        return users.filter((user) => {
            const matchesSearch =
                !normalizedSearch ||
                user.id.toLowerCase().includes(normalizedSearch) ||
                user.email.toLowerCase().includes(normalizedSearch);

            return (
                matchesSearch &&
                (roleFilter === "all" || user.role === roleFilter) &&
                (statusFilter === "all" || user.status === statusFilter)
            );
        });
    }, [roleFilter, searchValue, statusFilter, users]);

    const lockTarget = users.find((user) => user.id === lockTargetId) ?? null;
    const passwordTarget = users.find((user) => user.id === passwordTargetId) ?? null;
    const detailTarget = users.find((user) => user.id === detailTargetId) ?? null;
    const detailLogs = detailTarget ? logs.filter((log) => log.targetId === detailTarget.id) : [];

    const totalGuests = users.filter((user) => user.role === "Guest").length;
    const totalHosts = users.filter((user) => user.role === "Host" || user.role === "Host new").length;
    const totalLocked = users.filter((user) => user.status === "locked").length;

    const closeLockModal = () => {
        setLockTargetId(null);
        setLockReason("");
        setLockError("");
    };

    const closePasswordModal = () => {
        setPasswordTargetId(null);
        setPasswordState(emptyPasswordState);
        setPasswordError("");
    };

    const handleConfirmLock = () => {
        if (!lockTarget) {
            return;
        }

        if (lockTarget.status !== "locked" && !lockReason.trim()) {
            setLockError("Vui lòng nhập lý do khóa tài khoản.");
            return;
        }

        if (lockTarget.status === "locked") {
            unlockUser(lockTarget.id, lockReason.trim());
        } else {
            lockUser(lockTarget.id, lockReason.trim());
        }

        closeLockModal();
    };

    const handleResetPassword = () => {
        if (!passwordTarget) {
            return;
        }

        if (!passwordState.password.trim() || !passwordState.confirmPassword.trim()) {
            setPasswordError("Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.");
            return;
        }

        if (passwordState.password !== passwordState.confirmPassword) {
            setPasswordError("Mật khẩu xác nhận chưa khớp.");
            return;
        }

        resetPassword(passwordTarget.id);
        closePasswordModal();
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader
                    title="Quản lý người dùng"
                    subtitle="Tra cứu theo ID hoặc email, khóa tài khoản và hỗ trợ xử lý nhanh các yêu cầu nội bộ."
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article className={`${hostCardClass} bg-gradient-to-br from-teal-600 to-cyan-500 text-white`}>
                        <p className="text-sm font-medium text-white/80">Tổng người dùng</p>
                        <p className="mt-3 text-3xl font-bold">{users.length}</p>
                    </article>
                    <article className={hostCardClass}>
                        <p className="text-sm font-medium text-gray-500">Khách</p>
                        <p className="mt-3 text-3xl font-bold text-gray-900">{totalGuests}</p>
                    </article>
                    <article className={hostCardClass}>
                        <p className="text-sm font-medium text-gray-500">Host</p>
                        <p className="mt-3 text-3xl font-bold text-gray-900">{totalHosts}</p>
                    </article>
                    <article className={hostCardClass}>
                        <p className="text-sm font-medium text-gray-500">Đang bị khóa</p>
                        <p className="mt-3 text-3xl font-bold text-gray-900">{totalLocked}</p>
                    </article>
                </div>

                <div className={`${hostCardClass} space-y-4`}>
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                        <input
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder="Tìm theo ID hoặc Email..."
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                        />
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClassName}>
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <FilterTabs options={roleOptions} value={roleFilter} onChange={setRoleFilter} underline />
                </div>

                <div className={tableClassName}>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                {[
                                    "Người dùng",
                                    "Email",
                                    "Số điện thoại",
                                    "Vai trò",
                                    "Trạng thái",
                                    "Ngày tham gia",
                                    "Đăng nhập cuối",
                                    "Hành động",
                                ].map((column) => (
                                    <th key={column} className="px-4 py-3 font-medium">
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredUsers.map((user) => {
                                const disabledReason =
                                    user.role === "Admin"
                                        ? "Không thể khóa tài khoản Admin"
                                        : user.hasActiveBooking
                                          ? "Yêu cầu xử lý hết giao dịch trước khi thực hiện thao tác khóa"
                                          : "";

                                return (
                                    <tr key={user.id} className="transition-colors hover:bg-gray-50">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                                                    {getInitials(user.name)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-400">{user.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-500">{user.email}</td>
                                        <td className="px-4 py-4 text-gray-500">{user.phone}</td>
                                        <td className="px-4 py-4">
                                            <Badge status={user.role} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge status={user.status} />
                                        </td>
                                        <td className="px-4 py-4 text-gray-500">{user.joinDate}</td>
                                        <td className="px-4 py-4 text-gray-500">{user.lastLogin}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    disabled={Boolean(disabledReason)}
                                                    title={
                                                        disabledReason ||
                                                        (user.status === "locked" ? "Mở khóa tài khoản" : "Khóa tài khoản")
                                                    }
                                                    onClick={() => {
                                                        setLockTargetId(user.id);
                                                        setLockReason("");
                                                        setLockError("");
                                                    }}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300"
                                                >
                                                    {user.status === "locked" ? <FiUnlock size={16} /> : <FiLock size={16} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Đặt lại mật khẩu"
                                                    onClick={() => {
                                                        setPasswordTargetId(user.id);
                                                        setPasswordState(emptyPasswordState);
                                                        setPasswordError("");
                                                    }}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100"
                                                >
                                                    <FiKey size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Xem chi tiết"
                                                    onClick={() => setDetailTargetId(user.id)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100"
                                                >
                                                    <FiEye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={Boolean(lockTarget)}
                onClose={closeLockModal}
                title={lockTarget?.status === "locked" ? "Xác nhận mở khóa" : "Xác nhận khóa tài khoản"}
                description="Kiểm tra thông tin người dùng và nhập lý do trước khi xác nhận thao tác."
                showCloseButton
                bodyClassName="p-6"
            >
                {lockTarget ? (
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="font-semibold text-gray-900">{lockTarget.name}</p>
                            <p className="mt-1 text-sm text-gray-500">{lockTarget.email}</p>
                        </div>

                        {lockTarget.hasActiveBooking ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                Người dùng này có giao dịch chưa hoàn tất. Yêu cầu xử lý hết giao dịch trước khi thực hiện thao tác khóa.
                            </div>
                        ) : null}

                        <div>
                            <label className={labelClassName}>Lý do</label>
                            <textarea
                                value={lockReason}
                                onChange={(event) => {
                                    setLockReason(event.target.value);
                                    setLockError("");
                                }}
                                className="min-h-[120px] w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                            />
                            {lockError ? <p className="mt-2 text-sm text-red-600">{lockError}</p> : null}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button type="button" onClick={closeLockModal} className={secondaryButtonClass}>
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmLock}
                                className="inline-flex items-center justify-center rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <Modal
                isOpen={Boolean(passwordTarget)}
                onClose={closePasswordModal}
                title={passwordTarget ? `Đặt lại mật khẩu — ${passwordTarget.name}` : ""}
                description="Mật khẩu mới sẽ được gửi qua email đến người dùng."
                showCloseButton
                bodyClassName="p-6"
            >
                {passwordTarget ? (
                    <div className="space-y-5">
                        <div>
                            <label className={labelClassName}>Mật khẩu mới</label>
                            <input
                                type="password"
                                value={passwordState.password}
                                onChange={(event) => {
                                    setPasswordState((current) => ({ ...current, password: event.target.value }));
                                    setPasswordError("");
                                }}
                                className={inputClassName}
                            />
                        </div>

                        <div>
                            <label className={labelClassName}>Xác nhận mật khẩu</label>
                            <input
                                type="password"
                                value={passwordState.confirmPassword}
                                onChange={(event) => {
                                    setPasswordState((current) => ({ ...current, confirmPassword: event.target.value }));
                                    setPasswordError("");
                                }}
                                className={inputClassName}
                            />
                            {passwordError ? <p className="mt-2 text-sm text-red-600">{passwordError}</p> : null}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button type="button" onClick={closePasswordModal} className={secondaryButtonClass}>
                                Hủy
                            </button>
                            <button type="button" onClick={handleResetPassword} className={primaryButtonClass}>
                                Đặt lại mật khẩu
                            </button>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <Modal
                isOpen={Boolean(detailTarget)}
                onClose={() => setDetailTargetId(null)}
                title={detailTarget ? `Chi tiết người dùng — ${detailTarget.name}` : ""}
                description="Thông tin liên hệ, vai trò hiện tại và lịch sử thao tác liên quan."
                size="lg"
                showCloseButton
                bodyClassName="p-6"
            >
                {detailTarget ? (
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                        <section className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 text-2xl font-semibold text-white">
                                    {getInitials(detailTarget.name)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{detailTarget.name}</h3>
                                    <p className="text-sm text-gray-500">{detailTarget.email}</p>
                                    <p className="mt-1 text-sm text-gray-500">{detailTarget.phone}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Badge status={detailTarget.role} />
                                <Badge status={detailTarget.status} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm text-gray-500">Ngày tham gia</p>
                                    <p className="mt-1 font-medium text-gray-900">{detailTarget.joinDate}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Đăng nhập cuối</p>
                                    <p className="mt-1 font-medium text-gray-900">{detailTarget.lastLogin}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tổng đặt phòng</p>
                                    <p className="mt-1 font-medium text-gray-900">{detailTarget.totalBookings}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Có giao dịch đang chờ</p>
                                    <p className="mt-1 font-medium text-gray-900">{detailTarget.hasActiveBooking ? "Có" : "Không"}</p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-gray-100 bg-white p-5">
                            <h3 className="text-lg font-semibold text-gray-900">Lịch sử thay đổi</h3>
                            <div className="mt-4 space-y-4">
                                {detailLogs.length > 0 ? (
                                    detailLogs.map((log) => (
                                        <div key={log.id} className="rounded-xl border border-gray-100 p-4">
                                            <p className="text-sm font-medium text-gray-900">
                                                {log.action} bởi {log.adminName}
                                            </p>
                                            {log.reason ? <p className="mt-1 text-sm italic text-gray-500">Lý do: {log.reason}</p> : null}
                                            <p className="mt-2 text-xs text-gray-400">{log.time}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                                        Chưa có thay đổi nào cho người dùng này.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default QuanLyNguoiDung;
