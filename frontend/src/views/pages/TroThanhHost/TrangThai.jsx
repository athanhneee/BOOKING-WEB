import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { getMyHostApplication } from "../../../services/api/hostApplicationService";

const statusText = {
    pending: "Hồ sơ đang chờ Admin duyệt",
    approved: "Hồ sơ đã được duyệt",
    rejected: "Hồ sơ bị từ chối",
};

const TrangThaiHost = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadStatus = async () => {
            setLoading(true);
            setError("");
            try {
                const result = await getMyHostApplication();
                setData(result);
            } catch (fetchError) {
                setError(fetchError instanceof Error ? fetchError.message : "Không thể tải trạng thái host.");
            } finally {
                setLoading(false);
            }
        };
        void loadStatus();
    }, []);

    const status = data?.hostApplicationStatus ?? data?.status ?? data?.application?.status ?? null;

    return (
        <div className="bg-[#F7F8FA] px-4 py-12">
            <div className="mx-auto max-w-3xl rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Trạng thái host</p>
                <h1 className="mt-3 text-3xl font-bold text-gray-900">Theo dõi hồ sơ chủ nhà</h1>


                {loading ? <div className="mt-8 rounded-2xl bg-gray-50 p-6 text-center text-gray-500">Đang tải trạng thái...</div> : null}
                {error ? <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
                {!loading && !error ? (
                    <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-6">
                        <p className="text-sm text-gray-500">Trạng thái hiện tại</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{status ? statusText[status] ?? status : "Chưa gửi hồ sơ"}</p>
                        {data?.application?.rejectionReason ? <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Lý do từ chối: {data.application.rejectionReason}</p> : null}
                        {data?.application ? <div className="mt-5 text-sm text-gray-600"><p>Liên hệ: {data.application.contactPhone || "-"}</p><p>Địa chỉ: {data.application.businessAddress || "-"}</p></div> : null}
                    </div>
                ) : null}

                <div className="mt-8 flex flex-wrap gap-3">
                    {status === "approved" ? <Link to={APP_ROUTES.hostProperties} className="rounded-xl bg-cyan-500 px-5 py-2.5 font-medium text-white">Vào trang chủ nhà</Link> : <Link to={APP_ROUTES.hostRegister} className="rounded-xl bg-cyan-500 px-5 py-2.5 font-medium text-white">Gửi/Cập nhật hồ sơ</Link>}
                    <Link to={APP_ROUTES.home} className="rounded-xl border border-gray-200 px-5 py-2.5 text-gray-700">Về trang chủ</Link>
                </div>
            </div>
        </div>
    );
};

export default TrangThaiHost;
