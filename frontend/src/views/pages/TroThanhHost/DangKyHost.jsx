import { useMemo, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { Navigate, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { adminUsers, hostApplications } from "../../../data/mockData";
import { getCurrentUser } from "../../../store/authStore";

const bankOptions = ["MB Bank", "Vietcombank", "Techcombank", "BIDV", "Agribank", "VPBank", "TPBank"];
const today = new Date().toISOString().slice(0, 10);

const getLatestApplicationForUser = (userId) =>
    hostApplications
        .filter((application) => application.userId === userId)
        .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0] ?? null;

const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const normalizeComparable = (value = "") =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

const UploadCard = ({ title, value, onChange, multipleLabel = "Chọn ảnh" }) => (
    <label className="relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-colors hover:border-cyan-400 hover:bg-cyan-50">
        {value ? (
            <>
                <img src={value} alt={title} className="mx-auto max-h-40 w-full rounded-xl object-contain" />
                <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-sm text-white">
                    ✓
                </span>
                <p className="mt-3 text-xs font-medium text-cyan-600">Thay đổi</p>
            </>
        ) : (
            <>
                <div className="text-4xl text-gray-400">📷</div>
                <p className="mt-2 text-sm font-medium text-gray-600">{title}</p>
                <p className="mt-1 text-xs text-gray-400">JPG, PNG — tối đa 5MB</p>
                <span className="mt-3 inline-flex rounded-xl border border-gray-300 px-4 py-1.5 text-sm text-gray-600">
                    {multipleLabel}
                </span>
            </>
        )}

        <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
    </label>
);

const StepCircle = ({ done, active, value }) => (
    <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
            done
                ? "bg-teal-600 text-white"
                : active
                  ? "bg-cyan-500 text-white ring-4 ring-cyan-100"
                  : "bg-gray-200 text-gray-400"
        }`}
    >
        {done ? <FiCheck /> : value}
    </div>
);

const DangKyHost = () => {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return <Navigate to={APP_ROUTES.login} replace />;
    }

    const accountUser = adminUsers.find((user) => user.id === currentUser.id || user.email === currentUser.email);
    const latestApplication = getLatestApplicationForUser(currentUser.id);
    const rejectedApplication = latestApplication?.status === "rejected" ? latestApplication : null;

    if (latestApplication && latestApplication.status !== "rejected") {
        return <Navigate to={APP_ROUTES.hostStatus} replace />;
    }

    const [step, setStep] = useState(1);
    const [hostInfo, setHostInfo] = useState(() => ({
        displayName: rejectedApplication?.hostInfo?.displayName ?? "",
        bio: rejectedApplication?.hostInfo?.bio ?? "",
        address: rejectedApplication?.hostInfo?.address ?? "",
        bankName: rejectedApplication?.hostInfo?.bankName ?? "",
        bankAccount: rejectedApplication?.hostInfo?.bankAccount ?? "",
        bankHolder: rejectedApplication?.hostInfo?.bankHolder ?? "",
        bankBranch: rejectedApplication?.hostInfo?.bankBranch ?? "",
    }));
    const [docInfo, setDocInfo] = useState(() => ({
        type: rejectedApplication?.documents?.type === "bizlicense" ? "bizlicense" : "cccd",
        frontImage: rejectedApplication?.documents?.frontImage ?? null,
        backImage: rejectedApplication?.documents?.backImage ?? null,
        fullName: rejectedApplication?.documents?.fullName ?? currentUser.name,
        docNumber: rejectedApplication?.documents?.docNumber ?? "",
        birthDate: rejectedApplication?.documents?.birthDate ?? "",
        expiryDate: rejectedApplication?.documents?.expiryDate ?? "",
        docAddress: rejectedApplication?.documents?.address ?? "",
        bizName: rejectedApplication?.documents?.bizName ?? "",
        taxCode: rejectedApplication?.documents?.taxCode ?? "",
        issueDate: rejectedApplication?.documents?.issueDate ?? "",
        issuedBy: rejectedApplication?.documents?.issuedBy ?? "",
        bizAddress: rejectedApplication?.documents?.bizAddress ?? "",
        bizImage: rejectedApplication?.documents?.bizImage ?? null,
    }));
    const [termsChecked, setTermsChecked] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [stepOneErrors, setStepOneErrors] = useState({});
    const [stepTwoErrors, setStepTwoErrors] = useState({});

    const accountName = accountUser?.name ?? currentUser.name;
    const isDocExpired = docInfo.type === "cccd" && Boolean(docInfo.expiryDate) && docInfo.expiryDate < today;
    const isNameMismatch =
        docInfo.type === "cccd" &&
        Boolean(docInfo.fullName) &&
        normalizeComparable(docInfo.fullName) !== normalizeComparable(accountName);

    const requirements = useMemo(
        () => [
            {
                label: "Ảnh rõ nét, đủ 4 góc của giấy tờ",
                met: docInfo.type === "cccd" ? Boolean(docInfo.frontImage && docInfo.backImage) : Boolean(docInfo.bizImage),
            },
            {
                label: "Không bị che khuất, không bị lóa sáng",
                met: docInfo.type === "cccd" ? Boolean(docInfo.frontImage && docInfo.backImage) : Boolean(docInfo.bizImage),
            },
            {
                label: "Thông tin đọc được rõ ràng",
                met:
                    docInfo.type === "cccd"
                        ? Boolean(docInfo.fullName && docInfo.docNumber && docInfo.birthDate && docInfo.docAddress)
                        : Boolean(docInfo.bizName && docInfo.taxCode && docInfo.issuedBy && docInfo.bizAddress),
            },
            {
                label: "Giấy tờ còn trong thời hạn sử dụng",
                met: docInfo.type === "cccd" ? !isDocExpired && Boolean(docInfo.expiryDate) : true,
            },
            {
                label: "Thông tin khớp với tài khoản đã đăng ký",
                met: docInfo.type === "bizlicense" ? true : !isNameMismatch,
            },
        ],
        [docInfo, isDocExpired, isNameMismatch],
    );

    const updateHostField = (field, value) => {
        setHostInfo((current) => ({ ...current, [field]: value }));
        setStepOneErrors((current) => ({ ...current, [field]: "" }));
    };

    const updateDocField = (field, value) => {
        setDocInfo((current) => ({ ...current, [field]: value }));
        setStepTwoErrors((current) => ({ ...current, [field]: "" }));
    };

    const handleImageUpload = async (field, file) => {
        if (!file) {
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setStepTwoErrors((current) => ({ ...current, [field]: "Ảnh phải nhỏ hơn 5MB." }));
            return;
        }

        const preview = await readFileAsDataUrl(file);
        updateDocField(field, preview);
    };

    const validateStepOne = () => {
        const nextErrors = {};
        if (!hostInfo.displayName.trim() || hostInfo.displayName.trim().length < 3) nextErrors.displayName = "Tên hiển thị cần tối thiểu 3 ký tự.";
        if (!hostInfo.address.trim()) nextErrors.address = "Vui lòng nhập địa chỉ hoạt động.";
        if (!hostInfo.bankName) nextErrors.bankName = "Vui lòng chọn ngân hàng.";
        if (!/^\d+$/.test(hostInfo.bankAccount) || hostInfo.bankAccount.length < 8) nextErrors.bankAccount = "Số tài khoản phải là chữ số và có ít nhất 8 ký tự.";
        if (!hostInfo.bankHolder.trim() || hostInfo.bankHolder.trim().length < 5) nextErrors.bankHolder = "Tên chủ tài khoản cần tối thiểu 5 ký tự.";
        setStepOneErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateStepTwo = () => {
        const nextErrors = {};

        if (docInfo.type === "cccd") {
            if (!docInfo.frontImage) nextErrors.frontImage = "Vui lòng tải ảnh mặt trước.";
            if (!docInfo.backImage) nextErrors.backImage = "Vui lòng tải ảnh mặt sau.";
            if (!docInfo.fullName.trim()) nextErrors.fullName = "Vui lòng nhập họ và tên.";
            if (!docInfo.docNumber.trim()) nextErrors.docNumber = "Vui lòng nhập số CCCD.";
            if (!docInfo.birthDate) nextErrors.birthDate = "Vui lòng chọn ngày sinh.";
            if (!docInfo.expiryDate) nextErrors.expiryDate = "Vui lòng chọn ngày hết hạn.";
            if (!docInfo.docAddress.trim()) nextErrors.docAddress = "Vui lòng nhập địa chỉ thường trú.";
            if (isDocExpired) nextErrors.expiryDate = "⚠️ Giấy tờ đã hết hạn";
        } else {
            if (!docInfo.bizImage) nextErrors.bizImage = "Vui lòng tải giấy phép kinh doanh.";
            if (!docInfo.bizName.trim()) nextErrors.bizName = "Vui lòng nhập tên doanh nghiệp.";
            if (!docInfo.taxCode.trim()) nextErrors.taxCode = "Vui lòng nhập mã số thuế.";
            if (!docInfo.issueDate) nextErrors.issueDate = "Vui lòng chọn ngày cấp.";
            if (!docInfo.issuedBy.trim()) nextErrors.issuedBy = "Vui lòng nhập cơ quan cấp.";
            if (!docInfo.bizAddress.trim()) nextErrors.bizAddress = "Vui lòng nhập địa chỉ doanh nghiệp.";
        }

        setStepTwoErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!termsChecked || submitting) return;

        setSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        hostApplications.push({
            id: `app${Date.now()}`,
            userId: currentUser.id,
            userName: accountName,
            email: accountUser?.email ?? currentUser.email,
            phone: accountUser?.phone ?? "",
            status: "pending",
            submittedAt: new Date().toISOString().slice(0, 10),
            reviewedAt: null,
            reviewedBy: null,
            rejectReason: null,
            documents: {
                type: docInfo.type,
                frontImage: docInfo.type === "cccd" ? docInfo.frontImage : docInfo.bizImage,
                backImage: docInfo.type === "cccd" ? docInfo.backImage : null,
                fullName: docInfo.type === "cccd" ? docInfo.fullName : accountName,
                docNumber: docInfo.type === "cccd" ? docInfo.docNumber : docInfo.taxCode,
                birthDate: docInfo.type === "cccd" ? docInfo.birthDate : "",
                address: docInfo.type === "cccd" ? docInfo.docAddress : docInfo.bizAddress,
                expiryDate: docInfo.type === "cccd" ? docInfo.expiryDate : "",
                isExpired: docInfo.type === "cccd" ? isDocExpired : false,
                infoMatch: docInfo.type === "cccd" ? !isNameMismatch : true,
                bizName: docInfo.bizName,
                taxCode: docInfo.taxCode,
                issueDate: docInfo.issueDate,
                issuedBy: docInfo.issuedBy,
                bizAddress: docInfo.bizAddress,
                bizImage: docInfo.bizImage,
            },
            hostInfo: { ...hostInfo },
        });

        setSubmitting(false);
        navigate(APP_ROUTES.hostStatus);
    };

    return (
        <div className="min-h-screen bg-[#F7F8FA] pt-14 md:pt-20">
            <div className="sticky top-14 z-40 border-b border-gray-100 bg-white md:top-20">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
                    <button
                        type="button"
                        onClick={() => (step > 1 ? setStep((current) => current - 1) : navigate(APP_ROUTES.hostLanding))}
                        className="text-sm text-gray-500 transition-colors hover:text-teal-700"
                    >
                        ← Quay lại
                    </button>

                    <div className="hidden items-start gap-3 md:flex">
                        {[{ number: 1, label: "Thông tin cá nhân" }, { number: 2, label: "Xác minh danh tính" }, { number: 3, label: "Xem lại & Gửi" }].map((item, index) => (
                            <div key={item.number} className="flex items-start">
                                <div className="flex flex-col items-center">
                                    <StepCircle done={step > item.number} active={step === item.number} value={item.number} />
                                    <span className="mt-1 w-20 text-center text-xs text-gray-500">{item.label}</span>
                                </div>
                                {index < 2 ? <div className={`mt-4 h-0.5 w-12 ${step > item.number ? "bg-teal-500" : "bg-gray-200"}`} /> : null}
                            </div>
                        ))}
                    </div>

                    <span className="text-sm text-gray-500">Bước {step}/3</span>
                </div>
            </div>

            <div className="mx-auto max-w-4xl p-6 text-gray-900">
                {step === 1 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <article className="rounded-2xl border border-gray-100 bg-white p-6">
                            <h2 className="mb-4 text-base font-semibold text-gray-900">Thông tin hiển thị cho khách</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Tên hiển thị *</label>
                                    <input
                                        value={hostInfo.displayName}
                                        onChange={(event) => updateHostField("displayName", event.target.value)}
                                        placeholder="Ví dụ: Villa Nhà Tôi, Homestay Bảo Ngọc"
                                        className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 ${
                                            stepOneErrors.displayName ? "border-red-300" : "border-gray-200"
                                        }`}
                                    />
                                    <p className="mt-1 text-xs text-gray-400">Tên này hiển thị trên trang cá nhân host của bạn</p>
                                    {stepOneErrors.displayName ? <p className="mt-1 text-xs text-red-500">{stepOneErrors.displayName}</p> : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Giới thiệu bản thân</label>
                                    <textarea
                                        rows={4}
                                        maxLength={300}
                                        value={hostInfo.bio}
                                        onChange={(event) => updateHostField("bio", event.target.value)}
                                        placeholder="Tôi có... tại Vũng Tàu, yêu thích..."
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                                    />
                                    <p className="mt-1 text-right text-xs text-gray-400">{hostInfo.bio.length}/300</p>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Địa chỉ hoạt động *</label>
                                    <input
                                        value={hostInfo.address}
                                        onChange={(event) => updateHostField("address", event.target.value)}
                                        placeholder="Phường/Xã, Vũng Tàu"
                                        className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 ${
                                            stepOneErrors.address ? "border-red-300" : "border-gray-200"
                                        }`}
                                    />
                                    {stepOneErrors.address ? <p className="mt-1 text-xs text-red-500">{stepOneErrors.address}</p> : null}
                                </div>
                            </div>
                        </article>

                        <article className="rounded-2xl border border-gray-100 bg-white p-6">
                            <h2 className="mb-4 text-base font-semibold text-gray-900">Tài khoản nhận thanh toán</h2>

                            <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-700">
                                🔒 Thông tin ngân hàng được mã hóa và chỉ dùng để chuyển khoản doanh thu cho bạn.
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Ngân hàng *</label>
                                    <select
                                        value={hostInfo.bankName}
                                        onChange={(event) => updateHostField("bankName", event.target.value)}
                                        className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 ${
                                            stepOneErrors.bankName ? "border-red-300" : "border-gray-200"
                                        }`}
                                    >
                                        <option value="">-- Chọn ngân hàng --</option>
                                        {bankOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    {stepOneErrors.bankName ? <p className="mt-1 text-xs text-red-500">{stepOneErrors.bankName}</p> : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Số tài khoản *</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={hostInfo.bankAccount}
                                        onChange={(event) => updateHostField("bankAccount", event.target.value.replace(/\D/g, ""))}
                                        placeholder="Nhập số tài khoản"
                                        className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 ${
                                            stepOneErrors.bankAccount ? "border-red-300" : "border-gray-200"
                                        }`}
                                    />
                                    {stepOneErrors.bankAccount ? <p className="mt-1 text-xs text-red-500">{stepOneErrors.bankAccount}</p> : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Tên chủ tài khoản *</label>
                                    <input
                                        value={hostInfo.bankHolder}
                                        onChange={(event) => updateHostField("bankHolder", event.target.value.toUpperCase())}
                                        placeholder="NGUYEN VAN A"
                                        className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 ${
                                            stepOneErrors.bankHolder ? "border-red-300" : "border-gray-200"
                                        }`}
                                    />
                                    <p className="mt-1 text-xs text-gray-400">Nhập đúng tên trên thẻ ngân hàng (IN HOA, không dấu)</p>
                                    {stepOneErrors.bankHolder ? <p className="mt-1 text-xs text-red-500">{stepOneErrors.bankHolder}</p> : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Chi nhánh</label>
                                    <input
                                        value={hostInfo.bankBranch}
                                        onChange={(event) => updateHostField("bankBranch", event.target.value)}
                                        placeholder="Không bắt buộc"
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                                    />
                                </div>
                            </div>
                        </article>

                        <div className="md:col-span-2">
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (validateStepOne()) {
                                            setStep(2);
                                        }
                                    }}
                                    className="rounded-xl bg-cyan-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600"
                                >
                                    Tiếp theo →
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
                {step === 2 ? (
                    <div className="mx-auto max-w-3xl">
                        {rejectedApplication ? (
                            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                                <p className="font-semibold text-red-700">❌ Yêu cầu trước bị từ chối</p>
                                <p className="mt-1 text-sm italic text-red-600">{rejectedApplication.rejectReason}</p>
                                <p className="mt-2 text-sm text-red-700">Vui lòng tải lại tài liệu mới đáp ứng yêu cầu.</p>
                            </div>
                        ) : null}

                        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
                                { key: "cccd", icon: "🪪", title: "CCCD / CMND", description: "Căn cước công dân hoặc CMND còn hạn" },
                                { key: "bizlicense", icon: "🏢", title: "Giấy phép kinh doanh", description: "Dành cho hộ kinh doanh hoặc doanh nghiệp" },
                            ].map((option) => {
                                const isActive = docInfo.type === option.key;
                                return (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => {
                                            setDocInfo((current) => ({ ...current, type: option.key }));
                                            setStepTwoErrors({});
                                        }}
                                        className={`rounded-2xl border-2 p-4 text-left transition-colors ${isActive ? "border-cyan-500 bg-cyan-50" : "border-gray-200 bg-white hover:border-cyan-300"}`}
                                    >
                                        <div className="text-3xl">{option.icon}</div>
                                        <p className="mt-3 font-semibold text-gray-900">{option.title}</p>
                                        <p className="mt-1 text-xs text-gray-500">{option.description}</p>
                                    </button>
                                );
                            })}
                        </div>

                        {docInfo.type === "cccd" ? (
                            <>
                                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <UploadCard title="Ảnh mặt trước CCCD" value={docInfo.frontImage} onChange={(file) => handleImageUpload("frontImage", file)} />
                                        {stepTwoErrors.frontImage ? <p className="mt-2 text-xs text-red-500">{stepTwoErrors.frontImage}</p> : null}
                                    </div>
                                    <div>
                                        <UploadCard title="Ảnh mặt sau CCCD" value={docInfo.backImage} onChange={(file) => handleImageUpload("backImage", file)} />
                                        {stepTwoErrors.backImage ? <p className="mt-2 text-xs text-red-500">{stepTwoErrors.backImage}</p> : null}
                                    </div>
                                </div>

                                <article className="mb-6 rounded-2xl border border-gray-100 bg-white p-6">
                                    <h2 className="text-base font-semibold text-gray-900">Thông tin trên giấy tờ</h2>
                                    <p className="mb-4 mt-1 text-xs text-gray-400">Nhập đúng như trên CCCD để hệ thống đối chiếu</p>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Họ và tên</label>
                                            <input value={docInfo.fullName} onChange={(event) => updateDocField("fullName", event.target.value)} className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 ${stepTwoErrors.fullName ? "border-red-300" : "border-gray-200"}`} />
                                            {stepTwoErrors.fullName ? <p className="mt-1 text-xs text-red-500">{stepTwoErrors.fullName}</p> : null}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Số CCCD</label>
                                            <input maxLength={12} value={docInfo.docNumber} onChange={(event) => updateDocField("docNumber", event.target.value.replace(/\D/g, ""))} className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 ${stepTwoErrors.docNumber ? "border-red-300" : "border-gray-200"}`} />
                                            {stepTwoErrors.docNumber ? <p className="mt-1 text-xs text-red-500">{stepTwoErrors.docNumber}</p> : null}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Ngày sinh</label>
                                            <input type="date" value={docInfo.birthDate} onChange={(event) => updateDocField("birthDate", event.target.value)} className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 ${stepTwoErrors.birthDate ? "border-red-300" : "border-gray-200"}`} />
                                            {stepTwoErrors.birthDate ? <p className="mt-1 text-xs text-red-500">{stepTwoErrors.birthDate}</p> : null}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Ngày hết hạn</label>
                                            <input type="date" value={docInfo.expiryDate} onChange={(event) => updateDocField("expiryDate", event.target.value)} className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 ${stepTwoErrors.expiryDate ? "border-red-300" : "border-gray-200"}`} />
                                            {stepTwoErrors.expiryDate ? <p className="mt-1 text-xs text-red-500">{stepTwoErrors.expiryDate}</p> : null}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Địa chỉ thường trú</label>
                                            <input value={docInfo.docAddress} onChange={(event) => updateDocField("docAddress", event.target.value)} className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 ${stepTwoErrors.docAddress ? "border-red-300" : "border-gray-200"}`} />
                                            {stepTwoErrors.docAddress ? <p className="mt-1 text-xs text-red-500">{stepTwoErrors.docAddress}</p> : null}
                                        </div>
                                    </div>

                                    {isNameMismatch ? (
                                        <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                                            ⚠️ Tên trên giấy tờ không khớp với tên tài khoản. Admin sẽ xem xét và liên hệ nếu cần.
                                        </div>
                                    ) : null}
                                </article>
                            </>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <UploadCard title="Tải giấy phép kinh doanh" value={docInfo.bizImage} onChange={(file) => handleImageUpload("bizImage", file)} multipleLabel="Chọn tệp" />
                                    {stepTwoErrors.bizImage ? <p className="mt-2 text-xs text-red-500">{stepTwoErrors.bizImage}</p> : null}
                                </div>

                                <article className="mb-6 rounded-2xl border border-gray-100 bg-white p-6">
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Thông tin doanh nghiệp</h2>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {[
                                            { key: "bizName", label: "Tên doanh nghiệp" },
                                            { key: "taxCode", label: "Mã số thuế" },
                                            { key: "issueDate", label: "Ngày cấp", type: "date" },
                                            { key: "issuedBy", label: "Cơ quan cấp" },
                                        ].map((field) => (
                                            <div key={field.key}>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">{field.label}</label>
                                                <input type={field.type ?? "text"} value={docInfo[field.key]} onChange={(event) => updateDocField(field.key, event.target.value)} className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 ${stepTwoErrors[field.key] ? "border-red-300" : "border-gray-200"}`} />
                                                {stepTwoErrors[field.key] ? <p className="mt-1 text-xs text-red-500">{stepTwoErrors[field.key]}</p> : null}
                                            </div>
                                        ))}

                                        <div className="md:col-span-2">
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Địa chỉ</label>
                                            <input value={docInfo.bizAddress} onChange={(event) => updateDocField("bizAddress", event.target.value)} className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 ${stepTwoErrors.bizAddress ? "border-red-300" : "border-gray-200"}`} />
                                            {stepTwoErrors.bizAddress ? <p className="mt-1 text-xs text-red-500">{stepTwoErrors.bizAddress}</p> : null}
                                        </div>
                                    </div>
                                </article>
                            </>
                        )}

                        <article className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <h2 className="mb-3 text-sm font-semibold text-gray-900">Yêu cầu về ảnh giấy tờ</h2>
                            {requirements.map((item) => (
                                <div key={item.label} className="flex items-center gap-2 py-1 text-sm text-gray-700">
                                    <span className={item.met ? "text-teal-600" : "text-gray-400"}>{item.met ? "✅" : "○"}</span>
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </article>

                        <div className="mt-6 flex justify-between">
                            <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-gray-200 px-6 py-2.5 text-gray-700 transition-colors hover:bg-gray-50">
                                ← Quay lại
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (validateStepTwo()) {
                                        setStep(3);
                                    }
                                }}
                                className="rounded-xl bg-cyan-500 px-6 py-2.5 text-white transition-colors hover:bg-cyan-600"
                            >
                                Tiếp theo →
                            </button>
                        </div>
                    </div>
                ) : null}
                {step === 3 ? (
                    <div className="mx-auto max-w-3xl">
                        <h1 className="mb-6 text-xl font-bold text-gray-900">Kiểm tra lại thông tin trước khi gửi</h1>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <article className="rounded-2xl border border-gray-100 bg-white p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-gray-900">Thông tin Host</h2>
                                    <button type="button" onClick={() => setStep(1)} className="text-sm text-cyan-600">
                                        Chỉnh sửa
                                    </button>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {[
                                        { label: "Tên hiển thị", value: hostInfo.displayName },
                                        { label: "Địa chỉ", value: hostInfo.address },
                                        { label: "Ngân hàng", value: hostInfo.bankName },
                                        { label: "Số tài khoản", value: hostInfo.bankAccount },
                                        { label: "Chủ tài khoản", value: hostInfo.bankHolder },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-start justify-between gap-4">
                                            <span className="text-sm text-gray-500">{item.label}</span>
                                            <span className="text-right text-sm font-medium text-gray-900">{item.value || "—"}</span>
                                        </div>
                                    ))}
                                </div>
                            </article>

                            <article className="rounded-2xl border border-gray-100 bg-white p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-gray-900">Giấy tờ xác minh</h2>
                                    <button type="button" onClick={() => setStep(2)} className="text-sm text-cyan-600">
                                        Chỉnh sửa
                                    </button>
                                </div>

                                <div className="mb-4 mt-4 flex gap-3">
                                    {(docInfo.type === "cccd" ? [docInfo.frontImage, docInfo.backImage] : [docInfo.bizImage]).map((image, index) =>
                                        image ? (
                                            <img
                                                key={`${image}-${index}`}
                                                src={image}
                                                alt={`Giấy tờ ${index + 1}`}
                                                className="h-[4.5rem] w-28 rounded-xl border object-cover"
                                            />
                                        ) : null,
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { label: "Loại giấy tờ", value: docInfo.type === "cccd" ? "CCCD / CMND" : "Giấy phép kinh doanh" },
                                        { label: "Họ và tên", value: docInfo.type === "cccd" ? docInfo.fullName : accountName },
                                        { label: "Số giấy tờ", value: docInfo.type === "cccd" ? docInfo.docNumber : docInfo.taxCode },
                                        { label: "Ngày sinh", value: docInfo.type === "cccd" ? docInfo.birthDate : docInfo.issueDate },
                                        { label: "Ngày hết hạn", value: docInfo.type === "cccd" ? docInfo.expiryDate : "Không áp dụng" },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-start justify-between gap-4">
                                            <span className="text-sm text-gray-500">{item.label}</span>
                                            <span className="text-right text-sm font-medium text-gray-900">{item.value || "—"}</span>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        </div>

                        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-4">
                            {[
                                "Thông tin Host đã điền đầy đủ",
                                "Ảnh giấy tờ đã tải lên",
                                "Tài khoản ngân hàng đã xác nhận",
                                "Thông tin khớp với tài khoản đăng ký",
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2 py-1 text-sm text-teal-700">
                                    <span>✅</span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <label className="mt-6 flex items-start gap-3">
                            <input
                                type="checkbox"
                                checked={termsChecked}
                                onChange={(event) => setTermsChecked(event.target.checked)}
                                className="mt-1 h-4 w-4 rounded accent-cyan-500"
                            />
                            <span className="text-sm text-gray-600">
                                Tôi xác nhận thông tin trên là chính xác và đồng ý với{" "}
                                <button type="button" className="text-cyan-600 underline">
                                    Điều khoản dịch vụ
                                </button>{" "}
                                và{" "}
                                <button type="button" className="text-cyan-600 underline">
                                    Chính sách bảo mật
                                </button>{" "}
                                của MinhThanhVilla.
                            </span>
                        </label>

                        <button
                            type="button"
                            disabled={!termsChecked || submitting}
                            onClick={handleSubmit}
                            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-500 py-3 font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    Đang gửi...
                                </>
                            ) : (
                                "Gửi yêu cầu xác minh"
                            )}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default DangKyHost;
