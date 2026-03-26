import { useMemo, useState } from "react";
import { FiMapPin, FiSearch, FiStar } from "react-icons/fi";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import { useAdminOutletContext } from "../../../layouts/AdminLayout.jsx";
import { FilterTabs, ToggleSwitch } from "../../Host/shared";
import {
    formatCurrency,
    getInitials,
    inputClassName,
    labelClassName,
    pageWrapperClass,
    primaryButtonClass,
    secondaryButtonClass,
} from "../../Host/sharedStyles";

const listingStatusOptions = [
    { label: "Tất cả", value: "all" },
    { label: "Chờ duyệt", value: "pending" },
    { label: "Đã duyệt", value: "approved" },
    { label: "Từ chối", value: "rejected" },
];

const hostStatusOptions = [
    { label: "Tất cả", value: "all" },
    { label: "Chờ duyệt", value: "pending" },
    { label: "Đã duyệt", value: "approved" },
    { label: "Từ chối", value: "rejected" },
];

const typeOptions = ["all", "Villa", "Căn hộ", "Homestay", "Phòng đơn"];

const normalizeText = (value = "") =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

const ModerationCard = ({ listing, onOpen, onApprove, onReject, onRecall, onTogglePriority, onToggleFeatured }) => {
    const [inlineRejectReason, setInlineRejectReason] = useState(listing.rejectReason ?? "");

    return (
        <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="relative">
                <img src={listing.images[0]} alt={listing.title} className="aspect-video w-full rounded-t-2xl object-cover" />
                <div className="absolute left-4 top-4"><Badge status={listing.status} /></div>
                <div className="absolute right-4 top-4 flex flex-wrap items-center justify-end gap-2">
                    {listing.isPriority ? <span className="inline-flex rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-white">Ưu tiên</span> : null}
                    {listing.isFeatured ? <span className="inline-flex rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">Villa đặc sắc</span> : null}
                </div>
            </div>

            <div className="space-y-4 p-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{listing.type}</span>
                        <span>{listing.address}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">{getInitials(listing.hostName)}</span>
                    <span>{listing.hostName}</span>
                </div>

                <p className="text-lg font-semibold text-teal-700">{formatCurrency(listing.pricePerNight)}/đêm</p>
                <div className="flex flex-wrap gap-2">{listing.amenities.slice(0, 3).map((amenity) => <span key={amenity} className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{amenity}</span>)}</div>
                <p className="text-xs text-gray-400">Gửi ngày {listing.submittedAt}</p>
                {!listing.locationMatch ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">⚠️ Địa chỉ không khớp vị trí thực tế</div> : null}
            </div>

            <div className="space-y-3 border-t border-gray-100 p-4">
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={onOpen} className={secondaryButtonClass}>Xem chi tiết</button>
                    {listing.status === "pending" ? (
                        <>
                            <button type="button" onClick={() => inlineRejectReason.trim() && onReject(inlineRejectReason.trim())} className="inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">Từ chối</button>
                            <button type="button" onClick={onApprove} className={primaryButtonClass}>Phê duyệt</button>
                        </>
                    ) : null}
                    {listing.status === "approved" ? <button type="button" onClick={onRecall} className="inline-flex items-center justify-center rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50">Thu hồi duyệt</button> : null}
                    {listing.status === "rejected" ? <button type="button" onClick={onApprove} className={primaryButtonClass}>Xét duyệt lại</button> : null}
                </div>

                {listing.status === "pending" ? <textarea value={inlineRejectReason} onChange={(event) => setInlineRejectReason(event.target.value)} placeholder="Nhập lý do từ chối nếu cần..." className="min-h-[88px] w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" /> : null}
                {listing.status === "rejected" && listing.rejectReason ? <p className="text-sm italic text-red-500">{listing.rejectReason}</p> : null}

                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={onTogglePriority} className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${listing.isPriority ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Đánh dấu ưu tiên</button>
                    {listing.type === "Villa" ? <button type="button" onClick={onToggleFeatured} className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${listing.isFeatured ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Villa đặc sắc</button> : null}
                </div>
            </div>
        </article>
    );
};

const ListingsModerationSection = ({ listings, users, approveListing, rejectListing, recallListing, togglePriority, toggleFeatured }) => {
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [searchValue, setSearchValue] = useState("");
    const [detailTargetId, setDetailTargetId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectError, setRejectError] = useState("");

    const filteredListings = useMemo(() => {
        const normalizedSearch = normalizeText(searchValue);
        return listings.filter((listing) => {
            const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
            const matchesType = typeFilter === "all" || listing.type === typeFilter;
            const matchesSearch = !normalizedSearch || normalizeText(`${listing.title} ${listing.hostName}`).includes(normalizedSearch);
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
        if (!selectedListing) return;
        if (!rejectReason.trim()) {
            setRejectError("Vui lòng nhập lý do từ chối trước khi lưu.");
            return;
        }
        rejectListing(selectedListing.id, rejectReason.trim());
        setRejectError("");
        setDetailTargetId(null);
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[{ label: "Chờ duyệt", value: pendingCount }, { label: "Đã duyệt", value: approvedCount }, { label: "Từ chối", value: rejectedCount }, { label: "Tổng bài đăng", value: listings.length }].map((item) => (
                    <article key={item.label} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">{item.label}</p>
                        <p className="mt-3 text-3xl font-bold text-gray-900">{item.value}</p>
                    </article>
                ))}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="relative">
                        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Tìm theo tên bài đăng hoặc host..." className="w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-4 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
                    </div>

                    <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={inputClassName}>
                        {typeOptions.map((option) => <option key={option} value={option}>{option === "all" ? "Tất cả loại hình" : option}</option>)}
                    </select>
                </div>

                <div className="mt-4">
                    <FilterTabs options={listingStatusOptions} value={statusFilter} onChange={setStatusFilter} />
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                {filteredListings.map((listing) => (
                    <ModerationCard key={listing.id} listing={listing} onOpen={() => openDetail(listing)} onApprove={() => approveListing(listing.id)} onReject={(reason) => rejectListing(listing.id, reason)} onRecall={() => recallListing(listing.id)} onTogglePriority={() => togglePriority(listing.id)} onToggleFeatured={() => toggleFeatured(listing.id)} />
                ))}
            </div>

            <Modal isOpen={Boolean(selectedListing)} onClose={() => setDetailTargetId(null)} title={selectedListing ? selectedListing.title : ""} description="Rà soát kỹ nội dung bài đăng và quyết định trạng thái hiển thị." size="xl" showCloseButton bodyClassName="p-6">
                {selectedListing ? (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
                        <section className="space-y-6">
                            <div className="space-y-3">
                                <img src={selectedListing.images[0]} alt={selectedListing.title} className="w-full rounded-2xl object-cover" />
                                <div className="flex flex-wrap gap-3">{selectedListing.images.map((image) => <img key={image} src={image} alt={selectedListing.title} className="h-20 w-28 rounded-xl object-cover" />)}</div>
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-2xl font-semibold text-gray-900">{selectedListing.title}</h3>
                                    <Badge status={selectedListing.status} />
                                </div>
                                <p className="mt-2 text-sm text-gray-500">{selectedListing.type} • {selectedListing.address} • {formatCurrency(selectedListing.pricePerNight)}/đêm</p>
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
                                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">{getInitials(selectedListing.hostName)}</span>
                                        <div>
                                            <p className="font-semibold text-gray-900">{selectedListing.hostName}</p>
                                            <p className="text-sm text-gray-500">{selectedHost?.email ?? "host@minhthanhvilla.vn"}</p>
                                            <p className="text-sm text-gray-500">{selectedHost?.phone ?? "Chưa cập nhật số điện thoại"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${selectedListing.locationMatch ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-red-200 bg-red-50 text-red-600"}`}>
                                <FiMapPin />
                                <span>{selectedListing.locationMatch ? "Vị trí khớp với địa chỉ đăng ký" : "Vị trí không khớp — cần xác minh"}</span>
                            </div>
                        </section>

                        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                                <p className="text-sm text-gray-500">Submitted</p>
                                <p className="mt-1 font-semibold text-gray-900">{selectedListing.submittedAt}</p>
                                <div className="mt-4"><Badge status={selectedListing.status} /></div>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-white p-5">
                                <div className="space-y-4">
                                    <ToggleSwitch label="Đánh dấu ưu tiên" checked={selectedListing.isPriority} onChange={() => togglePriority(selectedListing.id)} />
                                    {selectedListing.type === "Villa" ? <ToggleSwitch label="Villa đặc sắc Vũng Tàu" checked={selectedListing.isFeatured} onChange={() => toggleFeatured(selectedListing.id)} /> : null}
                                </div>
                            </div>

                            {selectedListing.status === "pending" ? (
                                <div className="rounded-2xl border border-gray-100 bg-white p-5">
                                    <label className={labelClassName}>Lý do từ chối</label>
                                    <textarea value={rejectReason} onChange={(event) => { setRejectReason(event.target.value); setRejectError(""); }} className="min-h-[130px] w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
                                    {rejectError ? <p className="mt-2 text-sm text-red-600">{rejectError}</p> : null}
                                    <div className="mt-4 space-y-3">
                                        <button type="button" onClick={handleRejectSelected} className="inline-flex w-full items-center justify-center rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600">Từ chối</button>
                                        <button type="button" onClick={() => { approveListing(selectedListing.id); setDetailTargetId(null); }} className={`w-full ${primaryButtonClass}`}>Phê duyệt</button>
                                    </div>
                                </div>
                            ) : null}

                            {selectedListing.status === "approved" ? <button type="button" onClick={() => { recallListing(selectedListing.id); setDetailTargetId(null); }} className="inline-flex w-full items-center justify-center rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50">Thu hồi phê duyệt</button> : null}
                            {selectedListing.status === "rejected" ? <div className="space-y-3">{selectedListing.rejectReason ? <p className="text-sm italic text-red-500">{selectedListing.rejectReason}</p> : null}<button type="button" onClick={() => { approveListing(selectedListing.id); setDetailTargetId(null); }} className={`w-full ${primaryButtonClass}`}>Xét duyệt lại</button></div> : null}
                        </aside>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};
const HostVerifyTab = ({ applications, adminUsers, onUpdateApplication }) => {
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchValue, setSearchValue] = useState("");
    const [selectedApplicationId, setSelectedApplicationId] = useState(null);
    const [reviewNote, setReviewNote] = useState("");
    const [reviewError, setReviewError] = useState("");

    const filteredApplications = useMemo(() => {
        const normalizedSearch = normalizeText(searchValue);
        return applications.filter((application) => {
            const matchesStatus = statusFilter === "all" || application.status === statusFilter;
            const matchesSearch = !normalizedSearch || normalizeText(`${application.userName} ${application.email}`).includes(normalizedSearch);
            return matchesStatus && matchesSearch;
        });
    }, [applications, searchValue, statusFilter]);

    const selectedApplication = applications.find((application) => application.id === selectedApplicationId) ?? null;
    const selectedAccount = selectedApplication ? adminUsers.find((user) => user.id === selectedApplication.userId) : null;
    const docAddress = selectedApplication?.documents?.address || selectedApplication?.documents?.bizAddress || "—";
    const accountAddress = selectedApplication?.hostInfo?.address || "—";
    const nameMatches = selectedApplication ? normalizeText(selectedApplication.documents.fullName || selectedApplication.userName) === normalizeText(selectedApplication.userName) : true;
    const addressMatches = selectedApplication ? normalizeText(docAddress) === normalizeText(accountAddress) : true;
    const reviewFlags = selectedApplication ? [
        !nameMatches ? "Tên trên giấy tờ khác tên tài khoản." : null,
        !addressMatches ? "Địa chỉ trên giấy tờ khác địa chỉ hoạt động khai báo." : null,
        selectedApplication.documents.infoMatch === false ? "Hệ thống không thể tự động xác minh toàn bộ thông tin." : null,
    ].filter(Boolean) : [];

    const openApplication = (application) => {
        setSelectedApplicationId(application.id);
        setReviewNote(application.rejectReason ?? "");
        setReviewError("");
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <FilterTabs options={hostStatusOptions} value={statusFilter} onChange={setStatusFilter} />
                    <div className="relative lg:w-[320px]">
                        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Tìm theo tên hoặc email..." className="w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-4 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {filteredApplications.map((application) => (
                    <article key={application.id} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:flex-row md:items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 font-bold text-white">{getInitials(application.userName)}</div>

                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-gray-900">{application.userName}</p>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{application.documents.type === "bizlicense" ? "Giấy phép kinh doanh" : "CCCD / CMND"}</span>
                            </div>
                            <p className="text-sm text-gray-500">{application.email}</p>
                            <p className="text-sm text-gray-500">{application.phone}</p>
                            <p className="mt-1 text-xs text-gray-400">Gửi: {application.submittedAt}</p>
                        </div>

                        <div className="md:text-right">
                            <Badge status={application.status} />
                            <div>
                                <button type="button" onClick={() => openApplication(application)} className="mt-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">Xem hồ sơ</button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <Modal isOpen={Boolean(selectedApplication)} onClose={() => setSelectedApplicationId(null)} title={selectedApplication ? `Xác minh Host — ${selectedApplication.userName}` : ""} description="Đối chiếu giấy tờ và phê duyệt trạng thái Host." size="xl" showCloseButton bodyClassName="p-6">
                {selectedApplication ? (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_288px]">
                        <section className="min-w-0">
                            <h3 className="mb-3 font-semibold text-gray-900">Hình ảnh giấy tờ</h3>
                            <div className="flex flex-wrap gap-4">
                                {[selectedApplication.documents.frontImage, selectedApplication.documents.backImage || selectedApplication.documents.bizImage].filter(Boolean).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`Giấy tờ ${index + 1}`} className="max-h-44 rounded-2xl border object-contain" />)}
                            </div>

                            <h3 className="mb-3 mt-5 font-semibold text-gray-900">Đối chiếu thông tin</h3>
                            <div className="overflow-hidden rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-left text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Trường</th>
                                            <th className="px-4 py-3 font-medium">Giá trị giấy tờ</th>
                                            <th className="px-4 py-3 font-medium">Giá trị tài khoản</th>
                                            <th className="px-4 py-3 font-medium">Khớp?</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { label: "Họ tên", docValue: selectedApplication.documents.fullName || selectedApplication.userName, accountValue: selectedApplication.userName, matched: nameMatches },
                                            { label: "Số giấy tờ", docValue: selectedApplication.documents.docNumber || selectedApplication.documents.taxCode || "—", accountValue: "Chưa lưu", matched: selectedApplication.documents.infoMatch !== false },
                                            { label: "Ngày sinh", docValue: selectedApplication.documents.birthDate || selectedApplication.documents.issueDate || "—", accountValue: "Chưa lưu", matched: selectedApplication.documents.infoMatch !== false },
                                            { label: "Địa chỉ", docValue: docAddress, accountValue: accountAddress, matched: addressMatches },
                                        ].map((row) => (
                                            <tr key={row.label} className="border-t border-gray-100">
                                                <td className="px-4 py-3 font-medium text-gray-900">{row.label}</td>
                                                <td className="px-4 py-3 text-gray-600">{row.docValue}</td>
                                                <td className="px-4 py-3 text-gray-600">{row.accountValue}</td>
                                                <td className={`px-4 py-3 font-semibold ${row.matched ? "text-teal-600" : "text-red-500"}`}>{row.matched ? "✓" : "✗"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {reviewFlags.length > 0 ? (
                                <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                                    <p className="font-medium">🔍 Hệ thống phát hiện dấu hiệu cần xem xét:</p>
                                    {reviewFlags.map((flag) => <p key={flag} className="mt-1">{flag}</p>)}
                                </div>
                            ) : null}
                        </section>

                        <aside className="shrink-0 border-l border-gray-100 pl-6">
                            <p className="font-semibold text-gray-900">{selectedApplication.userName}</p>
                            <p className="mt-1 text-sm text-gray-500">{selectedApplication.email}</p>
                            <p className="text-sm text-gray-500">{selectedApplication.phone}</p>
                            <p className="mt-2 text-xs text-gray-400">Submitted: {selectedApplication.submittedAt}</p>

                            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                                <p>Ngân hàng: {selectedApplication.hostInfo.bankName}</p>
                                <p className="mt-1">Số TK: {selectedApplication.hostInfo.bankAccount}</p>
                                <p className="mt-1">Chủ TK: {selectedApplication.hostInfo.bankHolder}</p>
                                {selectedAccount ? <p className="mt-1">Tài khoản: {selectedAccount.role}</p> : null}
                            </div>

                            <textarea value={reviewNote} onChange={(event) => { setReviewNote(event.target.value); setReviewError(""); }} placeholder="Ghi chú / Lý do từ chối (bắt buộc khi từ chối)" className="mt-4 min-h-[140px] w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
                            {reviewError ? <p className="mt-2 text-sm text-red-600">{reviewError}</p> : null}

                            <button type="button" onClick={() => { if (!reviewNote.trim()) { setReviewError("Vui lòng nhập lý do từ chối"); return; } onUpdateApplication(selectedApplication.id, "rejected", reviewNote.trim()); setSelectedApplicationId(null); }} className="mt-4 w-full rounded-xl border border-red-200 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50">Từ chối</button>
                            <button type="button" onClick={() => { onUpdateApplication(selectedApplication.id, "approved"); setSelectedApplicationId(null); }} className="mt-2 w-full rounded-xl bg-cyan-500 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600">Phê duyệt — Xác minh Host</button>
                        </aside>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

const KiemDuyetBaiDang = () => {
    const context = useAdminOutletContext();
    const [activeTab, setActiveTab] = useState("listings");
    const pendingHostCount = context.hostApplications.filter((application) => application.status === "pending").length;

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Trung tâm kiểm duyệt</h1>
                    <p className="mt-1 text-sm text-gray-500">Quản lý bài đăng chờ duyệt và theo dõi luồng xác minh Host ngay trên cùng một màn hình.</p>
                </div>

                <div className="flex border-b border-gray-200">
                    <button type="button" onClick={() => setActiveTab("listings")} className={`pb-3 pr-6 text-sm ${activeTab === "listings" ? "border-b-2 border-teal-600 font-semibold text-teal-700" : "text-gray-500 hover:text-gray-700"}`}>Bài đăng</button>
                    <button type="button" onClick={() => setActiveTab("host-verify")} className={`flex items-center pb-3 text-sm ${activeTab === "host-verify" ? "border-b-2 border-teal-600 font-semibold text-teal-700" : "text-gray-500 hover:text-gray-700"}`}>
                        Xác minh Host
                        <span className="ml-1 rounded-full bg-red-100 px-2 text-xs text-red-600">{pendingHostCount}</span>
                    </button>
                </div>

                {activeTab === "listings" ? <ListingsModerationSection {...context} /> : null}
                {activeTab === "host-verify" ? <HostVerifyTab applications={context.hostApplications} adminUsers={context.users} onUpdateApplication={context.updateHostApplication} /> : null}
            </div>
        </div>
    );
};

export default KiemDuyetBaiDang;
