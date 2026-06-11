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
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionId, setActionId] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await getAdminUsers({ page: 1, limit: 100, search, status });
            setUsers(result.items ?? []);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Không thể tải người dùng.");
        } finally {
            setLoading(false);
        }
    }, [search, status]);

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

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
                <section className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row">
                    <div className="relative flex-1"><FiSearch className="absolute left-3 top-3 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm email, số điện thoại, tên..." className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3" /></div>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2.5">{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                    <button type="button" onClick={fetchUsers} className={reloadButtonClass}><FiRefreshCw className="shrink-0" />Tải lại</button>
                </section>
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className={`${tableClassName} text-left text-sm`}>
                            <thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Email/Phone</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Hành động</th></tr></thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {loading ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Đang tải...</td></tr> : null}
                                {!loading && users.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Không có user.</td></tr> : null}
                                {users.map((user) => {
                                    const userId = user.userId ?? user.id;
                                    const locked = ["blocked", "suspended", "locked"].includes(user.status);
                                    return <tr key={userId}><td className="px-4 py-4"><p className="font-semibold text-gray-900">{user.fullName || user.name || user.username || `User #${userId}`}</p><p className="mt-1 text-xs text-gray-500">ID: {userId}</p></td><td className="px-4 py-4 text-gray-600"><p>{user.email}</p><p>{user.phone || "-"}</p></td><td className="px-4 py-4 text-gray-600">{(user.roles || [user.role]).filter(Boolean).join(", ")}</td><td className="px-4 py-4"><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-600">{user.status}</span></td><td className="px-4 py-4"><button disabled={actionId === userId} type="button" onClick={() => changeStatus(user, locked ? "active" : "blocked")} className={locked ? "rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white" : "rounded-xl border border-rose-200 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"}>{locked ? "Mở khóa" : "Khóa"}</button></td></tr>;
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
