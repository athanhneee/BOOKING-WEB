import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { FiArrowLeft, FiArrowRight, FiCheck, FiCheckCircle, FiMinus, FiPlus, FiUploadCloud, FiX } from "react-icons/fi";
import { properties } from "../../../../data/mockData.ts";
import { PageHeader, ToggleSwitch, createTimeOptions, inputClassName, labelClassName, pageWrapperClass, primaryButtonClass, secondaryButtonClass, textareaClassName } from "../shared";

type Step = 1 | 2 | 3 | 4;
type UploadItem = { id: string; url: string };
type Policy = "Linh hoạt" | "Vừa phải" | "Nghiêm ngặt";
type Season = { id: string; from: string; to: string; price: number };

const stepList = ["Thông tin cơ bản", "Hình ảnh & tiện nghi", "Giá & chính sách", "Xem lại & đăng"];
const typeList = [
    { value: "Villa", icon: "🏖️" },
    { value: "Căn hộ", icon: "🏢" },
    { value: "Homestay", icon: "🏡" },
    { value: "Phòng đơn", icon: "🛏️" },
] as const;
const amenityList = ["WiFi", "Điều hòa", "Máy giặt", "Bếp", "Hồ bơi", "Bãi đỗ xe", "TV", "Ban công", "Lò sưởi", "Tủ lạnh", "Máy sấy tóc", "Bàn ủi"];
const policyList: Array<{ value: Policy; description: string }> = [
    { value: "Linh hoạt", description: "Hủy trước 24 giờ để hoàn tiền gần như toàn bộ." },
    { value: "Vừa phải", description: "Hoàn tiền 50% khi hủy trước 5 ngày." },
    { value: "Nghiêm ngặt", description: "Phù hợp với mùa cao điểm." },
];

const createId = () => Math.random().toString(36).slice(2, 9);
const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

const ThemChoNghi = () => {
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [step, setStep] = useState<Step>(1);
    const [toast, setToast] = useState<string | null>(null);
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [form, setForm] = useState({
        propertyType: "Villa" as "Villa" | "Căn hộ" | "Homestay" | "Phòng đơn",
        name: "",
        address: "",
        city: "Đà Nẵng",
        description: "",
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        amenities: ["WiFi", "Điều hòa", "Bếp"],
        pricePerNight: 2500000,
        weekendEnabled: false,
        weekendPrice: 3200000,
        seasons: [{ id: createId(), from: "", to: "", price: 0 }] as Season[],
        policy: "Vừa phải" as Policy,
        checkIn: "14:00",
        checkOut: "12:00",
        minNights: 1,
        maxNights: 14,
    });

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), 3000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const previewImage = uploads[0]?.url ?? properties[0].image;
    const timeOptions = useMemo(() => createTimeOptions(), []);
    const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));
    const updateCounter = (key: "bedrooms" | "bathrooms" | "maxGuests", delta: number) => setField(key, Math.max(1, form[key] + delta));
    const parseMoney = (value: string) => Number(value.replace(/\D/g, "") || 0);

    const pushFiles = (files: FileList | File[]) => {
        const next = Array.from(files).slice(0, Math.max(0, 10 - uploads.length)).map((file) => ({ id: createId(), url: URL.createObjectURL(file) }));
        if (next.length) setUploads((current) => [...current, ...next].slice(0, 10));
    };

    const onDrop = (event: DragEvent<HTMLButtonElement>) => {
        event.preventDefault();
        pushFiles(event.dataTransfer.files);
    };

    const onUpload = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) pushFiles(event.target.files);
        event.target.value = "";
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-6xl space-y-6">
                <PageHeader title="Thêm chỗ nghỉ mới" subtitle="Hoàn thành 4 bước để đăng chỗ nghỉ lên BlueStay." />

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-4">
                        {stepList.map((label, index) => {
                            const done = step > index + 1;
                            const active = step === index + 1;
                            return (
                                <div key={label}>
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${done || active ? "bg-cyan-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                                            {done ? <FiCheck size={16} /> : index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{label}</p>
                                            <p className="text-xs text-gray-500">Bước {index + 1}/4</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div>
                                <label className={labelClassName}>Loại chỗ nghỉ</label>
                                <div className="grid gap-4 md:grid-cols-4">
                                    {typeList.map((item) => (
                                        <button key={item.value} type="button" onClick={() => setField("propertyType", item.value)} className={`rounded-2xl border p-5 text-left ${form.propertyType === item.value ? "border-cyan-500 bg-cyan-300/15" : "border-gray-200 hover:bg-gray-50"}`}>
                                            <div className="text-3xl">{item.icon}</div>
                                            <p className="mt-3 font-semibold text-gray-900">{item.value}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2">
                                <div><label className={labelClassName}>Tên chỗ nghỉ</label><input value={form.name} onChange={(e) => setField("name", e.target.value)} className={inputClassName} /></div>
                                <div><label className={labelClassName}>Địa chỉ</label><input value={form.address} onChange={(e) => setField("address", e.target.value)} className={inputClassName} /></div>
                            </div>
                            <div className="max-w-md"><label className={labelClassName}>Thành phố</label><select value={form.city} onChange={(e) => setField("city", e.target.value)} className={inputClassName}>{["Đà Nẵng", "TP.HCM", "Đà Lạt", "Nha Trang", "Hà Nội"].map((city) => <option key={city}>{city}</option>)}</select></div>
                            <div><label className={labelClassName}>Mô tả ngắn</label><textarea maxLength={500} value={form.description} onChange={(e) => setField("description", e.target.value)} className={textareaClassName} /><p className="mt-2 text-right text-xs text-gray-400">{form.description.length}/500</p></div>
                            <div className="grid gap-4 md:grid-cols-3">{(["bedrooms", "bathrooms", "maxGuests"] as const).map((key) => <div key={key} className="rounded-2xl border border-gray-200 p-4"><p className="text-sm font-medium text-gray-500">{key === "bedrooms" ? "Phòng ngủ" : key === "bathrooms" ? "Phòng tắm" : "Số khách tối đa"}</p><div className="mt-4 flex items-center justify-between"><button type="button" onClick={() => updateCounter(key, -1)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200"><FiMinus size={16} /></button><span className="text-2xl font-semibold text-gray-900">{form[key]}</span><button type="button" onClick={() => updateCounter(key, 1)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200"><FiPlus size={16} /></button></div></div>)}</div>
                        </div>
                    ) : null}

                    {step === 2 ? (
                        <div className="space-y-6">
                            <div>
                                <label className={labelClassName}>Hình ảnh chỗ nghỉ</label>
                                <button type="button" onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center hover:border-cyan-300 hover:bg-cyan-300/10">
                                    <FiUploadCloud size={30} className="text-cyan-600" />
                                    <p className="mt-4 font-medium text-gray-900">Kéo thả ảnh vào đây hoặc click để chọn</p>
                                    <p className="mt-1 text-sm text-gray-500">Tối đa 10 ảnh.</p>
                                </button>
                                <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={onUpload} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{uploads.length ? uploads.map((item) => <div key={item.id} className="relative overflow-hidden rounded-2xl border border-gray-200"><img src={item.url} alt="Ảnh tải lên" className="aspect-square w-full object-cover" /><button type="button" onClick={() => setUploads((current) => current.filter((upload) => upload.id !== item.id))} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90"><FiX size={15} /></button></div>) : <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">Chưa có ảnh</div>}</div>
                            <div>
                                <label className={labelClassName}>Tiện nghi</label>
                                <div className="grid gap-4 md:grid-cols-3">{amenityList.map((item) => <label key={item} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${form.amenities.includes(item) ? "border-cyan-300/35 bg-cyan-300/12" : "border-gray-200 hover:bg-gray-50"}`}><input type="checkbox" checked={form.amenities.includes(item)} onChange={() => setField("amenities", form.amenities.includes(item) ? form.amenities.filter((value) => value !== item) : [...form.amenities, item])} className="h-4 w-4 rounded border-gray-300 text-cyan-600" /><span className="text-sm font-medium text-gray-700">{item}</span></label>)}</div>
                            </div>
                        </div>
                    ) : null}

                    {step === 3 ? (
                        <div className="space-y-6">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div><label className={labelClassName}>Giá theo đêm</label><input value={formatNumber(form.pricePerNight)} onChange={(e) => setField("pricePerNight", parseMoney(e.target.value))} className={inputClassName} /></div>
                                <div className="flex items-end"><ToggleSwitch checked={form.weekendEnabled} onChange={(value) => setField("weekendEnabled", value)} label="Giá cuối tuần khác" /></div>
                            </div>
                            {form.weekendEnabled ? <div className="max-w-md"><label className={labelClassName}>Giá cuối tuần</label><input value={formatNumber(form.weekendPrice)} onChange={(e) => setField("weekendPrice", parseMoney(e.target.value))} className={inputClassName} /></div> : null}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between"><label className={labelClassName}>Giá theo mùa</label><button type="button" onClick={() => setField("seasons", [...form.seasons, { id: createId(), from: "", to: "", price: 0 }])} className={secondaryButtonClass}>+ Thêm khoảng</button></div>
                                {form.seasons.map((season) => <div key={season.id} className="grid gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-[1fr_1fr_1fr_auto]"><input type="date" value={season.from} onChange={(e) => setField("seasons", form.seasons.map((item) => item.id === season.id ? { ...item, from: e.target.value } : item))} className={inputClassName} /><input type="date" value={season.to} onChange={(e) => setField("seasons", form.seasons.map((item) => item.id === season.id ? { ...item, to: e.target.value } : item))} className={inputClassName} /><input value={formatNumber(season.price)} onChange={(e) => setField("seasons", form.seasons.map((item) => item.id === season.id ? { ...item, price: parseMoney(e.target.value) } : item))} className={inputClassName} /><button type="button" onClick={() => setField("seasons", form.seasons.filter((item) => item.id !== season.id))} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600">Xóa</button></div>)}
                            </div>
                            <div><label className={labelClassName}>Chính sách hủy phòng</label><div className="grid gap-4 md:grid-cols-3">{policyList.map((item) => <button key={item.value} type="button" onClick={() => setField("policy", item.value)} className={`rounded-2xl border p-5 text-left ${form.policy === item.value ? "border-cyan-500 bg-cyan-300/15" : "border-gray-200 hover:bg-gray-50"}`}><p className="font-semibold text-gray-900">{item.value}</p><p className="mt-2 text-sm text-gray-500">{item.description}</p></button>)}</div></div>
                            <div className="grid gap-5 md:grid-cols-2"><div><label className={labelClassName}>Giờ nhận phòng</label><select value={form.checkIn} onChange={(e) => setField("checkIn", e.target.value)} className={inputClassName}>{timeOptions.map((time) => <option key={time}>{time}</option>)}</select></div><div><label className={labelClassName}>Giờ trả phòng</label><select value={form.checkOut} onChange={(e) => setField("checkOut", e.target.value)} className={inputClassName}>{timeOptions.map((time) => <option key={time}>{time}</option>)}</select></div></div>
                            <div className="grid gap-5 md:grid-cols-2"><div><label className={labelClassName}>Số đêm tối thiểu</label><input type="number" min={1} value={form.minNights} onChange={(e) => setField("minNights", Number(e.target.value))} className={inputClassName} /></div><div><label className={labelClassName}>Số đêm tối đa</label><input type="number" min={1} value={form.maxNights} onChange={(e) => setField("maxNights", Number(e.target.value))} className={inputClassName} /></div></div>
                        </div>
                    ) : null}

                    {step === 4 ? (
                        <div className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                                <div className="overflow-hidden rounded-2xl border border-gray-100"><img src={previewImage} alt="Xem trước" className="aspect-video w-full object-cover" /><div className="space-y-4 p-6"><p className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{form.propertyType}</p><h2 className="text-2xl font-semibold text-gray-900">{form.name || "Tên chỗ nghỉ"}</h2><p className="text-sm text-gray-500">{form.address || "Địa chỉ đang cập nhật"}, {form.city}</p><p className="text-sm leading-6 text-gray-600">{form.description || "Mô tả sẽ hiển thị tại đây sau khi bạn nhập ở bước 1."}</p><p className="text-lg font-semibold text-cyan-700">{formatNumber(form.pricePerNight)}đ/đêm</p><div className="flex flex-wrap gap-2">{form.amenities.map((amenity) => <span key={amenity} className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-medium text-cyan-700">{amenity}</span>)}</div><p className="text-sm text-gray-500">Chính sách {form.policy} · Nhận phòng {form.checkIn} · Trả phòng {form.checkOut}</p></div></div>
                                <div className="rounded-2xl border border-gray-100 bg-white p-6"><h3 className="text-lg font-semibold text-gray-900">Checklist hoàn thành</h3><div className="mt-5 space-y-4">{[`Thông tin cơ bản`, `Hình ảnh (${uploads.length} ảnh)`, `Tiện nghi (${form.amenities.length})`, `Giá & chính sách`].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3"><FiCheckCircle className="text-cyan-600" /><span className="text-sm font-medium text-gray-700">{item}</span></div>)}</div></div>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setToast("Đã lưu nháp chỗ nghỉ thành công.")} className={secondaryButtonClass}>Lưu nháp</button><button type="button" onClick={() => setToast("Đăng chỗ nghỉ thành công.")} className={primaryButtonClass}>Đăng ngay</button></div>
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1) as Step)} disabled={step === 1} className={`${secondaryButtonClass} ${step === 1 ? "cursor-not-allowed opacity-50" : ""}`}><span className="inline-flex items-center gap-2"><FiArrowLeft size={16} />Quay lại</span></button>
                    {step < 4 ? <button type="button" onClick={() => setStep((current) => Math.min(4, current + 1) as Step)} className={primaryButtonClass}><span className="inline-flex items-center gap-2">Tiếp theo<FiArrowRight size={16} /></span></button> : null}
                </div>
            </div>

            {toast ? <div className="fixed right-4 top-24 z-[95] rounded-2xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">{toast}</div> : null}
        </div>
    );
};

export default ThemChoNghi;
