import { useMemo, useState } from "react";
import { FiCalendar, FiEdit2, FiEye, FiEyeOff, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { properties as initialProperties, type Property } from "../../../../data/mockData.ts";
import { APP_ROUTES } from "../../../../config/routes";
import {
    FilterTabs,
    PageHeader,
} from "../shared";
import {
    formatCurrency,
    pageWrapperClass,
    primaryButtonClass,
    secondaryButtonClass,
} from "../sharedStyles";

type PropertyFilter = "all" | "Villa" | "Căn hộ" | "Homestay";

const filterOptions: Array<{ label: string; value: PropertyFilter }> = [
    { label: "Tất cả", value: "all" },
    { label: "Villa", value: "Villa" },
    { label: "Căn hộ", value: "Căn hộ" },
    { label: "Homestay", value: "Homestay" },
];

const statusStyles: Record<Property["status"], string> = {
    active: "bg-emerald-500 text-white",
    paused: "bg-gray-900/75 text-white",
};

const statusLabels: Record<Property["status"], string> = {
    active: "Đang hiển thị",
    paused: "Đang ẩn",
};

const ChoNghi = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<PropertyFilter>("all");
    const [properties, setProperties] = useState(initialProperties);
    const [dialogProperty, setDialogProperty] = useState<Property | null>(null);

    const filteredProperties = useMemo(
        () => properties.filter((item) => (filter === "all" ? true : item.type === filter)),
        [filter, properties],
    );

    const handleToggleVisibility = () => {
        if (!dialogProperty) {
            return;
        }

        setProperties((current) =>
            current.map((item) =>
                item.id === dialogProperty.id
                    ? { ...item, status: item.status === "active" ? "paused" : "active" }
                    : item,
            ),
        );
        setDialogProperty(null);
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader
                    title="Chỗ nghỉ của bạn"
                    subtitle="Quản lý toàn bộ danh sách chỗ nghỉ, hiệu suất và trạng thái hiển thị tại BlueStay."
                    actions={
                        <button
                            type="button"
                            onClick={() => navigate(APP_ROUTES.hostNewProperty)}
                            className={primaryButtonClass}
                        >
                            <span className="inline-flex items-center gap-2">
                                <FiPlus size={16} />
                                Thêm chỗ nghỉ
                            </span>
                        </button>
                    }
                />

                <FilterTabs options={filterOptions} value={filter} onChange={setFilter} underline />

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProperties.map((property) => {
                        const isActive = property.status === "active";

                        return (
                            <article key={property.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                                <div className="relative">
                                    <img
                                        src={property.image}
                                        alt={property.name}
                                        className="aspect-video w-full rounded-t-2xl object-cover"
                                    />
                                    <span
                                        className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[property.status]}`}
                                    >
                                        {statusLabels[property.status]}
                                    </span>
                                </div>

                                <div className="space-y-4 p-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">{property.name}</h2>
                                        <div className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                            {property.type}
                                        </div>
                                        <p className="mt-2 text-sm text-gray-500">{property.address}</p>
                                    </div>

                                    <p className="text-sm text-gray-600">
                                        ⭐ {property.rating} · {property.occupancy}% lấp đầy · {formatCurrency(property.revenueMonth)}/tháng
                                    </p>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <button
                                            type="button"
                                            onClick={() => navigate(APP_ROUTES.hostNewProperty)}
                                            className={secondaryButtonClass}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <FiEdit2 size={15} />
                                                Chỉnh sửa
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => navigate(APP_ROUTES.hostCalendar)}
                                            className={secondaryButtonClass}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <FiCalendar size={15} />
                                                Xem lịch
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setDialogProperty(property)}
                                            className={secondaryButtonClass}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                {isActive ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                                                {isActive ? "Ẩn" : "Hiện"}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>

            <ConfirmDialog
                isOpen={Boolean(dialogProperty)}
                onClose={() => setDialogProperty(null)}
                onConfirm={handleToggleVisibility}
                title={dialogProperty?.status === "active" ? "Ẩn chỗ nghỉ này?" : "Hiện lại chỗ nghỉ này?"}
                description={
                    dialogProperty?.status === "active"
                        ? "Chỗ nghỉ sẽ tạm thời không hiển thị với khách trên BlueStay."
                        : "Chỗ nghỉ sẽ hiển thị trở lại và có thể nhận đặt phòng mới."
                }
                confirmLabel={dialogProperty?.status === "active" ? "Ẩn chỗ nghỉ" : "Hiện chỗ nghỉ"}
            />
        </div>
    );
};

export default ChoNghi;
