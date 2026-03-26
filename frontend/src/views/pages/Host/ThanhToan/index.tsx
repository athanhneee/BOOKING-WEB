import { useMemo, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiClock, FiDownload, FiTrendingUp } from "react-icons/fi";
import { properties, transactions } from "../../../../data/mockData.ts";
import Badge from "../../../components/ui/Badge";
import {
    PageHeader,
    StatCard,
} from "../shared";
import {
    downloadTextFile,
    formatCurrency,
    formatDate,
    hostCardClass,
    inputClassName,
    pageWrapperClass,
    primaryButtonClass,
    tableClassName,
} from "../sharedStyles";

const ThanhToan = () => {
    const [month, setMonth] = useState("2026-03");
    const [status, setStatus] = useState("all");
    const [propertyId, setPropertyId] = useState("all");

    const filteredTransactions = useMemo(
        () =>
            transactions.filter((transaction) => {
                const matchesMonth = transaction.bookedAt.startsWith(month);
                const matchesStatus = status === "all" || transaction.status === status;
                const matchesProperty = propertyId === "all" || transaction.propertyId === propertyId;
                return matchesMonth && matchesStatus && matchesProperty;
            }),
        [month, propertyId, status],
    );

    const totals = {
        month: filteredTransactions.reduce((sum, item) => sum + item.amount, 0),
        paid: filteredTransactions.filter((item) => item.status === "da-tt").reduce((sum, item) => sum + item.amount, 0),
        waiting: filteredTransactions.filter((item) => item.status === "cho-tt" || item.status === "coc-50").reduce((sum, item) => sum + item.amount, 0),
        overdue: filteredTransactions.filter((item) => item.status === "qua-han").reduce((sum, item) => sum + item.amount, 0),
    };

    const exportReport = () => {
        const rows = [
            "Ma giao dich,Khach,Cho nghi,Ngay dat,Ngay thanh toan,So tien,Trang thai",
            ...filteredTransactions.map((transaction) =>
                [
                    transaction.id,
                    transaction.guestName,
                    transaction.propertyName,
                    transaction.bookedAt,
                    transaction.paidAt ?? "",
                    transaction.amount,
                    transaction.status,
                ].join(","),
            ),
        ];
        downloadTextFile("thanh-toan.csv", rows.join("\n"), "text/csv;charset=utf-8");
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader
                    title="Thanh toán"
                    subtitle="Quản lý doanh thu, đối soát giao dịch và theo dõi các khoản còn chờ xác nhận."
                    actions={
                        <button type="button" onClick={exportReport} className={primaryButtonClass}>
                            <span className="inline-flex items-center gap-2">
                                <FiDownload size={16} />
                                Xuất báo cáo
                            </span>
                        </button>
                    }
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Doanh thu tháng này" value={formatCurrency(totals.month)} icon={<FiTrendingUp size={18} />} />
                    <StatCard label="Đã thanh toán" value={formatCurrency(totals.paid)} icon={<FiCheckCircle size={18} />} accentClassName="bg-emerald-50 text-emerald-600" />
                    <StatCard label="Chờ thanh toán" value={formatCurrency(totals.waiting)} icon={<FiClock size={18} />} accentClassName="bg-amber-50 text-amber-600" />
                    <StatCard label="Quá hạn" value={formatCurrency(totals.overdue)} icon={<FiAlertCircle size={18} />} accentClassName="bg-rose-50 text-rose-600" />
                </div>

                <div className={`${hostCardClass} space-y-4`}>
                    <div className="grid gap-4 lg:grid-cols-[180px_220px_220px]">
                        <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={inputClassName} />
                        <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClassName}>
                            <option value="all">Tất cả trạng thái</option>
                            <option value="da-tt">Đã thanh toán</option>
                            <option value="coc-50">Cọc 50%</option>
                            <option value="cho-tt">Chờ thanh toán</option>
                            <option value="qua-han">Quá hạn</option>
                        </select>
                        <select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className={inputClassName}>
                            <option value="all">Tất cả chỗ nghỉ</option>
                            {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
                        </select>
                    </div>

                    <div className={tableClassName}>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    {["Mã giao dịch", "Khách", "Chỗ nghỉ", "Ngày đặt", "Ngày thanh toán", "Số tiền", "Trạng thái"].map((column) => (
                                        <th key={column} className="px-4 py-3 font-medium">{column}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredTransactions.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td className="px-4 py-4 font-medium text-gray-900">{transaction.id}</td>
                                        <td className="px-4 py-4 text-gray-500">{transaction.guestName}</td>
                                        <td className="px-4 py-4 text-gray-500">{transaction.propertyName}</td>
                                        <td className="px-4 py-4 text-gray-500">{formatDate(transaction.bookedAt)}</td>
                                        <td className="px-4 py-4 text-gray-500">{transaction.paidAt ? formatDate(transaction.paidAt) : "Chưa thanh toán"}</td>
                                        <td className="px-4 py-4 font-medium text-gray-900">{formatCurrency(transaction.amount)}</td>
                                        <td className="px-4 py-4"><Badge status={transaction.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThanhToan;
