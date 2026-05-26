import { useEffect, useMemo, useState } from "react";
import { getHostPayouts, getPayoutAccounts, type HostPayout, type PayoutAccount } from "../../../../services/payoutService";
import { PageHeader } from "../shared";
import { formatCurrency, formatDate, pageWrapperClass, tableClassName } from "../sharedStyles";

const payoutStatusLabel = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    processing: "Đang xử lý",
    paid: "Đã chuyển tiền",
    failed: "Thất bại",
    rejected: "Đã từ chối",
    cancelled: "Đã hủy",
};

const ThanhToan = () => {
    const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
    const [payouts, setPayouts] = useState<HostPayout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError("");

            try {
                const [accountResult, payoutResult] = await Promise.all([
                    getPayoutAccounts(),
                    getHostPayouts({ page: 1, limit: 50 }),
                ]);
                setAccounts(accountResult.items ?? []);
                setPayouts(payoutResult.items ?? []);
            } catch (fetchError) {
                setError(fetchError instanceof Error ? fetchError.message : "Không thể tải dữ liệu thanh toán.");
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, []);

    const totalPaid = useMemo(() => payouts.filter((payout) => payout.status === "paid").reduce((sum, payout) => sum + Number(payout.amount || 0), 0), [payouts]);
    const pending = useMemo(() => payouts.filter((payout) => payout.status !== "paid").reduce((sum, payout) => sum + Number(payout.amount || 0), 0), [payouts]);

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader title="Thanh toán & đối soát" subtitle="Các khoảng doanh thu của bạn." />

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

                <div className="grid gap-4 md:grid-cols-3">
                    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Tài khoản nhận tiền</p><p className="mt-2 text-3xl font-bold text-gray-900">{accounts.length}</p></article>
                    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Đã thanh toán</p><p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p></article>
                    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Chờ xử lý</p><p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(pending)}</p></article>
                </div>

                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">Tài khoản ngân hàng</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {accounts.length === 0 ? <p className="text-sm text-gray-500">Chưa có tài khoản nhận tiền.</p> : accounts.map((account) => (
                            <article key={account.payoutAccountId} className="rounded-2xl border border-gray-100 p-4">
                                <p className="font-semibold text-gray-900">{account.bankName}</p>
                                <p className="mt-1 text-sm text-gray-500">{account.accountName} • {account.accountNumberMasked}</p>
                                {account.isDefault ? <span className="mt-3 inline-block rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">Mặc định</span> : null}
                            </article>
                        ))}
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <table className={`${tableClassName} text-left text-sm`}>
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Mã payout</th>
                                <th className="px-4 py-3">Số tiền</th>
                                <th className="px-4 py-3">Trạng thái</th>
                                <th className="px-4 py-3">Mã chuyển khoản</th>
                                <th className="px-4 py-3">Ngày thanh toán</th>
                                <th className="px-4 py-3">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">Đang tải...</td></tr> : null}
                            {!loading && payouts.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">Chưa có payout.</td></tr> : null}
                            {payouts.map((payout) => (
                                <tr key={payout.payoutId}>
                                    <td className="px-4 py-4 font-semibold text-gray-900">#{payout.payoutId}</td>
                                    <td className="px-4 py-4 text-gray-600">{formatCurrency(Number(payout.amount || 0))}</td>
                                    <td className="px-4 py-4">
                                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                                            {payoutStatusLabel[payout.status] ?? payout.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {payout.transferReference || "Chưa có"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {payout.paidAt ? new Date(payout.paidAt).toLocaleString("vi-VN") : "Chưa thanh toán"}
                                    </td>
                                    <td className="px-4 py-4 text-gray-600">{formatDate(payout.createdAt.slice(0, 10))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
};

export default ThanhToan;
