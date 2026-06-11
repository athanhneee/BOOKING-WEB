import { useCallback, useEffect, useState } from "react";
import { getAdminUsers, updateAdminUser } from "../../../../services/userService";
import { pageWrapperClass, primaryButtonClass, secondaryButtonClass, tableClassName } from "../../Host/sharedStyles";

const roles = ["Guest", "host", "Admin"];

const PhanQuyenHeThong = () => {
    const [users, setUsers] = useState([]);
    const [draftRoles, setDraftRoles] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [savingId, setSavingId] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await getAdminUsers({ page: 1, limit: 100 });
            setUsers(result.items ?? []);
            setDraftRoles(Object.fromEntries((result.items ?? []).map((user) => [user.userId ?? user.id, user.role ?? user.roles?.[0] ?? "Guest"])));
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Không thể tải phân quyền.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchUsers(); }, [fetchUsers]);

    const saveRole = async (user) => {
        const userId = user.userId ?? user.id;
        const role = draftRoles[userId];
        setSavingId(userId);
        setError("");
        try {
            await updateAdminUser(userId, { role });
            await fetchUsers();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Không thể cập nhật role.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className={`${tableClassName} text-left text-sm`}>
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Người dùng</th>
                                    <th className="px-5 py-4 font-semibold">Email</th>
                                    <th className="px-5 py-4 font-semibold text-center">Role hiện tại</th>
                                    <th className="px-5 py-4 font-semibold text-center">Role mới</th>
                                    <th className="px-5 py-4 font-semibold text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                                                <span className="text-sm font-medium text-slate-500">Đang tải phân quyền...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : null}
                                {!loading && users.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Không có user.</td></tr> : null}
                                {users.map((user) => { 
                                    const userId = user.userId ?? user.id; 
                                    const currentRole = user.role ?? user.roles?.[0] ?? "Guest"; 
                                    const draftRole = draftRoles[userId] ?? currentRole; 
                                    const isChanged = draftRole !== currentRole;
                                    return (
                                        <tr key={userId} className="transition-colors hover:bg-slate-50/50">
                                            <td className="px-5 py-4 font-semibold text-slate-900">{user.fullName || user.name || user.username || `User #${userId}`}</td>
                                            <td className="px-5 py-4 text-slate-600">{user.email}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{currentRole}</span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <select 
                                                    value={draftRole} 
                                                    onChange={(event) => setDraftRoles((current) => ({ ...current, [userId]: event.target.value }))} 
                                                    className="min-w-[120px] cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 hover:border-gray-300"
                                                >
                                                    {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    <button 
                                                        type="button" 
                                                        disabled={savingId === userId || !isChanged} 
                                                        onClick={() => saveRole(user)} 
                                                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:pointer-events-none ${
                                                            isChanged ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm" : "bg-slate-100 text-slate-400"
                                                        }`}
                                                    >
                                                        {savingId === userId ? "Đang lưu..." : "Lưu"}
                                                    </button>
                                                    {isChanged && (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setDraftRoles((current) => ({ ...current, [userId]: currentRole }))} 
                                                            className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100"
                                                        >
                                                            Hủy
                                                        </button>
                                                    )}
                                                </div>
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

export default PhanQuyenHeThong;
