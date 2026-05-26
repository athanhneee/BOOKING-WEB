import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import {
    getMyHostApplication,
    submitHostApplication,
} from "../../../services/api/hostApplicationService";

const allowedFileTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const maxFileSize = 5 * 1024 * 1024;

const documentOptions = [
    { value: "cccd", label: "Căn cước công dân" },
    { value: "cmnd", label: "Chứng minh nhân dân" },
    { value: "passport", label: "Hộ chiếu" },
    { value: "driver_license", label: "Giấy phép lái xe" },
];

const statusText = {
    pending: "Hồ sơ đang chờ admin xét duyệt",
    approved: "Hồ sơ đã được duyệt",
    rejected: "Hồ sơ bị từ chối",
};

const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getErrorMessage = (error, fallback) => {
    if (error?.errors?.length) {
        return error.errors.map((item) => item.msg).join("; ");
    }

    return error instanceof Error ? error.message : fallback;
};

const FilePicker = ({ id, label, file, required, onChange, onRemove }) => (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
            <label htmlFor={id} className="text-sm font-semibold text-gray-800">
                {label} {required ? <span className="text-rose-600">*</span> : null}
            </label>
            {file ? (
                <button type="button" onClick={onRemove} className="text-sm font-medium text-rose-600 hover:text-rose-700">
                    Xóa file
                </button>
            ) : null}
        </div>
        <input
            id={id}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-4 file:py-2 file:font-medium file:text-cyan-700 hover:file:bg-cyan-100"
        />
        {file ? (
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p>{formatFileSize(file.size)}</p>
            </div>
        ) : (
            <p className="text-xs text-gray-500">Chấp nhận JPG, PNG, WebP hoặc PDF, tối đa 5MB.</p>
        )}
    </div>
);

const DangKyHost = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        contactName: "",
        contactEmail: "",
        phone: "",
        businessAddress: "",
        profileType: "individual",
        note: "",
        documentType: "cccd",
    });
    const [files, setFiles] = useState({
        identityFront: null,
        identityBack: null,
        identitySingle: null,
        businessLicense: null,
    });
    const [currentApplication, setCurrentApplication] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const status = currentApplication?.status ?? currentApplication?.hostApplicationStatus ?? null;

    const visibleFileFields = useMemo(() => {
        const fields = [];

        if (form.documentType === "passport") {
            fields.push({ key: "identitySingle", label: "Ảnh hộ chiếu", required: true });
        } else {
            fields.push({
                key: "identityFront",
                label: form.documentType === "driver_license" ? "Mặt trước giấy phép lái xe" : "Ảnh mặt trước",
                required: true,
            });
            fields.push({
                key: "identityBack",
                label: form.documentType === "driver_license" ? "Mặt sau giấy phép lái xe" : "Ảnh mặt sau",
                required: form.documentType !== "driver_license",
            });
        }

        if (form.profileType === "business") {
            fields.push({ key: "businessLicense", label: "Giấy phép kinh doanh", required: true });
        }

        return fields;
    }, [form.documentType, form.profileType]);

    useEffect(() => {
        let cancelled = false;

        const loadApplication = async () => {
            setLoadingStatus(true);
            setError("");

            try {
                const result = await getMyHostApplication();
                if (!cancelled) {
                    setCurrentApplication(
                        result.application ?? {
                            status: result.status,
                            hostApplicationStatus: result.hostApplicationStatus,
                        },
                    );
                }
            } catch (fetchError) {
                if (!cancelled) {
                    setError(getErrorMessage(fetchError, "Không thể tải trạng thái hồ sơ host."));
                }
            } finally {
                if (!cancelled) {
                    setLoadingStatus(false);
                }
            }
        };

        void loadApplication();

        return () => {
            cancelled = true;
        };
    }, []);

    const setField = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
        setSuccess("");
        setError("");

        if (key === "documentType") {
            setFiles((current) => ({
                ...current,
                identityFront: null,
                identityBack: null,
                identitySingle: null,
            }));
        }

        if (key === "profileType" && value !== "business") {
            setFiles((current) => ({ ...current, businessLicense: null }));
        }
    };

    const setFile = (key, file) => {
        setFiles((current) => ({ ...current, [key]: file }));
        setSuccess("");
        setError("");
    };

    const validateFiles = () => {
        const requiredFields = visibleFileFields.filter((field) => field.required);
        const missingField = requiredFields.find((field) => !files[field.key]);

        if (missingField) {
            return `${missingField.label} là bắt buộc.`;
        }

        const selectedFiles = Object.values(files).filter(Boolean);
        const invalidType = selectedFiles.find((file) => !allowedFileTypes.includes(file.type));

        if (invalidType) {
            return `${invalidType.name} không đúng định dạng. Chỉ nhận JPG, PNG, WebP hoặc PDF.`;
        }

        const tooLarge = selectedFiles.find((file) => file.size > maxFileSize);

        if (tooLarge) {
            return `${tooLarge.name} vượt quá 5MB.`;
        }

        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        const fileError = validateFiles();
        if (fileError) {
            setError(fileError);
            setSaving(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("contactName", form.contactName);
            formData.append("contactEmail", form.contactEmail);
            formData.append("phone", form.phone);
            formData.append("profileType", form.profileType);
            formData.append("businessAddress", form.businessAddress);
            formData.append("note", form.note);
            formData.append("documentType", form.documentType);

            Object.entries(files).forEach(([key, file]) => {
                if (file) {
                    formData.append(key, file);
                }
            });

            const result = await submitHostApplication(formData);
            setSuccess("Đã gửi hồ sơ, vui lòng chờ admin xét duyệt.");
            setCurrentApplication({
                applicationId: result.applicationId ?? result.id,
                status: result.status,
                hostApplicationStatus: result.status,
            });
        } catch (submitError) {
            setError(getErrorMessage(submitError, "Không thể gửi hồ sơ host."));
        } finally {
            setSaving(false);
        }
    };

    const canShowForm = !loadingStatus && status !== "pending" && status !== "approved";

    return (
        <div className="bg-[#F7F8FA] px-4 py-12">
            <div className="mx-auto max-w-3xl rounded-lg border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Trở thành host</p>
                    <h1 className="mt-3 text-3xl font-bold text-gray-900">Đăng ký hồ sơ chủ nhà</h1>
                </div>

                {loadingStatus ? (
                    <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                        Đang tải trạng thái hồ sơ...
                    </div>
                ) : null}

                {error ? (
                    <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {error}
                    </div>
                ) : null}

                {success ? (
                    <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {success}
                    </div>
                ) : null}

                {!loadingStatus && status === "pending" ? (
                    <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-800">
                        <p className="font-semibold">{statusText.pending}</p>
                        <p className="mt-2 text-sm">Bạn không thể gửi thêm hồ sơ pending cùng lúc.</p>
                        <button
                            type="button"
                            onClick={() => navigate(APP_ROUTES.hostStatus)}
                            className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                        >
                            Xem trạng thái
                        </button>
                    </div>
                ) : null}

                {!loadingStatus && status === "approved" ? (
                    <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                        <p className="font-semibold">{statusText.approved}</p>
                        <button
                            type="button"
                            onClick={() => navigate(APP_ROUTES.ownerDashboard)}
                            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                            Quản lý host
                        </button>
                    </div>
                ) : null}

                {!loadingStatus && status === "rejected" ? (
                    <div className="mt-8 rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800">
                        <p className="font-semibold">{statusText.rejected}</p>
                        <p className="mt-2 text-sm">
                            Lý do: {currentApplication?.rejectReason ?? currentApplication?.rejectionReason ?? "Chưa có lý do."}
                        </p>
                        <p className="mt-2 text-sm">Bạn có thể gửi lại hồ sơ mới với giấy tờ rõ ràng hơn.</p>
                    </div>
                ) : null}

                {canShowForm ? (
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-700">Người liên hệ</span>
                                <input
                                    value={form.contactName}
                                    onChange={(event) => setField("contactName", event.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-700">Email liên hệ</span>
                                <input
                                    type="email"
                                    value={form.contactEmail}
                                    onChange={(event) => setField("contactEmail", event.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5"
                                />
                            </label>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-700">Số điện thoại *</span>
                                <input
                                    required
                                    value={form.phone}
                                    onChange={(event) => setField("phone", event.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5"
                                    placeholder="0901234567"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-700">Loại hồ sơ</span>
                                <select
                                    value={form.profileType}
                                    onChange={(event) => setField("profileType", event.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5"
                                >
                                    <option value="individual">Cá nhân</option>
                                    <option value="business">Tổ chức / doanh nghiệp</option>
                                </select>
                            </label>
                        </div>

                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-gray-700">Địa chỉ kinh doanh *</span>
                            <input
                                required
                                value={form.businessAddress}
                                onChange={(event) => setField("businessAddress", event.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5"
                            />
                        </label>

                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-gray-700">Ghi chú</span>
                            <textarea
                                value={form.note}
                                onChange={(event) => setField("note", event.target.value)}
                                className="min-h-[120px] w-full rounded-lg border border-gray-200 px-3 py-2.5"
                            />
                        </label>

                        <section className="space-y-4 rounded-lg border border-cyan-100 bg-cyan-50/40 p-5">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Giấy tờ xác minh</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Ảnh giấy tờ chỉ dùng để xét duyệt hồ sơ chủ nhà và được lưu riêng tư.
                                </p>
                            </div>

                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-gray-700">Loại giấy tờ</span>
                                <select
                                    value={form.documentType}
                                    onChange={(event) => setField("documentType", event.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5"
                                >
                                    {documentOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="grid gap-4 md:grid-cols-2">
                                {visibleFileFields.map((field) => (
                                    <FilePicker
                                        key={field.key}
                                        id={field.key}
                                        label={field.label}
                                        required={field.required}
                                        file={files[field.key]}
                                        onChange={(file) => setFile(field.key, file)}
                                        onRemove={() => setFile(field.key, null)}
                                    />
                                ))}
                            </div>
                        </section>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(APP_ROUTES.hostLanding)}
                                className="rounded-lg border border-gray-200 px-4 py-2.5 text-gray-700"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={saving}
                                type="submit"
                                className="rounded-lg bg-cyan-500 px-5 py-2.5 font-medium text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? "Đang gửi hồ sơ..." : "Gửi hồ sơ"}
                            </button>
                        </div>
                    </form>
                ) : null}
            </div>
        </div>
    );
};

export default DangKyHost;
