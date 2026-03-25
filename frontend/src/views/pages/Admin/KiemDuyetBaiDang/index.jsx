import { useMemo, useState } from "react";
import { FiCheckCircle, FiMapPin, FiRefreshCcw, FiSearch, FiStar, FiUser } from "react-icons/fi";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import { useAdminOutletContext } from "../../../layouts/AdminLayout.jsx";
import {
    FilterTabs,
    ToggleSwitch,
    formatCurrency,
    inputClassName,
    labelClassName,
    pageWrapperClass,
    primaryButtonClass,
    secondaryButtonClass,
} from "../../Host/shared";

const statusOptions = [
    { label: "Tất cả", value: "all" },
    { label: "Chờ duyệt", value: "pending" },
    { label: "Đã duyệt", value: "approved" },
    { label: "Từ chối", value: "rejected" },
];

const typeOptions = ["all", "Villa", "Căn hộ", "Homestay", "Phòng đơn"];

const ModerationCard = ({ listing, onOpen, onApprove, onReject, onRecall, onTogglePriority, onToggleFeatured }) => {
    const [inlineRejectReason, setInlineRejectReason] = useState(listing.rejectReason ?? "");

    return (
        <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="relative">
                <img src={listing.images[0]} alt={listing.title} className="aspect-video w-full rounded-t-2xl object-cover" />
                <div className="absolute left-4 top-4">
                    <Badge status={listing.status} />
                </div>
                <div className="absolute right-4 top-4 flex flex-wrap items-center justify-end gap-2">
                    {listing.isPriority ? (
                        <span className="inline-flex rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-white">Ưu tiên</span>
                    ) : null}
                    {listing.isFeatured ? (
                        <span className="inline-flex rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">Villa đặc sắc</span>
                    ) : null}
                </div>
            </div>

            <div className="space-y-4 p-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                            {listing.type}
                        </span>
                        <span>{listing.address}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                        {listing.hostName
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                    </span>
                    <span>{listing.hostName}</span>
                </div>

                <p className="text-lg font-semibold text-teal-700">{formatCurrency(listing.pricePerNight)}/đêm</p>

                <div className="flex flex-wrap gap-2">
                    {listing.amenities.slice(0, 3).map((amenity) => (
                        <span key={amenity} className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            {amenity}
                        </span>
                    ))}
                </div>

                <p className="text-xs text-gray-400">Gửi ngày {listing.submittedAt}</p>

                {!listing.locationMatch ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        ⚠️ Địa chỉ không khớp vị trí thực tế
                    </div>
                ) : null}
            </div>

            <div className="space-y-3 border-t border-gray-100 p-4">
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={onOpen} className={secondaryButtonClass}>
                        Xem chi tiết
                    </button>

                    {listing.status === "pending" ? (
                        <>
                            <button
                                type="button"
                                onClick={() => inlineRejectReason.trim() && onReject(inlineRejectReason.trim())}
                                className="inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                                Từ chối
                            </button>
                            <button type="button" onClick={onApprove} className={primaryButtonClass}>
                                Phê duyệt
                            </button>
                        </>
                    ) : null}

                    {listing.status === "approved" ? (
                        <button
                            type="button"
                            onClick={onRecall}
                            className="inline-flex items-center justify-center rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50"
                        >
                            Thu hồi duyệt
                        </button>
                    ) : null}

                    {listing.status === "rejected" ? (
                        <button type="button" onClick={onApprove} className={primaryButtonClass}>
                            Xét duyệt lại
                        </button>
                    ) : null}
                </div>

                {listing.status === "pending" ? (
                    <textarea
                        value={inlineRejectReason}
                        onChange={(event) => setInlineRejectReason(event.target.value)}
                        placeholder="Nhập lý do từ chối nếu cần..."
                        className="min-h-[88px] w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                    />
                ) : null}

                {listing.status === "rejected" && listing.rejectReason ? (
                    <p className="text-sm italic text-red-500">{listing.rejectReason}</p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={onTogglePriority}
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            listing.isPriority ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        Đánh dấu Ưu tiên
                    </button>

                    {listing.type === "Villa" ? (
                        <button
                            type="button"
                            onClick={onToggleFeatured}
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                listing.isFeatured ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            Villa đặc sắc
                        </button>
                    ) : null}
                </div>
            </div>
        </article>
    );
};

const KiemDuyetBaiDang = () => {
    const { listings, users, approveListing, rejectListing, recallListing, togglePriority, toggleFeatured } =
        useAdminOutletContext();
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [searchValue, setSearchValue] = useState("");
    const [detailTargetId, setDetailTargetId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectError, setRejectError] = useState("");

    const filteredListings = useMemo(() => {
        const normalizedSearch = searchValue.trim().toLowerCase();

        return listings.filter((listing) => {
            const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
            const matchesType = typeFilter === "all" || listing.type === typeFilter;
            const matchesSearch =
                !normalizedSearch ||
                listing.title.toLowerCase().includes(normalizedSearch) ||
                listing.hostName.toLowerCase().includes(normalizedSearch);

            return matchesStatus && matchesType && matchesSearch;
        });
    }, [listings, searchValue, statusFilter, typeFilter]);

    const selectedListing = listings.find((listing) => listing.id === detailTargetId) ?? null;
    const selectedHost = selectedListing ? users.find((user) => user.id === selectedListing.hostId) : null;

    const pendingCount = listings.filter((listing) => listing.status === "pending").length;
    const approvedCount = listings.filter((listing) => listing.status === "approved").length;
    const rejectedCount = listings.filter((listing) => listing.status === "rejected").length;

    const openDetail = (listing) => {
        setDetailTargetId(listing.id);
        setRejectReason(listing.rejectReason ?? "");
        setRejectError("");
    };

    const handleRejectSelected = () => {
        if (!selectedListing) {
            return;
        }

        if (!rejectReason.trim()) {
            setRejectError("Vui lòng nhập lý do từ chối trước khi lưu.");
            return;
        }

        rejectListing(selectedListing.id, rejectReason.trim());
        setRejectError("");
        setDetailTargetId(null);
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kiểm duyệt bài đăng</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Lọc theo trạng thái, loại hình và nhanh chóng duyệt các bài đăng cần xử lý.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">Chờ duyệt</p>
                        <p className="mt-3 text-3xl font-bold text-gray-900">{pendingCount}</p>
                    </article>
                    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">Đã duyệt</p>
                        <p className="mt-3 text-3xl font-bold text-gray-900">{approvedCount}</p>
                    </article>
                    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">Từ chối</p>
                        <p className="mt-3 text-3xl font-bold text-gray-900">{rejectedCount}</p>
                    </article>
                    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">Tổng bài đăng</p>
                        <p className="mt-3 text-3xl font-bold text-gray-900">{listings.length}</p>
                    </article>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="relative">
                            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchValue}
                                onChange={(event) => setSearchValue(event.target.value)}
                                placeholder="Tìm theo tên bài đăng hoặc host..."
                                className="w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                            />
                        </div>

                        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={inputClassName}>
                            {typeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option === "all" ? "Tất cả loại hình" : option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-4">
                        <FilterTabs options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    {filteredListings.map((listing) => (
                        <ModerationCard
                            key={listing.id}
                            listing={listing}
                            onOpen={() => openDetail(listing)}
                            onApprove={() => approveListing(listing.id)}
                            onReject={(reason) => rejectListing(listing.id, reason)}
                            onRecall={() => recallListing(listing.id)}
                            onTogglePriority={() => togglePriority(listing.id)}
                            onToggleFeatured={() => toggleFeatured(listing.id)}
                        />
                    ))}
                </div>
            </div>

            <Modal
                isOpen={Boolean(selectedListing)}
                onClose={() => setDetailTargetId(null)}
                title={selectedListing ? selectedListing.title : ""}
                description="Rà soát kỹ nội dung bài đăng và quyết định trạng thái hiển thị."
                size="xl"
                showCloseButton
                bodyClassName="p-6"
            >
                {selectedListing ? (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
                        <section className="space-y-6">
                            <div className="space-y-3">
                                <img
                                    src={selectedListing.images[0]}
                                    alt={selectedListing.title}
                                    className="w-full rounded-2xl object-cover"
                                />
                                <div className="flex flex-wrap gap-3">
                                    {selectedListing.images.map((image) => (
                                        <img
                                            key={image}
                                            src={image}
                                            alt={selectedListing.title}
                                            className="h-20 w-28 rounded-xl object-cover"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-2xl font-semibold text-gray-900">{selectedListing.title}</h3>
                                    <Badge status={selectedListing.status} />
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    {selectedListing.type} • {selectedListing.address} • {formatCurrency(selectedListing.pricePerNight)}/đêm
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">Mô tả đầy đủ</h4>
                                <p className="mt-3 leading-7 text-gray-600">{selectedListing.description}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">Tiện nghi</h4>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    {selectedListing.amenities.map((amenity) => (
                                        <div key={amenity} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                            <FiStar className="text-cyan-600" />
                                            <span>{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">Host</h4>
                                <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                                            {selectedListing.hostName
                                                .split(" ")
                                                .filter(Boolean)
                                                .slice(0, 2)
                                                .map((part) => part[0])
                                                .join("")
                                                .toUpperCase()}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-gray-900">{selectedListing.hostName}</p>
                                            <p className="text-sm text-gray-500">{selectedHost?.email ?? "host@minhthanhvilla.vn"}</p>
                                            <p className="text-sm text-gray-500">{selectedHost?.phone ?? "Chưa cập nhật số điện thoại"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                                    selectedListing.locationMatch
                                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border border-red-200 bg-red-50 text-red-600"
                                }`}
                            >
                                <FiMapPin />
                                <span>
                                    {selectedListing.locationMatch
                                        ? "Vị trí khớp với địa chỉ đăng ký"
                                        : "Vị trí không khớp — cần xác minh"}
                                </span>
                            </div>
                        </section>

                        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                                <p className="text-sm text-gray-500">Submitted</p>
                                <p className="mt-1 font-semibold text-gray-900">{selectedListing.submittedAt}</p>
                                <div className="mt-4">
                                    <Badge status={selectedListing.status} />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-white p-5">
                                <div className="space-y-4">
                                    <ToggleSwitch
                                        label="Đánh dấu Ưu tiên"
                                        checked={selectedListing.isPriority}
                                        onChange={() => togglePriority(selectedListing.id)}
                                    />
                                    {selectedListing.type === "Villa" ? (
                                        <ToggleSwitch
                                            label="Villa đặc sắc Vũng Tàu"
                                            checked={selectedListing.isFeatured}
                                            onChange={() => toggleFeatured(selectedListing.id)}
                                        />
                                    ) : null}
                                </div>
                            </div>

                            {selectedListing.status === "pending" ? (
                                <div className="rounded-2xl border border-gray-100 bg-white p-5">
                                    <label className={labelClassName}>Lý do từ chối</label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(event) => {
                                            setRejectReason(event.target.value);
                                            setRejectError("");
                                        }}
                                        className="min-h-[130px] w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                                    />
                                    {rejectError ? <p className="mt-2 text-sm text-red-600">{rejectError}</p> : null}

                                    <div className="mt-4 space-y-3">
                                        <button
                                            type="button"
                                            onClick={handleRejectSelected}
                                            className="inline-flex w-full items-center justify-center rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
                                        >
                                            Từ chối
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                approveListing(selectedListing.id);
                                                setDetailTargetId(null);
                                            }}
                                            className={`w-full ${primaryButtonClass}`}
                                        >
                                            Phê duyệt
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {selectedListing.status === "approved" ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        recallListing(selectedListing.id);
                                        setDetailTargetId(null);
                                    }}
                                    className="inline-flex w-full items-center justify-center rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50"
                                >
                                    Thu hồi phê duyệt
                                </button>
                            ) : null}

                            {selectedListing.status === "rejected" ? (
                                <div className="space-y-3">
                                    {selectedListing.rejectReason ? (
                                        <p className="text-sm italic text-red-500">{selectedListing.rejectReason}</p>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            approveListing(selectedListing.id);
                                            setDetailTargetId(null);
                                        }}
                                        className={`w-full ${primaryButtonClass}`}
                                    >
                                        Xét duyệt lại
                                    </button>
                                </div>
                            ) : null}
                        </aside>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default KiemDuyetBaiDang;
