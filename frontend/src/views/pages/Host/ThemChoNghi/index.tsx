import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { APP_ROUTES } from "../../../../config/routes";
import {
    addHostListingImages,
    createHostListing,
    type CreateHostListingPayload,
} from "../../../../services/hostService";
import { PageHeader } from "../shared";
import { inputClassName, labelClassName, pageWrapperClass, primaryButtonClass, secondaryButtonClass, textareaClassName } from "../sharedStyles";

type FormState = {
    title: string;
    description: string;
    addressLine: string;
    ward: string;
    district: string;
    city: string;
    latitude: string;
    longitude: string;
    propertyType: CreateHostListingPayload["propertyType"];
    roomType: CreateHostListingPayload["roomType"];
    maxGuests: string;
    bedrooms: string;
    beds: string;
    bathrooms: string;
    basePrice: string;
    weekendPrice: string;
    cleaningFee: string;
    serviceFeePct: string;
    minNights: string;
    maxNights: string;
    checkInFrom: string;
    checkOutBefore: string;
    cancellationPolicy: CreateHostListingPayload["cancellationPolicy"];
    instantBookEnabled: boolean;
    imageUrls: string;
    status: "draft" | "pending_approval";
};

const initialForm: FormState = {
    title: "",
    description: "",
    addressLine: "",
    ward: "",
    district: "Vũng Tàu",
    city: "Vũng Tàu",
    latitude: "10.345",
    longitude: "107.084",
    propertyType: "villa",
    roomType: "entire_place",
    maxGuests: "8",
    bedrooms: "4",
    beds: "4",
    bathrooms: "4",
    basePrice: "3000000",
    weekendPrice: "",
    cleaningFee: "0",
    serviceFeePct: "10",
    minNights: "1",
    maxNights: "14",
    checkInFrom: "14:00",
    checkOutBefore: "12:00",
    cancellationPolicy: "moderate",
    instantBookEnabled: false,
    imageUrls: "",
    status: "pending_approval",
};

const toNumber = (value: string, fallback = 0) => Number(value || fallback);
const toNullableNumber = (value: string) => (value.trim() ? Number(value) : null);

const ThemChoNghi = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState<FormState>(initialForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const listingIdForEdit = searchParams.get("listingId");

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const buildPayload = (): CreateHostListingPayload => ({
        title: form.title.trim(),
        description: form.description.trim(),
        addressLine: form.addressLine.trim(),
        ward: form.ward.trim(),
        district: form.district.trim(),
        city: form.city.trim(),
        stateRegion: null,
        country: "VN",
        postalCode: null,
        latitude: toNumber(form.latitude),
        longitude: toNumber(form.longitude),
        propertyType: form.propertyType,
        roomType: form.roomType,
        maxGuests: toNumber(form.maxGuests, 1),
        bedrooms: toNumber(form.bedrooms, 0),
        beds: toNumber(form.beds, 1),
        bathrooms: toNumber(form.bathrooms, 1),
        basePrice: toNumber(form.basePrice, 0),
        weekendPrice: toNullableNumber(form.weekendPrice),
        cleaningFee: toNullableNumber(form.cleaningFee),
        serviceFeePct: toNullableNumber(form.serviceFeePct),
        currency: "VND",
        minNights: toNumber(form.minNights, 1),
        maxNights: toNullableNumber(form.maxNights),
        checkInFrom: form.checkInFrom,
        checkOutBefore: form.checkOutBefore,
        cancellationPolicy: form.cancellationPolicy,
        instantBookEnabled: form.instantBookEnabled,
        amenityIds: [],
        status: form.status,
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            if (listingIdForEdit) {
                setError("Trang sửa chi tiết đang chuyển về bản tạo mới. Để sửa listing, dùng nút Ẩn/Hiện/Gửi duyệt ở trang Chỗ nghỉ.");
                return;
            }

            const created = await createHostListing(buildPayload());
            const urls = form.imageUrls
                .split("\n")
                .map((url) => url.trim())
                .filter(Boolean);

            if (urls.length > 0) {
                await addHostListingImages(
                    created.listingId,
                    urls.map((url, index) => ({ url, sortOrder: index, isCover: index === 0 })),
                );
            }

            setSuccess("Đã tạo chỗ nghỉ thành công. Nếu chọn Chờ duyệt, admin cần approve trước khi hiển thị public.");
            setForm(initialForm);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Không thể tạo chỗ nghỉ.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-5xl space-y-6">
                <PageHeader
                    title="Thêm chỗ nghỉ mới"
                  
                    actions={<button type="button" onClick={() => navigate(APP_ROUTES.hostProperties)} className={secondaryButtonClass}>Quay lại danh sách</button>}
                />

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
                {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div> : null}

                <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="grid gap-5 md:grid-cols-2">
                        <label><span className={labelClassName}>Tiêu đề</span><input required value={form.title} onChange={(e) => setField("title", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Loại chỗ nghỉ</span><select value={form.propertyType} onChange={(e) => setField("propertyType", e.target.value as FormState["propertyType"])} className={inputClassName}><option value="villa">Villa</option><option value="apartment">Căn hộ</option><option value="homestay">Homestay</option><option value="hotel">Khách sạn</option></select></label>
                    </div>

                    <label><span className={labelClassName}>Mô tả</span><textarea required value={form.description} onChange={(e) => setField("description", e.target.value)} className={textareaClassName} /></label>

                    <div className="grid gap-5 md:grid-cols-2">
                        <label><span className={labelClassName}>Địa chỉ</span><input required value={form.addressLine} onChange={(e) => setField("addressLine", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Phường/xã</span><input required value={form.ward} onChange={(e) => setField("ward", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Quận/huyện</span><input required value={form.district} onChange={(e) => setField("district", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Thành phố</span><input required value={form.city} onChange={(e) => setField("city", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Latitude</span><input required type="number" step="any" value={form.latitude} onChange={(e) => setField("latitude", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Longitude</span><input required type="number" step="any" value={form.longitude} onChange={(e) => setField("longitude", e.target.value)} className={inputClassName} /></label>
                    </div>

                    <div className="grid gap-5 md:grid-cols-4">
                        <label><span className={labelClassName}>Khách tối đa</span><input required type="number" min={1} value={form.maxGuests} onChange={(e) => setField("maxGuests", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Phòng ngủ</span><input required type="number" min={0} value={form.bedrooms} onChange={(e) => setField("bedrooms", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Giường</span><input required type="number" min={1} value={form.beds} onChange={(e) => setField("beds", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>WC</span><input required type="number" min={0.5} step="0.5" value={form.bathrooms} onChange={(e) => setField("bathrooms", e.target.value)} className={inputClassName} /></label>
                    </div>

                    <div className="grid gap-5 md:grid-cols-4">
                        <label><span className={labelClassName}>Giá cơ bản</span><input required type="number" min={0} value={form.basePrice} onChange={(e) => setField("basePrice", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Giá cuối tuần</span><input type="number" min={0} value={form.weekendPrice} onChange={(e) => setField("weekendPrice", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Phí dọn dẹp</span><input type="number" min={0} value={form.cleaningFee} onChange={(e) => setField("cleaningFee", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Phí nền tảng %</span><input type="number" min={0} max={100} value={form.serviceFeePct} onChange={(e) => setField("serviceFeePct", e.target.value)} className={inputClassName} /></label>
                    </div>

                    <div className="grid gap-5 md:grid-cols-4">
                        <label><span className={labelClassName}>Số đêm tối thiểu</span><input required type="number" min={1} value={form.minNights} onChange={(e) => setField("minNights", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Số đêm tối đa</span><input type="number" min={1} value={form.maxNights} onChange={(e) => setField("maxNights", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Nhận phòng từ</span><input required value={form.checkInFrom} onChange={(e) => setField("checkInFrom", e.target.value)} className={inputClassName} placeholder="14:00" /></label>
                        <label><span className={labelClassName}>Trả phòng trước</span><input required value={form.checkOutBefore} onChange={(e) => setField("checkOutBefore", e.target.value)} className={inputClassName} placeholder="12:00" /></label>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        <label><span className={labelClassName}>Loại phòng</span><select value={form.roomType} onChange={(e) => setField("roomType", e.target.value as FormState["roomType"])} className={inputClassName}><option value="entire_place">Nguyên căn</option><option value="private_room">Phòng riêng</option><option value="shared_room">Phòng chung</option></select></label>
                        <label><span className={labelClassName}>Chính sách hủy</span><select value={form.cancellationPolicy} onChange={(e) => setField("cancellationPolicy", e.target.value as FormState["cancellationPolicy"])} className={inputClassName}><option value="flexible">Linh hoạt</option><option value="moderate">Vừa phải</option><option value="strict">Nghiêm ngặt</option></select></label>
                        <label><span className={labelClassName}>Trạng thái</span><select value={form.status} onChange={(e) => setField("status", e.target.value as FormState["status"])} className={inputClassName}><option value="draft">Lưu nháp</option><option value="pending_approval">Gửi admin duyệt</option></select></label>
                    </div>

                    <label><span className={labelClassName}>URL ảnh thật, mỗi dòng 1 URL</span><textarea value={form.imageUrls} onChange={(e) => setField("imageUrls", e.target.value)} className={textareaClassName} placeholder="https://..." /></label>

                    <label className="flex items-center gap-3 rounded-2xl border border-gray-100 p-4">
                        <input type="checkbox" checked={form.instantBookEnabled} onChange={(e) => setField("instantBookEnabled", e.target.checked)} />
                        <span className="text-sm font-medium text-gray-700">Cho phép đặt nhanh</span>
                    </label>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setForm(initialForm)} className={secondaryButtonClass}>Xóa form</button>
                        <button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? "Đang lưu..." : "Lưu chỗ nghỉ"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ThemChoNghi;