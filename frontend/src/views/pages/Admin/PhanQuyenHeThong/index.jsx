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
                    <table className={`${tableClassName} text-left text-sm`}>
                        <thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-3">Người dùng</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role hiện tại</th><th className="px-4 py-3">Role mới</th><th className="px-4 py-3">Hành động</th></tr></thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Đang tải...</td></tr> : null}
                            {!loading && users.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Không có user.</td></tr> : null}
                            {users.map((user) => { const userId = user.userId ?? user.id; const currentRole = user.role ?? user.roles?.[0] ?? "Guest"; const draftRole = draftRoles[userId] ?? currentRole; return <tr key={userId}><td className="px-4 py-4 font-medium text-gray-900">{user.fullName || user.name || user.username || `User #${userId}`}</td><td className="px-4 py-4 text-gray-600">{user.email}</td><td className="px-4 py-4"><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{currentRole}</span></td><td className="px-4 py-4"><select value={draftRole} onChange={(event) => setDraftRoles((current) => ({ ...current, [userId]: event.target.value }))} className="rounded-xl border border-gray-200 px-3 py-2.5">{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></td><td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button type="button" disabled={savingId === userId || draftRole === currentRole} onClick={() => saveRole(user)} className={primaryButtonClass}>Lưu</button><button type="button" onClick={() => setDraftRoles((current) => ({ ...current, [userId]: currentRole }))} className={secondaryButtonClass}>Đặt lại</button></div></td></tr>; })}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
};

export default PhanQuyenHeThong;
