import { useMemo, useState } from "react";
import { FiCalendar, FiClock, FiDownload, FiHome, FiUsers } from "react-icons/fi";
import { bookings, properties } from "../../../../data/mockData.ts";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import {
    PageHeader,
    StatCard,
    downloadTextFile,
    formatCurrency,
    formatDate,
    getInitials,
    hostCardClass,
    inputClassName,
    pageWrapperClass,
    primaryButtonClass,
    tableClassName,
} from "../shared";

const DatPhong = () => {
    const [statusFilter, setStatusFilter] = useState("all");
    const [propertyFilter, setPropertyFilter] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>(
        Object.fromEntries(bookings.map((booking) => [booking.id, booking.notes])),
    );

    const filteredBookings = useMemo(
        () =>
            bookings.filter((booking) => {
                const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
                const matchesProperty = propertyFilter === "all" || booking.propertyId === propertyFilter;
                const normalizedKeyword = keyword.trim().toLowerCase();
                const matchesKeyword =
                    !normalizedKeyword ||
                    booking.guestName.toLowerCase().includes(normalizedKeyword) ||
                    booking.code.toLowerCase().includes(normalizedKeyword);
                return matchesStatus && matchesProperty && matchesKeyword;
            }),
        [keyword, propertyFilter, statusFilter],
    );

    const selectedBooking = filteredBookings.find((booking) => booking.id === selectedId) ?? bookings.find((booking) => booking.id === selectedId) ?? null;
    const selectedProperty = properties.find((property) => property.id === selectedBooking?.propertyId);

    const exportCsv = () => {
        const csv = [
            "Khach,Ma,Cho nghi,Nhan phong,Tra phong,Tong tien,Trang thai,Thanh toan",
            ...filteredBookings.map((booking) =>
                [
                    booking.guestName,
                    booking.code,
                    properties.find((property) => property.id === booking.propertyId)?.name ?? "",
                    booking.checkIn,
                    booking.checkOut,
                    booking.totalAmount,
                    booking.status,
                    booking.paymentStatus,
                ].join(","),
            ),
        ].join("\n");

        downloadTextFile("dat-phong.csv", csv, "text/csv;charset=utf-8");
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader
                    title="Quản lý đặt phòng"
                    subtitle="Theo dõi đơn mới, khách đang lưu trú và những booking đã hoàn thành."
                    actions={
                        <button type="button" onClick={exportCsv} className={primaryButtonClass}>
                            <span className="inline-flex items-center gap-2">
                                <FiDownload size={16} />
                                Xuất CSV
                            </span>
                        </button>
                    }
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Tổng đặt phòng" value={String(bookings.length)} icon={<FiCalendar size={18} />} />
                    <StatCard label="Chờ xác nhận" value={String(bookings.filter((item) => item.status === "sap-nhan").length)} icon={<FiClock size={18} />} accentClassName="bg-blue-50 text-blue-600" />
                    <StatCard label="Đang lưu trú" value={String(bookings.filter((item) => item.status === "dang-luu-tru").length)} icon={<FiUsers size={18} />} accentClassName="bg-emerald-50 text-emerald-600" />
                    <StatCard label="Đã hoàn thành" value={String(bookings.filter((item) => item.status === "da-tra").length)} icon={<FiHome size={18} />} accentClassName="bg-gray-100 text-gray-600" />
                </div>

                <div className={`${hostCardClass} space-y-4`}>
                    <div className="grid gap-4 lg:grid-cols-[180px_220px_minmax(0,1fr)]">
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClassName}>
                            <option value="all">Tất cả trạng thái</option>
                            <option value="sap-nhan">Sắp nhận phòng</option>
                            <option value="dang-luu-tru">Đang lưu trú</option>
                            <option value="sap-tra">Sắp trả phòng</option>
                            <option value="da-tra">Đã hoàn thành</option>
                        </select>
                        <select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)} className={inputClassName}>
                            <option value="all">Tất cả chỗ nghỉ</option>
                            {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
                        </select>
                        <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm theo tên khách hoặc mã đặt phòng" className={inputClassName} />
                    </div>

                    <div className={tableClassName}>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    {["Khách", "Mã", "Chỗ nghỉ", "Nhận phòng", "Trả phòng", "Tổng tiền", "Trạng thái", "Thanh toán", "..."].map((column) => (
                                        <th key={column} className="px-4 py-3 font-medium">{column}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(booking.id)}>
                                        <td className="px-4 py-4 font-medium text-gray-900">{booking.guestName}</td>
                                        <td className="px-4 py-4 text-gray-500">{booking.code}</td>
                                        <td className="px-4 py-4 text-gray-500">{properties.find((property) => property.id === booking.propertyId)?.name}</td>
                                        <td className="px-4 py-4 text-gray-500">{formatDate(booking.checkIn)}</td>
                                        <td className="px-4 py-4 text-gray-500">{formatDate(booking.checkOut)}</td>
                                        <td className="px-4 py-4 font-medium text-gray-900">{formatCurrency(booking.totalAmount)}</td>
                                        <td className="px-4 py-4"><Badge status={booking.status} /></td>
                                        <td className="px-4 py-4"><Badge status={booking.paymentStatus} /></td>
                                        <td className="px-4 py-4 text-gray-400">Xem</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={Boolean(selectedBooking)}
                onClose={() => setSelectedId(null)}
                title={selectedBooking ? `Chi tiết booking ${selectedBooking.code}` : ""}
                description="Kiểm tra thông tin khách, thời gian lưu trú và cập nhật ghi chú nội bộ."
                showCloseButton
                bodyClassName="p-6"
            >
                {selectedBooking ? (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4 rounded-2xl bg-gray-50 p-5 sm:flex-row sm:items-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-600 text-lg font-semibold text-white">
                                {getInitials(selectedBooking.guestName)}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">{selectedBooking.guestName}</h3>
                                <p className="text-sm text-gray-500">{selectedProperty?.name}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge status={selectedBooking.status} />
                                <Badge status={selectedBooking.paymentStatus} />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-gray-100 p-5">
                                <p className="text-sm text-gray-500">Nhận phòng</p>
                                <p className="mt-2 font-semibold text-gray-900">{formatDate(selectedBooking.checkIn)}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 p-5">
                                <p className="text-sm text-gray-500">Trả phòng</p>
                                <p className="mt-2 font-semibold text-gray-900">{formatDate(selectedBooking.checkOut)}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 p-5">
                                <p className="text-sm text-gray-500">Số đêm</p>
                                <p className="mt-2 font-semibold text-gray-900">{selectedBooking.nights} đêm</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 p-5">
                                <p className="text-sm text-gray-500">Tổng tiền</p>
                                <p className="mt-2 font-semibold text-gray-900">{formatCurrency(selectedBooking.totalAmount)}</p>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Ghi chú nội bộ</label>
                            <textarea
                                value={notes[selectedBooking.id] ?? ""}
                                onChange={(event) => setNotes((current) => ({ ...current, [selectedBooking.id]: event.target.value }))}
                                className="min-h-[140px] w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            />
                            <div className="mt-4 flex justify-end">
                                <button type="button" className={primaryButtonClass}>Lưu ghi chú</button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default DatPhong;
