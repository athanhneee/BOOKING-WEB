import { useCallback, useEffect, useState } from "react";
import { FiRefreshCw, FiSearch } from "react-icons/fi";
import { getAdminUsers, updateAdminUserStatus } from "../../../../services/userService";
import { pageWrapperClass, reloadButtonClass, tableClassName } from "../../Host/sharedStyles";

const statusOptions = [
    { label: "Tất cả", value: "all" },
    { label: "Active", value: "active" },
    { label: "Blocked", value: "blocked" },
    { label: "Suspended", value: "suspended" },
    { label: "Locked", value: "locked" },
];

const QuanLyNguoiDung = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionId, setActionId] = useState(null);

    // Chỉ gọi API sau khi người dùng ngừng gõ 350ms, tránh spam request mỗi ký tự.
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await getAdminUsers({ page: 1, limit: 100, search: debouncedSearch, status });
            setUsers(result.items ?? []);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Không thể tải người dùng.");
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, status]);

    useEffect(() => { void fetchUsers(); }, [fetchUsers]);

    const changeStatus = async (user, nextStatus) => {
        setActionId(user.id ?? user.userId);
        setError("");
        try {
            await updateAdminUserStatus(user.userId ?? user.id, nextStatus);
            await fetchUsers();
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : "Không thể cập nhật trạng thái user.");
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
                    <p className="mt-1 text-sm text-gray-500">Tìm kiếm, khóa hoặc mở khóa tài khoản người dùng.</p>
                </div>

                {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
                <section className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row">
                    <div className="relative flex-1"><FiSearch className="absolute left-3 top-3 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm email, số điện thoại, tên..." className="w-full rounded-3xl border border-gray-200 py-2.5 pl-10 pr-3" /></div>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-3xl border border-gray-200 px-3 py-2.5">{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                    <button type="button" onClick={fetchUsers} className={reloadButtonClass}><FiRefreshCw className="shrink-0" />Tải lại</button>
                </section>
                <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className={`${tableClassName} text-left text-sm`}>
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">User</th>
                                    <th className="px-5 py-4 font-semibold">Email/Phone</th>
                                    <th className="px-5 py-4 font-semibold">Role</th>
                                    <th className="px-5 py-4 font-semibold">Trạng thái</th>
                                    <th className="px-5 py-4 font-semibold text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                                                <span className="text-sm font-medium text-slate-500">Đang tải người dùng...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : null}
                                {!loading && users.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Không có user.</td></tr> : null}
                                {users.map((user) => {
                                    const userId = user.userId ?? user.id;
                                    const locked = ["blocked", "suspended", "locked"].includes(user.status);
                                    return (
                                        <tr key={userId} className="transition-colors hover:bg-slate-50/50">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900">{user.fullName || user.name || user.username || `User #${userId}`}</p>
                                                <p className="mt-1 text-xs font-medium text-slate-500">ID: {userId}</p>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                <p>{user.email}</p>
                                                <p className="mt-0.5 text-xs text-slate-400">{user.phone || "-"}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="rounded-3xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                    {(user.roles || [user.role]).filter(Boolean).join(", ")}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${locked ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                                                    }`}>
                                                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${locked ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    disabled={actionId === userId}
                                                    type="button"
                                                    onClick={() => changeStatus(user, locked ? "active" : "blocked")}
                                                    className={`rounded-3xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 ${locked
                                                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                        : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                        }`}
                                                >
                                                    {locked ? "Mở khóa" : "Khóa"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default QuanLyNguoiDung;
