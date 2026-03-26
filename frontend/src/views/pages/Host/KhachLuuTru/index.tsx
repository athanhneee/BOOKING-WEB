import { useMemo, useState } from "react";
import { bookings, guests, properties } from "../../../../data/mockData.ts";
import Modal from "../../../components/ui/Modal";
import {
    FilterTabs,
    PageHeader,
} from "../shared";
import {
    formatCurrency,
    formatDate,
    getInitials,
    hostCardClass,
    inputClassName,
    maskEmail,
    maskPhone,
    pageWrapperClass,
    primaryButtonClass,
    tableClassName,
} from "../sharedStyles";

type GuestFilter = "all" | "vip" | "moi" | "thuong-xuyen";

const guestFilterOptions: Array<{ label: string; value: GuestFilter }> = [
    { label: "Tất cả", value: "all" },
    { label: "VIP", value: "vip" },
    { label: "Mới", value: "moi" },
    { label: "Thường xuyên", value: "thuong-xuyen" },
];

const guestTag: Record<GuestFilter, string> = {
    all: "Tất cả",
    vip: "VIP",
    moi: "Mới",
    "thuong-xuyen": "Thường xuyên",
};

const KhachLuuTru = () => {
    const [keyword, setKeyword] = useState("");
    const [filter, setFilter] = useState<GuestFilter>("all");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>(Object.fromEntries(guests.map((guest) => [guest.id, guest.note])));

    const filteredGuests = useMemo(
        () =>
            guests.filter((guest) => {
                const matchesFilter = filter === "all" || guest.segment === filter;
                const matchesKeyword = guest.name.toLowerCase().includes(keyword.trim().toLowerCase());
                return matchesFilter && matchesKeyword;
            }),
        [filter, keyword],
    );

    const selectedGuest = guests.find((guest) => guest.id === selectedId) ?? null;
    const stayHistory = bookings.filter((booking) => booking.guestId === selectedId);

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader title="Khách lưu trú" subtitle="Theo dõi tệp khách, phân nhóm hành vi và lưu ghi chú nội bộ." />

                <div className={`${hostCardClass} space-y-4`}>
                    <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm theo tên khách" className={inputClassName} />
                    <FilterTabs options={guestFilterOptions} value={filter} onChange={setFilter} />
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredGuests.map((guest) => (
                        <button key={guest.id} type="button" onClick={() => setSelectedId(guest.id)} className={`${hostCardClass} text-left hover:border-cyan-300/40`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600 text-lg font-semibold text-white">
                                    {getInitials(guest.name)}
                                </div>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                    {guestTag[guest.segment]}
                                </span>
                            </div>
                            <h2 className="mt-4 text-lg font-semibold text-gray-900">{guest.name}</h2>
                            <div className="mt-4 space-y-2 text-sm text-gray-500">
                                <p>Số lần lưu trú: <span className="font-medium text-gray-700">{guest.stayCount}</span></p>
                                <p>Tổng chi tiêu: <span className="font-medium text-gray-700">{formatCurrency(guest.totalSpend)}</span></p>
                                <p>Lần cuối: <span className="font-medium text-gray-700">{formatDate(guest.lastStay)}</span></p>
                            </div>
                            <p className="mt-4 text-sm font-medium text-amber-500">⭐ {guest.ratingByHost}/5</p>
                        </button>
                    ))}
                </div>
            </div>

            <Modal
                isOpen={Boolean(selectedGuest)}
                onClose={() => setSelectedId(null)}
                title={selectedGuest ? selectedGuest.name : ""}
                description="Thông tin khách lưu trú, lịch sử booking và ghi chú nội bộ."
                showCloseButton
                bodyClassName="p-6"
            >
                {selectedGuest ? (
                    <div className="space-y-6">
                        <div className="grid gap-4 rounded-2xl bg-gray-50 p-5 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-gray-500">Số điện thoại</p>
                                <p className="mt-1 font-medium text-gray-900">{maskPhone(selectedGuest.phone)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="mt-1 font-medium text-gray-900">{maskEmail(selectedGuest.email)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Ngày tham gia</p>
                                <p className="mt-1 font-medium text-gray-900">{formatDate(selectedGuest.joinedAt)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phân loại</p>
                                <p className="mt-1 font-medium text-gray-900">{guestTag[selectedGuest.segment]}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 text-lg font-semibold text-gray-900">Lịch sử lưu trú</h3>
                            <div className={tableClassName}>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            {["Mã đặt", "Chỗ nghỉ", "Ngày", "Tổng tiền", "Đánh giá"].map((column) => (
                                                <th key={column} className="px-4 py-3 font-medium">{column}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {stayHistory.map((booking) => (
                                            <tr key={booking.id}>
                                                <td className="px-4 py-4 font-medium text-gray-900">{booking.code}</td>
                                                <td className="px-4 py-4 text-gray-500">{properties.find((property) => property.id === booking.propertyId)?.name}</td>
                                                <td className="px-4 py-4 text-gray-500">{formatDate(booking.checkIn)}</td>
                                                <td className="px-4 py-4 text-gray-500">{formatCurrency(booking.totalAmount)}</td>
                                                <td className="px-4 py-4 text-amber-500">⭐ {selectedGuest.ratingByHost}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Ghi chú nội bộ</label>
                            <textarea
                                value={notes[selectedGuest.id] ?? ""}
                                onChange={(event) => setNotes((current) => ({ ...current, [selectedGuest.id]: event.target.value }))}
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

export default KhachLuuTru;
