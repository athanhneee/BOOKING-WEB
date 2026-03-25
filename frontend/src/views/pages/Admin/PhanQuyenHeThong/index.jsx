import { useMemo, useState } from "react";
import { FiInfo } from "react-icons/fi";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import { useAdminOutletContext } from "../../../layouts/AdminLayout.jsx";
import { FilterTabs, inputClassName, labelClassName, pageWrapperClass, primaryButtonClass, secondaryButtonClass, tableClassName } from "../../Host/shared";

const logFilterOptions = [
    { label: "Tất cả", value: "all" },
    { label: "Thay đổi quyền", value: "role-only" },
];

const roleOptions = ["Guest", "Host", "Host new", "Admin"];

const PhanQuyenHeThong = () => {
    const { currentAdmin, users, listings, logs, changeRole } = useAdminOutletContext();
    const [draftRoles, setDraftRoles] = useState(() => Object.fromEntries(users.map((user) => [user.id, user.role])));
    const [logFilter, setLogFilter] = useState("all");
    const [confirmTargetId, setConfirmTargetId] = useState(null);
    const [changeReason, setChangeReason] = useState("");
    const [reasonError, setReasonError] = useState("");
    const isSuperAdmin = currentAdmin.id === "u006";

    const roleLogs = useMemo(() => {
        if (logFilter === "role-only") {
            return logs.filter((log) => log.action === "Thay đổi quyền");
        }

        return logs;
    }, [logFilter, logs]);

    const confirmTarget = users.find((user) => user.id === confirmTargetId) ?? null;
    const nextRole = confirmTarget ? draftRoles[confirmTarget.id] ?? confirmTarget.role : "";
    const demoteAdminBlocked = Boolean(confirmTarget && confirmTarget.role === "Admin" && nextRole !== "Admin" && !isSuperAdmin);
    const hostListingsWarning = Boolean(
        confirmTarget &&
            (confirmTarget.role === "Host" || confirmTarget.role === "Host new") &&
            nextRole !== "Host" &&
            nextRole !== "Host new" &&
            listings.some(
                (listing) =>
                    listing.hostId === confirmTarget.id &&
                    (listing.status === "approved" || listing.status === "pending"),
            ),
    );

    const closeModal = () => {
        setConfirmTargetId(null);
        setChangeReason("");
        setReasonError("");
    };

    const handleConfirmChange = () => {
        if (!confirmTarget) {
            return;
        }

        if (!changeReason.trim()) {
            setReasonError("Vui lòng nhập lý do thay đổi.");
            return;
        }

        changeRole(confirmTarget.id, nextRole, changeReason.trim());
        setDraftRoles((current) => ({ ...current, [confirmTarget.id]: nextRole }));
        closeModal();
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-cyan-600 shadow-sm">
                            <FiInfo size={18} />
                        </span>
                        <div>
                            <p className="font-semibold text-cyan-900">Chỉ tài khoản Admin cấp cao mới được sử dụng chức năng này.</p>
                            <p className="mt-1 text-sm text-cyan-700">
                                Mọi thay đổi phân quyền đều được ghi nhật ký và kiểm tra hợp lệ trước khi lưu.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Ma trận phân quyền</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Mỗi người dùng phải có ít nhất 1 vai trò hợp lệ và chỉ Admin mới được thay đổi quyền của người khác.
                        </p>
                    </div>

                    <div className={tableClassName}>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    {["Người dùng", "Email", "Vai trò hiện tại", "Thay đổi vai trò", "Trạng thái", "Hành động"].map((column) => (
                                        <th key={column} className="px-4 py-3 font-medium">
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {users.map((user) => {
                                    const selectedRole = draftRoles[user.id] ?? user.role;
                                    const cannotEditSelf = user.id === currentAdmin.id;
                                    const cannotDemoteAdmin = user.role === "Admin" && !isSuperAdmin && user.id !== currentAdmin.id;
                                    const selectDisabled = cannotEditSelf || cannotDemoteAdmin;
                                    const roleChanged = selectedRole !== user.role;

                                    return (
                                        <tr key={user.id}>
                                            <td className="px-4 py-4 font-medium text-gray-900">{user.name}</td>
                                            <td className="px-4 py-4 text-gray-500">{user.email}</td>
                                            <td className="px-4 py-4">
                                                <Badge status={user.role} />
                                            </td>
                                            <td className="px-4 py-4">
                                                <select
                                                    value={selectedRole}
                                                    disabled={selectDisabled}
                                                    title={
                                                        cannotEditSelf
                                                            ? "Không thể thay đổi quyền của chính mình"
                                                            : cannotDemoteAdmin
                                                              ? "Chỉ Admin cấp cao mới được gỡ bỏ Role Admin của người khác"
                                                              : "Chọn vai trò mới"
                                                    }
                                                    onChange={(event) =>
                                                        setDraftRoles((current) => ({ ...current, [user.id]: event.target.value }))
                                                    }
                                                    className={inputClassName}
                                                >
                                                    {roleOptions.map((role) => (
                                                        <option key={role} value={role}>
                                                            {role === "Host new" ? "Host mới" : role}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge status={user.status} />
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={!roleChanged || selectDisabled}
                                                        onClick={() => {
                                                            setConfirmTargetId(user.id);
                                                            setChangeReason("");
                                                            setReasonError("");
                                                        }}
                                                        className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-cyan-200"
                                                    >
                                                        Lưu thay đổi
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDraftRoles((current) => ({ ...current, [user.id]: user.role }))}
                                                        className={secondaryButtonClass}
                                                    >
                                                        Đặt lại
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Nhật ký thay đổi phân quyền</h2>
                        <p className="mt-1 text-sm text-gray-500">Theo dõi mọi lần chỉnh sửa role và lý do đi kèm.</p>
                    </div>

                    <FilterTabs options={logFilterOptions} value={logFilter} onChange={setLogFilter} />

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        {roleLogs.length > 0 ? (
                            <div className="space-y-4">
                                {roleLogs.map((log) => (
                                    <div key={log.id} className="flex gap-4 rounded-xl border border-gray-100 p-4">
                                        <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-violet-500" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {log.adminName} đã {log.action.toLowerCase()} — {log.targetUser}
                                            </p>
                                            {log.reason ? <p className="mt-1 text-sm italic text-gray-500">Lý do: {log.reason}</p> : null}
                                            <p className="mt-2 text-xs text-gray-400">{log.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                                Chưa có thay đổi phân quyền nào.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <Modal
                isOpen={Boolean(confirmTarget)}
                onClose={closeModal}
                title="Xác nhận thay đổi phân quyền"
                description={confirmTarget ? `Bạn đang thay đổi quyền của ${confirmTarget.name}` : ""}
                showCloseButton
                bodyClassName="p-6"
            >
                {confirmTarget ? (
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-sm text-gray-500">Từ</p>
                            <div className="mt-2">
                                <Badge status={confirmTarget.role} />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">Thành</p>
                            <div className="mt-2">
                                <Badge status={nextRole} />
                            </div>
                        </div>

                        {demoteAdminBlocked ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                Chỉ Admin cấp cao mới được gỡ bỏ Role Admin.
                            </div>
                        ) : null}

                        {hostListingsWarning ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                Người dùng có bài đăng đang hoạt động. Hãy xử lý trước nếu cần.
                            </div>
                        ) : null}

                        <div>
                            <label className={labelClassName}>Lý do thay đổi</label>
                            <textarea
                                value={changeReason}
                                onChange={(event) => {
                                    setChangeReason(event.target.value);
                                    setReasonError("");
                                }}
                                className="min-h-[120px] w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                            />
                            {reasonError ? <p className="mt-2 text-sm text-red-600">{reasonError}</p> : null}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button type="button" onClick={closeModal} className={secondaryButtonClass}>
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={demoteAdminBlocked}
                                onClick={handleConfirmChange}
                                className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-cyan-200"
                            >
                                Xác nhận thay đổi
                            </button>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default PhanQuyenHeThong;
