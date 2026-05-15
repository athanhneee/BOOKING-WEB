import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { registerHostApplication } from "../../../services/hostService";

const DangKyHost = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ contactName: "", contactEmail: "", contactPhone: "", businessAddress: "", entityType: "individual", notes: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            await registerHostApplication({
                contactName: form.contactName || null,
                contactEmail: form.contactEmail || null,
                contactPhone: form.contactPhone,
                businessAddress: form.businessAddress,
                entityType: form.entityType,
                notes: form.notes || null,
            });
            navigate(APP_ROUTES.hostStatus, { replace: true });
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Không thể gửi hồ sơ host.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-[#F7F8FA] px-4 py-12">
            <div className="mx-auto max-w-3xl rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Trở thành Host</p>
                    <h1 className="mt-3 text-3xl font-bold text-gray-900">Đăng ký hồ sơ chủ nhà</h1>
                    <p className="mt-2 text-sm text-gray-500">Form này gửi thật tới backend /api/host/register, không còn lưu mock/local state.</p>
                </div>

                {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <label className="space-y-2"><span className="text-sm font-medium text-gray-700">Người liên hệ</span><input value={form.contactName} onChange={(e) => setField("contactName", e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5" /></label>
                        <label className="space-y-2"><span className="text-sm font-medium text-gray-700">Email liên hệ</span><input type="email" value={form.contactEmail} onChange={(e) => setField("contactEmail", e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5" /></label>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <label className="space-y-2"><span className="text-sm font-medium text-gray-700">Số điện thoại *</span><input required value={form.contactPhone} onChange={(e) => setField("contactPhone", e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5" placeholder="0901234567" /></label>
                        <label className="space-y-2"><span className="text-sm font-medium text-gray-700">Loại hồ sơ</span><select value={form.entityType} onChange={(e) => setField("entityType", e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5"><option value="individual">Cá nhân</option><option value="business">Doanh nghiệp</option></select></label>
                    </div>
                    <label className="space-y-2 block"><span className="text-sm font-medium text-gray-700">Địa chỉ kinh doanh *</span><input required value={form.businessAddress} onChange={(e) => setField("businessAddress", e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5" /></label>
                    <label className="space-y-2 block"><span className="text-sm font-medium text-gray-700">Ghi chú</span><textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} className="min-h-[120px] w-full rounded-xl border border-gray-200 px-3 py-2.5" /></label>
                    <div className="flex justify-end gap-3"><button type="button" onClick={() => navigate(APP_ROUTES.hostLanding)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-gray-700">Hủy</button><button disabled={saving} type="submit" className="rounded-xl bg-cyan-600 px-5 py-2.5 font-medium text-white hover:bg-cyan-700">{saving ? "Đang gửi..." : "Gửi hồ sơ"}</button></div>
                </form>
            </div>
        </div>
    );
};

export default DangKyHost;