import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import * as L from "leaflet";
import type { LatLngExpression, Marker as LeafletMarker } from "leaflet";
import { MapPin, Sparkles } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { useNavigate, useSearchParams } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { APP_ROUTES } from "../../../../config/routes";
import {
    VUNG_TAU_DEFAULT_COORDINATES,
    clampLatLngToVungTauBounds,
    isLatLngInVungTauBounds,
} from "../../../../data/vungTauLocationGroups";
import { VUNG_TAU_WARDS } from "../../../../data/vungTauWards";
import {
    VUNG_TAU_LEAFLET_BOUNDS,
    VUNG_TAU_MIN_MAP_ZOOM,
    VungTauMapBoundsLimiter,
} from "../../../components/maps/VungTauMapBounds";
import {
    addHostListingImages,
    createHostListing,
    getHostListingDetail,
    setHostListingImageCover,
    updateHostListing,
    type CreateHostListingPayload,
    type HostListingDetail,
    type UpdateHostListingPayload,
} from "../../../../services/hostService";
import {
    analyzeListingImage,
    analyzeListingImages,
    deleteHostImage,
    getListingImageAnalysis,
    updateListingImageTags,
    type ImageAiTag,
    type ImageTagTaxonomy,
    type ListingImageAiResult,
} from "../../../../services/api/listingImageAiService";
import { uploadFileToR2 } from "../../../../services/api/uploadsApi";
import { PageHeader } from "../shared";
import {
    inputClassName,
    labelClassName,
    pageWrapperClass,
    primaryButtonClass,
    secondaryButtonClass,
    textareaClassName,
} from "../sharedStyles";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const VUNG_TAU_CITY = "Vũng Tàu";
const DEFAULT_VUNG_TAU_COORDINATES = {
    latitude: VUNG_TAU_DEFAULT_COORDINATES.latitude,
    longitude: VUNG_TAU_DEFAULT_COORDINATES.longitude,
};
const locationSelectionError = "Vui lòng chọn phường/xã và kéo ghim trên bản đồ đến đúng vị trí chỗ nghỉ.";

type Coordinates = {
    latitude: number;
    longitude: number;
};

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
    surchargeAmount: string;
    serviceFeePct: string;
    minNights: string;
    maxNights: string;
    checkInFrom: string;
    checkOutBefore: string;
    cancellationPolicy: CreateHostListingPayload["cancellationPolicy"];
    instantBookEnabled: boolean;
    status: "draft" | "pending_approval";
};

type SelectedImage = {
    id: string;
    file: File;
    previewUrl: string;
    status: "queued" | "uploading" | "analyzing" | "success" | "tagged" | "analysis_failed" | "failed";
    error?: string;
};

type ExistingListingImage = {
    imageId: number;
    listingId?: number;
    url: string;
    key?: string | null;
    objectKey?: string | null;
    caption?: string | null;

    displayTitle?: string | null;
    display_title?: string | null;

    altText?: string | null;
    alt_text?: string | null;

    aiDisplayTitle?: string | null;

    aiImageType?: string | null;
    ai_image_type?: string | null;

    aiDescription?: string | null;
    ai_description?: string | null;

    aiSceneTags?: string[];
    ai_scene_tags?: string[];

    aiAmenityTags?: string[];
    ai_amenity_tags?: string[];

    aiAnalysisStatus?: "pending" | "analyzed" | "failed";
    ai_analysis_status?: "pending" | "analyzed" | "failed";

    aiErrorMessage?: string | null;
    ai_error_message?: string | null;

    aiAnalyzedAt?: string | null;
    ai_analyzed_at?: string | null;

    tags?: ImageAiTag[];
    aiTags?: ImageAiTag[];
    analysis?: ListingImageAiResult["analysis"];

    sortOrder: number;
    isCover?: boolean;
};
const initialForm: FormState = {
    title: "",
    description: "",
    addressLine: "",
    ward: "",
    district: VUNG_TAU_CITY,
    city: VUNG_TAU_CITY,
    latitude: String(DEFAULT_VUNG_TAU_COORDINATES.latitude),
    longitude: String(DEFAULT_VUNG_TAU_COORDINATES.longitude),
    propertyType: "villa",
    roomType: "entire_place",
    maxGuests: "8",
    bedrooms: "4",
    beds: "4",
    bathrooms: "4",
    basePrice: "3000000",
    weekendPrice: "3000000",
    cleaningFee: "0",
    surchargeAmount: "0",
    serviceFeePct: "10",
    minNights: "1",
    maxNights: "14",
    checkInFrom: "14:00",
    checkOutBefore: "12:00",
    cancellationPolicy: "moderate",
    instantBookEnabled: false,
    status: "pending_approval",
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2);
    const minute = index % 2 === 0 ? "00" : "30";

    return `${String(hour).padStart(2, "0")}:${minute}`;
});

const onlyDigits = (value: string) => value.replace(/[^\d]/g, "");

const onlyDecimalNumber = (value: string) => {
    const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
    const parts = normalized.split(".");

    if (parts.length <= 1) {
        return parts[0];
    }

    return `${parts[0]}.${parts.slice(1).join("")}`;
};

const preventInvalidNumberKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-", " "].includes(event.key)) {
        event.preventDefault();
    }
};

const preventInvalidIntegerKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-", ".", ",", " "].includes(event.key)) {
        event.preventDefault();
    }
};

const maxImageFiles = 30;
const maxImageFileSize = 5 * 1024 * 1024;
const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const aiImageTypeTitleMap: Record<string, string> = {
    bedroom: "Phòng ngủ",
    living_room: "Phòng khách",
    kitchen: "Nhà bếp",
    bathroom: "Phòng tắm",
    pool: "Hồ bơi",
    balcony: "Ban công",
    garden: "Sân vườn",
    rooftop: "Sân thượng",
    parking: "Chỗ đậu xe",
    bbq_area: "Khu BBQ",
    dining_area: "Khu vực ăn uống",
    front_view: "Mặt tiền villa",
    outdoor_area: "Không gian ngoài trời",
    hallway: "Hành lang",
    stairs: "Cầu thang",
    sea_view: "View biển",
    city_view: "View thành phố",
    other: "Ảnh chỗ nghỉ",
};

const defaultImageTagTaxonomies: ImageTagTaxonomy[] = [
    { code: "bedroom", labelVi: "phòng ngủ", group: "room", aliases: ["phong ngu"], isSearchable: true },
    { code: "double_bed", labelVi: "giường đôi", group: "object", aliases: ["giuong doi"], isSearchable: true },
    { code: "pool", labelVi: "hồ bơi", group: "amenity", aliases: ["ho boi"], isSearchable: true },
    { code: "garden", labelVi: "sân vườn", group: "amenity", aliases: ["san vuon"], isSearchable: true },
    { code: "bbq", labelVi: "BBQ", group: "amenity", aliases: ["barbecue"], isSearchable: true },
    { code: "kitchen", labelVi: "bếp", group: "room", aliases: ["bep"], isSearchable: true },
    { code: "living_room", labelVi: "phòng khách", group: "room", aliases: ["phong khach"], isSearchable: true },
    { code: "toilet", labelVi: "toilet", group: "room", aliases: ["bathroom", "wc"], isSearchable: true },
    { code: "bathtub", labelVi: "bồn tắm", group: "object", aliases: ["bon tam"], isSearchable: true },
    { code: "balcony", labelVi: "ban công", group: "amenity", aliases: ["ban cong"], isSearchable: true },
    { code: "sea_view", labelVi: "view biển", group: "view", aliases: ["view bien"], isSearchable: true },
    { code: "karaoke", labelVi: "karaoke", group: "amenity", aliases: ["phong karaoke"], isSearchable: true },
    { code: "billiards", labelVi: "bàn bida", group: "amenity", aliases: ["ban bida"], isSearchable: true },
    { code: "front_view", labelVi: "mặt tiền", group: "exterior", aliases: ["mat tien"], isSearchable: true },
    { code: "garage", labelVi: "gara", group: "amenity", aliases: ["nha xe"], isSearchable: true },
    { code: "air_conditioner", labelVi: "máy lạnh", group: "amenity", aliases: ["may lanh", "dieu hoa"], isSearchable: true },
    { code: "sofa", labelVi: "sofa", group: "object", aliases: ["ghe sofa"], isSearchable: true },
    { code: "dining_table", labelVi: "bàn ăn", group: "object", aliases: ["ban an"], isSearchable: true },
    { code: "modern", labelVi: "hiện đại", group: "style", aliases: ["hien dai"], isSearchable: true },
    { code: "luxury", labelVi: "sang trọng", group: "style", aliases: ["sang trong"], isSearchable: true },
    { code: "family_friendly", labelVi: "phù hợp gia đình", group: "quality", aliases: ["gia dinh"], isSearchable: true },
    { code: "large_group_friendly", labelVi: "phù hợp nhóm đông người", group: "quality", aliases: ["nhom dong nguoi"], isSearchable: true },
];

const buildExistingImageLabel = (image: ExistingListingImage, index: number) => {
    const directTitle = image.displayTitle ?? image.display_title ?? image.aiDisplayTitle;

    if (directTitle?.trim()) {
        return directTitle.trim();
    }

    const imageType = image.aiImageType ?? image.ai_image_type;

    if (imageType && aiImageTypeTitleMap[imageType]) {
        return aiImageTypeTitleMap[imageType];
    }

    const description = image.aiDescription ?? image.ai_description ?? image.altText ?? image.alt_text ?? image.caption;

    if (description?.trim()) {
        return description.trim().length > 42 ? `${description.trim().slice(0, 41)}…` : description.trim();
    }

    return `Ảnh chỗ nghỉ ${index + 1}`;
};

const mapHostListingImageToExisting = (image: HostListingDetail["images"][number] | ListingImageAiResult): ExistingListingImage => {
    const rawImage = image as HostListingDetail["images"][number] & Partial<ListingImageAiResult>;

    return {
        imageId: rawImage.imageId,
        listingId: rawImage.listingId,
        url: rawImage.url,
        key: rawImage.key,
        objectKey: rawImage.objectKey,
        caption: rawImage.caption,

        displayTitle: rawImage.displayTitle,
        display_title: rawImage.display_title,

        altText: rawImage.altText,
        alt_text: rawImage.alt_text,

        aiDisplayTitle: rawImage.aiDisplayTitle,

        aiImageType: rawImage.aiImageType,
        ai_image_type: rawImage.ai_image_type,

        aiDescription: rawImage.aiDescription,
        ai_description: rawImage.ai_description,
        aiSceneTags: rawImage.aiSceneTags,
        ai_scene_tags: rawImage.ai_scene_tags,
        aiAmenityTags: rawImage.aiAmenityTags,
        ai_amenity_tags: rawImage.ai_amenity_tags,

        aiAnalysisStatus: rawImage.aiAnalysisStatus,
        ai_analysis_status: rawImage.ai_analysis_status,
        aiErrorMessage: rawImage.aiErrorMessage,
        ai_error_message: rawImage.ai_error_message,
        aiAnalyzedAt: rawImage.aiAnalyzedAt,
        ai_analyzed_at: rawImage.ai_analyzed_at,
        tags: rawImage.tags,
        aiTags: rawImage.aiTags,
        analysis: rawImage.analysis,

        sortOrder: rawImage.sortOrder ?? rawImage.sort_order ?? 0,
        isCover: rawImage.isCover,
    };
};

const normalizeTagText = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

const resolveTaxonomy = (taxonomies: ImageTagTaxonomy[], value: string) => {
    const normalizedValue = normalizeTagText(value);

    return taxonomies.find((taxonomy) => {
        const aliases = [taxonomy.code, taxonomy.labelVi, ...taxonomy.aliases].map(normalizeTagText);
        return aliases.includes(normalizedValue);
    });
};

const buildFallbackTag = (taxonomies: ImageTagTaxonomy[], value: string): ImageAiTag | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const taxonomy = resolveTaxonomy(taxonomies, trimmed);
    return {
        tag: taxonomy?.code ?? trimmed,
        code: taxonomy?.code ?? trimmed,
        labelVi: taxonomy?.labelVi ?? trimmed,
        tagGroup: taxonomy?.group ?? "custom",
        confidence: null,
        source: "ai",
    };
};

const getImageTags = (image: ExistingListingImage, taxonomies: ImageTagTaxonomy[]) => {
    const directTags = image.tags?.length ? image.tags : image.aiTags;

    if (directTags?.length) {
        return directTags.map((tag) => ({
            ...tag,
            tag: tag.code ?? tag.tag,
            labelVi: tag.labelVi || tag.tag,
        }));
    }

    const legacyTags = [
        ...(image.aiSceneTags ?? image.ai_scene_tags ?? []),
        ...(image.aiAmenityTags ?? image.ai_amenity_tags ?? []),
    ];
    const tags = legacyTags
        .map((tag) => buildFallbackTag(taxonomies, tag))
        .filter((tag): tag is ImageAiTag => Boolean(tag));
    const seen = new Set<string>();

    return tags.filter((tag) => {
        const key = tag.tag;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const getSelectedImageStatusText = (status: SelectedImage["status"]) => {
    if (status === "uploading") return "Đang tải ảnh";
    if (status === "analyzing") return "Đang phân tích ảnh bằng AI";
    if (status === "tagged") return "Đã gắn tag";
    if (status === "analysis_failed") return "Phân tích lỗi, thử lại";
    if (status === "success") return "Upload thành công";
    if (status === "failed") return "Upload thất bại";
    return "Chờ upload";
};

const getSelectedImageStatusClass = (status: SelectedImage["status"]) => {
    if (status === "tagged" || status === "success") return "font-semibold text-emerald-600";
    if (status === "failed" || status === "analysis_failed") return "font-semibold text-rose-600";
    if (status === "uploading" || status === "analyzing") return "font-semibold text-cyan-600";
    return "text-gray-500";
};

const getExistingImageAnalysisStatus = (image: ExistingListingImage, tags: ImageAiTag[]) => {
    const status = image.aiAnalysisStatus ?? image.ai_analysis_status ?? image.analysis?.status;

    if (status === "failed") return { label: "Phân tích lỗi, thử lại", className: "text-rose-600" };
    if (status === "pending") return { label: "Chưa phân tích AI", className: "text-gray-500" };
    if (status === "analyzed" && tags.length > 0) return { label: "Đã gắn tag", className: "text-emerald-600" };
    if (status === "analyzed") return { label: "AI không thấy tag rõ", className: "text-gray-500" };
    return { label: "Chưa phân tích AI", className: "text-gray-500" };
};
const normalizeDecimalInput = (value: string) => value.trim().replace(",", ".");
const coordinateToInputValue = (value: number) => Number(value.toFixed(6)).toString();
const toNumber = (value: string, fallback = 0) => {
    const parsed = Number(normalizeDecimalInput(value || String(fallback)));
    return Number.isFinite(parsed) ? parsed : fallback;
};
const toNullableNumber = (value: string) => {
    const normalized = normalizeDecimalInput(value);
    return normalized ? Number(normalized) : null;
};
const toCoordinateNumber = (value: string) => Number(normalizeDecimalInput(value));
const getFormCoordinates = (value: Pick<FormState, "latitude" | "longitude">): Coordinates | null => {
    const latitude = toCoordinateNumber(value.latitude);
    const longitude = toCoordinateNumber(value.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    return { latitude, longitude };
};
const isCoordinatesInVungTauBounds = (position: Coordinates) =>
    isLatLngInVungTauBounds({ lat: position.latitude, lng: position.longitude });
const clampCoordinatesToVungTauBounds = (position: Coordinates): Coordinates => {
    const boundedPosition = clampLatLngToVungTauBounds({
        lat: position.latitude,
        lng: position.longitude,
    });

    return {
        latitude: boundedPosition.lat,
        longitude: boundedPosition.lng,
    };
};
const getLocationValidationError = (value: Pick<FormState, "addressLine" | "ward" | "latitude" | "longitude">) => {
    if (!value.addressLine.trim()) {
        return "Vui lòng nhập địa chỉ chỗ nghỉ.";
    }

    const coordinates = getFormCoordinates(value);

    if (!value.ward.trim() || !coordinates) {
        return locationSelectionError;
    }

    if (!isCoordinatesInVungTauBounds(coordinates)) {
        return "Vị trí chỗ nghỉ phải nằm trong khu vực Vũng Tàu.";
    }

    return "";
};
const toInputValue = (value: unknown) => (value === null || value === undefined ? "" : String(value));
const createSelectedImageId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isValidImageFile = (file: File) => acceptedImageTypes.has(file.type) && file.size <= maxImageFileSize;
const buildFormFromDetail = (detail: HostListingDetail): FormState => ({
    title: detail.title ?? "",
    description: detail.description ?? "",
    addressLine: detail.addressLine ?? detail.addressSummary?.addressLine ?? "",
    ward: detail.ward ?? detail.addressSummary?.ward ?? "",
    district: detail.district ?? detail.addressSummary?.district ?? VUNG_TAU_CITY,
    city: VUNG_TAU_CITY,
    latitude: toInputValue(detail.latitude) || String(DEFAULT_VUNG_TAU_COORDINATES.latitude),
    longitude: toInputValue(detail.longitude) || String(DEFAULT_VUNG_TAU_COORDINATES.longitude),
    propertyType: detail.propertyType ?? "villa",
    roomType: detail.roomType ?? "entire_place",
    maxGuests: toInputValue(detail.maxGuests),
    bedrooms: toInputValue(detail.bedrooms),
    beds: toInputValue(detail.beds),
    bathrooms: toInputValue(detail.bathrooms),
    basePrice: toInputValue(detail.basePrice),
    weekendPrice: toInputValue(detail.weekendPrice ?? detail.basePrice),
    cleaningFee: toInputValue(detail.cleaningFee),
    surchargeAmount: toInputValue((detail as HostListingDetail & { surchargeAmount?: number | null }).surchargeAmount),
    serviceFeePct: toInputValue(detail.serviceFeePct),
    minNights: toInputValue(detail.minNights),
    maxNights: toInputValue(detail.maxNights),
    checkInFrom: detail.checkInFrom ?? "14:00",
    checkOutBefore: detail.checkOutBefore ?? "12:00",
    cancellationPolicy: detail.cancellationPolicy ?? "moderate",
    instantBookEnabled: Boolean(detail.instantBookEnabled),
    status: detail.status === "draft" ? "draft" : "pending_approval",
});

const MapViewUpdater = ({ position }: { position: Coordinates }) => {
    const map = useMap();

    useEffect(() => {
        map.setView([position.latitude, position.longitude], 14, { animate: true });
    }, [map, position.latitude, position.longitude]);

    return null;
};

const ListingLocationMap = ({
    position,
    onPositionChange,
}: {
    position: Coordinates;
    onPositionChange: (position: Coordinates) => void;
}) => {
    const markerRef = useRef<LeafletMarker | null>(null);
    const boundedPosition = useMemo(
        () => clampCoordinatesToVungTauBounds(position),
        [position],
    );
    const markerPosition = useMemo<LatLngExpression>(
        () => [boundedPosition.latitude, boundedPosition.longitude],
        [boundedPosition.latitude, boundedPosition.longitude],
    );
    const eventHandlers = useMemo(
        () => ({
            dragend: () => {
                const marker = markerRef.current;

                if (!marker) {
                    return;
                }

                const nextPosition = marker.getLatLng();
                onPositionChange(clampCoordinatesToVungTauBounds({
                    latitude: nextPosition.lat,
                    longitude: nextPosition.lng,
                }));
            },
        }),
        [onPositionChange],
    );

    useEffect(() => {
        if (isCoordinatesInVungTauBounds(position)) {
            return;
        }

        onPositionChange(boundedPosition);
    }, [boundedPosition, onPositionChange, position]);

    return (
        <MapContainer
            center={markerPosition}
            zoom={13}
            minZoom={VUNG_TAU_MIN_MAP_ZOOM}
            maxBounds={VUNG_TAU_LEAFLET_BOUNDS}
            maxBoundsViscosity={1}
            scrollWheelZoom
            className="h-full w-full"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                bounds={VUNG_TAU_LEAFLET_BOUNDS}
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <VungTauMapBoundsLimiter />
            <MapViewUpdater position={boundedPosition} />
            <Marker
                draggable
                eventHandlers={eventHandlers}
                position={markerPosition}
                ref={markerRef}
            />
        </MapContainer>
    );
};

const ThemChoNghi = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState<FormState>(initialForm);
    const [weekendPriceChanged, setWeekendPriceChanged] = useState(false);
    const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
    const [existingImages, setExistingImages] = useState<ExistingListingImage[]>([]);
    const [tagTaxonomies, setTagTaxonomies] = useState<ImageTagTaxonomy[]>(defaultImageTagTaxonomies);
    const [analyzingImageIds, setAnalyzingImageIds] = useState<Set<number>>(() => new Set());
    const [savingTagImageIds, setSavingTagImageIds] = useState<Set<number>>(() => new Set());
    const [saving, setSaving] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [aiMessage, setAiMessage] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const imageInputRef = useRef<HTMLInputElement>(null);
    const selectedImagesRef = useRef<SelectedImage[]>([]);

    const listingIdForEdit = searchParams.get("listingId");
    const isEditMode = Boolean(listingIdForEdit);

    useEffect(() => {
        selectedImagesRef.current = selectedImages;
    }, [selectedImages]);

    const refreshExistingImages = async (listingId: string | number) => {
        const analysis = await getListingImageAnalysis(listingId);
        setTagTaxonomies(analysis.tagTaxonomies.length ? analysis.tagTaxonomies : defaultImageTagTaxonomies);
        setExistingImages((analysis.images ?? []).map(mapHostListingImageToExisting));
        return analysis;
    };

    useEffect(() => {
        return () => {
            selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        };
    }, []);

    useEffect(() => {
        if (!listingIdForEdit) {
            setExistingImages([]);
            setTagTaxonomies(defaultImageTagTaxonomies);
            setWeekendPriceChanged(false);
            setForm(initialForm);
            return;
        }

        let ignore = false;

        const loadListing = async () => {
            setLoadingDetail(true);
            setError("");

            try {
                const detail = await getHostListingDetail(listingIdForEdit);

                if (ignore) return;

                const nextForm = buildFormFromDetail(detail);

                setForm(nextForm);
                setWeekendPriceChanged(
                    detail.weekendPrice !== null &&
                    detail.weekendPrice !== undefined &&
                    String(detail.weekendPrice) !== String(detail.basePrice ?? ""),
                );
                setExistingImages((detail.images ?? []).map(mapHostListingImageToExisting));
                try {
                    await refreshExistingImages(listingIdForEdit);
                } catch {
                    setTagTaxonomies(defaultImageTagTaxonomies);
                }
            } catch (loadError) {
                if (!ignore) {
                    setError(loadError instanceof Error ? loadError.message : "Không thể tải chỗ nghỉ để sửa.");
                }
            } finally {
                if (!ignore) {
                    setLoadingDetail(false);
                }
            }
        };

        void loadListing();

        return () => {
            ignore = true;
        };
    }, [listingIdForEdit]);

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const setIntegerField = <K extends keyof FormState>(key: K, rawValue: string) => {
        setForm((current) => ({
            ...current,
            [key]: onlyDigits(rawValue) as FormState[K],
        }));
    };

    const setDecimalField = <K extends keyof FormState>(key: K, rawValue: string) => {
        setForm((current) => ({
            ...current,
            [key]: onlyDecimalNumber(rawValue) as FormState[K],
        }));
    };

    const handleBasePriceChange = (rawValue: string) => {
        const nextBasePrice = onlyDigits(rawValue);

        setForm((current) => ({
            ...current,
            basePrice: nextBasePrice,
            weekendPrice: weekendPriceChanged ? current.weekendPrice : nextBasePrice,
        }));
    };

    const handleWeekendPriceChange = (rawValue: string) => {
        const nextWeekendPrice = onlyDigits(rawValue);

        setWeekendPriceChanged(
            nextWeekendPrice.trim().length > 0 && nextWeekendPrice !== form.basePrice,
        );

        setForm((current) => ({
            ...current,
            weekendPrice: nextWeekendPrice || current.basePrice,
        }));
    };

    const validateNumberFields = () => {
        const maxGuests = toNumber(form.maxGuests, 0);
        const bedrooms = toNumber(form.bedrooms, -1);
        const beds = toNumber(form.beds, 0);
        const bathrooms = toNumber(form.bathrooms, 0);
        const basePrice = toNumber(form.basePrice, 0);
        const weekendPrice = toNumber(form.weekendPrice || form.basePrice, 0);
        const cleaningFee = toNumber(form.cleaningFee, 0);
        const minNights = toNumber(form.minNights, 0);
        const maxNights = toNullableNumber(form.maxNights);

        if (maxGuests < 1) return "Khách tối đa phải lớn hơn hoặc bằng 1.";
        if (bedrooms < 0) return "Số phòng ngủ không được nhỏ hơn 0.";
        if (beds < 1) return "Số giường phải lớn hơn hoặc bằng 1.";
        if (bathrooms <= 0) return "Số WC phải lớn hơn 0.";
        if (basePrice <= 0) return "Giá cơ bản phải lớn hơn 0.";
        if (weekendPrice <= 0) return "Giá cuối tuần phải lớn hơn 0.";
        if (cleaningFee < 0) return "Phí dọn dẹp không được nhỏ hơn 0.";
        if (toNumber(form.surchargeAmount, 0) < 0) return "Phụ thu không được nhỏ hơn 0.";
        if (minNights < 1) return "Số đêm tối thiểu phải lớn hơn hoặc bằng 1.";

        if (maxNights !== null && maxNights < minNights) {
            return "Số đêm tối đa phải lớn hơn hoặc bằng số đêm tối thiểu.";
        }

        return "";
    };

    const handleWardChange = (wardName: string) => {
        const selectedWard = VUNG_TAU_WARDS.find((ward) => ward.name === wardName);

        setForm((current) => ({
            ...current,
            ward: wardName,
            district: VUNG_TAU_CITY,
            city: VUNG_TAU_CITY,
            latitude: selectedWard ? coordinateToInputValue(selectedWard.latitude) : current.latitude,
            longitude: selectedWard ? coordinateToInputValue(selectedWard.longitude) : current.longitude,
        }));
    };

    const handleMapPositionChange = (position: Coordinates) => {
        setForm((current) => ({
            ...current,
            district: VUNG_TAU_CITY,
            city: VUNG_TAU_CITY,
            latitude: coordinateToInputValue(position.latitude),
            longitude: coordinateToInputValue(position.longitude),
        }));
    };

    const clearSelectedImages = () => {
        setSelectedImages((current) => {
            current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
            return [];
        });

        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const handleImageChange = (files: FileList | null) => {
        setError("");
        setSuccess("");
        setUploadMessage("");

        const filesToAdd = Array.from(files ?? []);

        if (filesToAdd.length === 0) {
            return;
        }

        if (existingImages.length + selectedImages.length + filesToAdd.length > maxImageFiles) {
            setError(`Chỉ được lưu tối đa ${maxImageFiles} ảnh cho một chỗ nghỉ.`);
            if (imageInputRef.current) imageInputRef.current.value = "";
            return;
        }

        const invalidFile = filesToAdd.find((file) => !isValidImageFile(file));

        if (invalidFile) {
            setError("Chỉ hỗ trợ JPG, PNG, WebP, GIF và mỗi ảnh tối đa 5MB.");
            if (imageInputRef.current) imageInputRef.current.value = "";
            return;
        }

        const nextImages = filesToAdd.map<SelectedImage>((file) => ({
            id: createSelectedImageId(),
            file,
            previewUrl: URL.createObjectURL(file),
            status: "queued",
        }));

        setSelectedImages((current) => [...current, ...nextImages]);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const removeSelectedImage = (id: string) => {
        setSelectedImages((current) => {
            const image = current.find((item) => item.id === id);
            if (image) URL.revokeObjectURL(image.previewUrl);
            return current.filter((item) => item.id !== id);
        });
    };

    const resetForm = () => {
        setForm(initialForm);
        setWeekendPriceChanged(false);
        setExistingImages([]);
        clearSelectedImages();
    };

    const buildCreatePayload = (): CreateHostListingPayload => ({
        title: form.title.trim(),
        description: form.description.trim(),
        addressLine: form.addressLine.trim(),
        ward: form.ward.trim(),
        district: VUNG_TAU_CITY,
        city: VUNG_TAU_CITY,
        stateRegion: null,
        country: "VN",
        postalCode: null,
        latitude: toCoordinateNumber(form.latitude),
        longitude: toCoordinateNumber(form.longitude),
        propertyType: form.propertyType,
        roomType: form.roomType,
        maxGuests: toNumber(form.maxGuests, 1),
        bedrooms: toNumber(form.bedrooms, 0),
        beds: toNumber(form.beds, 1),
        bathrooms: toNumber(form.bathrooms, 1),
        basePrice: toNumber(form.basePrice, 0),
        weekendPrice: toNumber(form.weekendPrice || form.basePrice, 0),
        cleaningFee: toNumber(form.cleaningFee, 0),
        surchargeAmount: toNumber(form.surchargeAmount, 0),
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

    const buildUpdatePayload = (): UpdateHostListingPayload => {
        const payload = buildCreatePayload() as Partial<CreateHostListingPayload>;
        delete payload.amenityIds;
        delete payload.status;
        return payload as UpdateHostListingPayload;
    };

    const setImageUploadState = (id: string, values: Partial<SelectedImage>) => {
        setSelectedImages((current) =>
            current.map((image) => (image.id === id ? { ...image, ...values } : image)),
        );
    };

    const mergeExistingImage = (updatedImage: ListingImageAiResult) => {
        const mappedImage = mapHostListingImageToExisting(updatedImage);

        setExistingImages((current) => {
            const exists = current.some((image) => image.imageId === mappedImage.imageId);
            if (!exists) {
                return [...current, mappedImage].sort((left, right) => left.sortOrder - right.sortOrder);
            }

            return current.map((image) =>
                image.imageId === mappedImage.imageId
                    ? { ...image, ...mappedImage, isCover: mappedImage.isCover ?? image.isCover }
                    : image,
            );
        });
    };

    const uploadSelectedImagesForListing = async (
        listingId: string | number,
        imagesToUpload: SelectedImage[],
        existingImageCount: number,
        initialSortOrder: number,
    ) => {
        const failures: string[] = [];
        const analysisFailures: string[] = [];
        let successCount = 0;

        for (const [index, image] of imagesToUpload.entries()) {
            setUploadMessage(`Đang tải ảnh ${index + 1}/${imagesToUpload.length}...`);
            setImageUploadState(image.id, { status: "uploading", error: undefined });

            try {
                const uploaded = await uploadFileToR2(image.file, { listingId });
                const savedImages = await addHostListingImages(listingId, [
                    {
                        url: uploaded.publicUrl,
                        key: uploaded.key,
                        originalFilename: image.file.name,
                        displayTitle: null,
                        altText: form.title.trim() || "Ảnh chỗ nghỉ",
                        caption: null,
                        isCover: existingImageCount === 0 && successCount === 0,
                        sortOrder: initialSortOrder + index,
                    },
                ]);

                successCount += 1;
                setImageUploadState(image.id, { status: "success", error: undefined });

                const createdImage = savedImages.images?.[0];
                if (createdImage?.imageId) {
                    setUploadMessage(`Đang phân tích ảnh bằng AI ${index + 1}/${imagesToUpload.length}...`);
                    setImageUploadState(image.id, { status: "analyzing", error: undefined });

                    try {
                        const analyzedImage = await analyzeListingImage(listingId, createdImage.imageId);
                        mergeExistingImage(analyzedImage);

                        if (analyzedImage.aiAnalysisStatus === "analyzed") {
                            setImageUploadState(image.id, { status: "tagged", error: undefined });
                        } else {
                            const message = analyzedImage.aiErrorMessage ?? "Phân tích lỗi, thử lại.";
                            analysisFailures.push(`${image.file.name}: ${message}`);
                            setImageUploadState(image.id, { status: "analysis_failed", error: message });
                        }
                    } catch (analysisError) {
                        const message = analysisError instanceof Error ? analysisError.message : "Phân tích lỗi, thử lại.";
                        analysisFailures.push(`${image.file.name}: ${message}`);
                        setImageUploadState(image.id, { status: "analysis_failed", error: message });
                    }
                }
            } catch (uploadError) {
                const message = uploadError instanceof Error ? uploadError.message : "Upload ảnh thất bại.";
                failures.push(`${image.file.name}: ${message}`);
                setImageUploadState(image.id, { status: "failed", error: message });
            }
        }

        setUploadMessage(
            analysisFailures.length > 0
                ? "Một số ảnh phân tích lỗi, thử lại."
                : successCount > 0
                    ? "Đã gắn tag"
                    : "",
        );
        return { successCount, failures, analysisFailures };
    };

    const handleDeleteExistingImage = async (imageId: number) => {
        if (!listingIdForEdit) return;

        setError("");
        setSuccess("");

        try {
            await deleteHostImage(imageId);
            setExistingImages((current) => current.filter((image) => image.imageId !== imageId));
            setSuccess("Đã xóa ảnh");
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa ảnh.");
        }
    };

    const handleSetCoverImage = async (imageId: number) => {
        if (!listingIdForEdit) return;

        setError("");
        setSuccess("");

        try {
            await setHostListingImageCover(listingIdForEdit, imageId);
            setExistingImages((current) =>
                current.map((image) => ({
                    ...image,
                    isCover: image.imageId === imageId,
                })),
            );
            setSuccess("Đã cập nhật ảnh bìa.");
        } catch (coverError) {
            setError(coverError instanceof Error ? coverError.message : "Không thể cập nhật ảnh bìa.");
        }
    };

    const handleAnalyzeSingleImage = async (imageId: number) => {
        if (!listingIdForEdit) return;

        setAnalyzingImageIds((current) => new Set(current).add(imageId));
        setAiMessage("Đang phân tích ảnh bằng AI...");
        setError("");
        setSuccess("");

        try {
            const result = await analyzeListingImage(listingIdForEdit, imageId);
            mergeExistingImage(result);
            setAiMessage(result.aiAnalysisStatus === "analyzed" ? "Đã gắn tag" : "Phân tích lỗi, thử lại.");
        } catch (analyzeError) {
            setAiMessage("");
            setError(analyzeError instanceof Error ? analyzeError.message : "Không thể phân tích ảnh bằng AI.");
        } finally {
            setAnalyzingImageIds((current) => {
                const next = new Set(current);
                next.delete(imageId);
                return next;
            });
        }
    };

    const handleUpdateImageTags = async (image: ExistingListingImage, nextTags: string[]) => {
        setSavingTagImageIds((current) => new Set(current).add(image.imageId));
        setError("");
        setSuccess("");

        try {
            const result = await updateListingImageTags(image.imageId, nextTags);
            mergeExistingImage(result);
            setSuccess("Đã cập nhật tag ảnh.");
        } catch (tagError) {
            setError(tagError instanceof Error ? tagError.message : "Không thể cập nhật tag ảnh.");
        } finally {
            setSavingTagImageIds((current) => {
                const next = new Set(current);
                next.delete(image.imageId);
                return next;
            });
        }
    };

    const handleRemoveImageTag = (image: ExistingListingImage, tagCode: string) => {
        const nextTags = getImageTags(image, tagTaxonomies)
            .map((tag) => tag.tag)
            .filter((tag) => tag !== tagCode);
        void handleUpdateImageTags(image, nextTags);
    };

    const handleAddImageTag = (image: ExistingListingImage, tagCode: string) => {
        const currentTags = getImageTags(image, tagTaxonomies).map((tag) => tag.tag);
        if (currentTags.includes(tagCode)) return;
        void handleUpdateImageTags(image, [...currentTags, tagCode]);
    };

    const handleAnalyzeImagesWithAi = async () => {
        if (!listingIdForEdit) {
            setAiMessage("Bạn cần lưu chỗ nghỉ trước khi phân tích ảnh bằng AI.");
            return;
        }

        if (existingImages.length === 0) {
            setAiMessage("Chỗ nghỉ này chưa có ảnh để phân tích.");
            return;
        }

        setAiAnalyzing(true);
        setAiMessage("Đang phân tích ảnh...");
        setError("");
        setSuccess("");

        try {
            const result = await analyzeListingImages(listingIdForEdit, true);
            await refreshExistingImages(listingIdForEdit);

            setAiMessage(
                `Đã phân tích ${result.analyzedCount} ảnh${result.failedCount ? `, ${result.failedCount} ảnh lỗi` : ""
                }.`,
            );
        } catch (analyzeError) {
            setAiMessage("");
            setError(analyzeError instanceof Error ? analyzeError.message : "Không thể phân tích ảnh bằng AI.");
        } finally {
            setAiAnalyzing(false);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        setUploadMessage("");

        const locationValidationError = getLocationValidationError(form);

        if (locationValidationError) {
            setError(locationValidationError);
            return;
        }

        const numberValidationError = validateNumberFields();

        if (numberValidationError) {
            setError(numberValidationError);
            return;
        }

        setSaving(true);

        const completedUploadStatuses = new Set<SelectedImage["status"]>(["success", "tagged", "analysis_failed"]);
        const imagesToUpload = selectedImages.filter((image) => !completedUploadStatuses.has(image.status));

        try {
            if (isEditMode && listingIdForEdit) {
                await updateHostListing(listingIdForEdit, buildUpdatePayload());

                const nextSortOrder =
                    existingImages.reduce((max, image) => Math.max(max, image.sortOrder), -1) + 1;
                const uploadResult = imagesToUpload.length
                    ? await uploadSelectedImagesForListing(
                        listingIdForEdit,
                        imagesToUpload,
                        existingImages.length,
                        nextSortOrder,
                    )
                    : { successCount: 0, failures: [], analysisFailures: [] };

                if (uploadResult.failures.length > 0) {
                    await refreshExistingImages(listingIdForEdit).catch(async () => {
                        const detail = await getHostListingDetail(listingIdForEdit);
                        setExistingImages((detail.images ?? []).map(mapHostListingImageToExisting));
                    });
                    setError(`Đã lưu thông tin chỗ nghỉ nhưng một số ảnh upload thất bại: ${uploadResult.failures.join("; ")}`);
                    return;
                }

                clearSelectedImages();
                await refreshExistingImages(listingIdForEdit).catch(async () => {
                    const detail = await getHostListingDetail(listingIdForEdit);
                    setExistingImages((detail.images ?? []).map(mapHostListingImageToExisting));
                });
                setSuccess(
                    uploadResult.analysisFailures.length > 0
                        ? `Đã cập nhật chỗ nghỉ. Một số ảnh phân tích lỗi: ${uploadResult.analysisFailures.join("; ")}`
                        : "Đã cập nhật chỗ nghỉ và ảnh thành công.",
                );
                return;
            }

            const created = await createHostListing(buildCreatePayload());
            const createdListingId = created.listingId;
            const uploadResult = imagesToUpload.length
                ? await uploadSelectedImagesForListing(createdListingId, imagesToUpload, 0, 0)
                : { successCount: 0, failures: [], analysisFailures: [] };

            if (uploadResult.failures.length > 0) {
                navigate(`${APP_ROUTES.hostNewProperty}?listingId=${createdListingId}`, { replace: true });
                setError(`Chỗ nghỉ đã tạo nhưng upload ảnh thất bại, vui lòng thử thêm ảnh lại: ${uploadResult.failures.join("; ")}`);
                return;
            }

            navigate(`${APP_ROUTES.hostNewProperty}?listingId=${createdListingId}`, { replace: true });
            setSuccess(
                uploadResult.analysisFailures.length > 0
                    ? `Đã tạo chỗ nghỉ. Một số ảnh phân tích lỗi: ${uploadResult.analysisFailures.join("; ")}`
                    : "Đã tạo chỗ nghỉ thành công.",
            );
            clearSelectedImages();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Không thể lưu chỗ nghỉ.");
        } finally {
            setSaving(false);
        }
    };

    const currentCoordinates = getFormCoordinates(form) ?? DEFAULT_VUNG_TAU_COORDINATES;
    const hasLegacyWardOption =
        form.ward.trim().length > 0 && !VUNG_TAU_WARDS.some((ward) => ward.name === form.ward.trim());

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-5xl space-y-6">
                <PageHeader
                    title={isEditMode ? "Sửa chỗ nghỉ" : "Thêm chỗ nghỉ mới"}
                    actions={<button type="button" onClick={() => navigate(APP_ROUTES.hostProperties)} className={secondaryButtonClass}>Quay lại danh sách</button>}
                />

                {loadingDetail ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8">
                        <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                        <span className="text-sm font-medium text-slate-500">Đang tải chỗ nghỉ...</span>
                    </div>
                ) : null}
                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
                {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div> : null}
                {uploadMessage ? <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm font-medium text-cyan-600">{uploadMessage}</div> : null}
                {aiMessage ? <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm font-medium text-violet-700">{aiMessage}</div> : null}

                <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="grid gap-5 md:grid-cols-2">
                        <label><span className={labelClassName}>Tiêu đề</span><input required value={form.title} onChange={(e) => setField("title", e.target.value)} className={inputClassName} /></label>
                        <label><span className={labelClassName}>Loại chỗ nghỉ</span><select value={form.propertyType} onChange={(e) => setField("propertyType", e.target.value as FormState["propertyType"])} className={inputClassName}><option value="villa">Villa</option><option value="apartment">Căn hộ</option><option value="homestay">Homestay</option><option value="hotel">Khách sạn</option></select></label>
                    </div>

                    <label><span className={labelClassName}>Mô tả</span><textarea required value={form.description} onChange={(e) => setField("description", e.target.value)} className={textareaClassName} /></label>

                    <div className="space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <label>
                                <span className={labelClassName}>Địa chỉ</span>
                                <input
                                    required
                                    value={form.addressLine}
                                    onChange={(e) => setField("addressLine", e.target.value)}
                                    className={inputClassName}
                                // placeholder="Ví dụ: 164B Phan Chu Trinh"
                                />
                            </label>
                            <label>
                                <span className={labelClassName}>Phường/xã</span>
                                <select
                                    required
                                    value={form.ward}
                                    onChange={(e) => handleWardChange(e.target.value)}
                                    className={inputClassName}
                                >
                                    <option value="">Chọn phường/xã</option>
                                    {hasLegacyWardOption ? <option value={form.ward}>{form.ward}</option> : null}
                                    {VUNG_TAU_WARDS.map((ward) => (
                                        <option key={ward.name} value={ward.name}>
                                            {ward.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                <span className={labelClassName}>Thành phố</span>
                                <input
                                    readOnly
                                    value={VUNG_TAU_CITY}
                                    className={`${inputClassName} bg-gray-50 text-gray-600`}
                                />
                            </label>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-slate-50/70 p-4">
                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                        <MapPin size={18} className="text-cyan-500" />
                                        <span>Vị trí trên bản đồ</span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Kéo ghim để chọn đúng vị trí chỗ nghỉ.
                                    </p>
                                </div>
                                <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-100">
                                    {coordinateToInputValue(currentCoordinates.latitude)},{" "}
                                    {coordinateToInputValue(currentCoordinates.longitude)}
                                </div>
                            </div>
                            <div className="h-[360px] min-h-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                <ListingLocationMap
                                    position={currentCoordinates}
                                    onPositionChange={handleMapPositionChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-4">
                        <label>
                            <span className={labelClassName}>Khách tối đa</span>
                            <input
                                required
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.maxGuests}
                                onKeyDown={preventInvalidIntegerKey}
                                onChange={(e) => setIntegerField("maxGuests", e.target.value)}
                                className={inputClassName}

                            />
                        </label>

                        <label>
                            <span className={labelClassName}>Phòng ngủ</span>
                            <input
                                required
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.bedrooms}
                                onKeyDown={preventInvalidIntegerKey}
                                onChange={(e) => setIntegerField("bedrooms", e.target.value)}
                                className={inputClassName}

                            />
                        </label>

                        <label>
                            <span className={labelClassName}>Giường</span>
                            <input
                                required
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.beds}
                                onKeyDown={preventInvalidIntegerKey}
                                onChange={(e) => setIntegerField("beds", e.target.value)}
                                className={inputClassName}

                            />
                        </label>

                        <label>
                            <span className={labelClassName}>WC</span>
                            <input
                                required
                                type="text"
                                inputMode="decimal"
                                value={form.bathrooms}
                                onKeyDown={preventInvalidNumberKey}
                                onChange={(e) => setDecimalField("bathrooms", e.target.value)}
                                className={inputClassName}

                            />
                        </label>
                    </div>

                    <div className="grid gap-5 md:grid-cols-4">
                        <label>
                            <span className={labelClassName}>Giá cơ bản</span>
                            <input
                                required
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.basePrice}
                                onKeyDown={preventInvalidIntegerKey}
                                onChange={(e) => handleBasePriceChange(e.target.value)}
                                className={inputClassName}

                            />
                        </label>

                        <label>
                            <span className={labelClassName}>Giá cuối tuần</span>
                            <input
                                required
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.weekendPrice || form.basePrice}
                                onKeyDown={preventInvalidIntegerKey}
                                onChange={(e) => handleWeekendPriceChange(e.target.value)}
                                className={inputClassName}
                                placeholder="Mặc định bằng giá cơ bản"
                            />

                        </label>

                        <label>
                            <span className={labelClassName}>Phí dọn dẹp</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.cleaningFee}
                                onKeyDown={preventInvalidIntegerKey}
                                onChange={(e) => setIntegerField("cleaningFee", e.target.value)}
                                className={inputClassName}

                            />
                        </label>

                        <label>
                            <span className={labelClassName}>Phụ thu</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.surchargeAmount}
                                onKeyDown={preventInvalidIntegerKey}
                                onChange={(e) => setIntegerField("surchargeAmount", e.target.value)}
                                className={inputClassName}
                                placeholder="0"
                            />
                        </label>

                        {/* <label>
                            <span className={labelClassName}>Phí nền tảng %</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={form.serviceFeePct}
                                onKeyDown={preventInvalidNumberKey}
                                onChange={(e) => setDecimalField("serviceFeePct", e.target.value)}
                                className={inputClassName}
                            />
                        </label> */}
                    </div>

                    <div className="grid gap-5 md:grid-cols-4">
                        <label>
                            <span className={labelClassName}>Số đêm tối thiểu</span>
                            <input
                                required
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.minNights}
                                onKeyDown={preventInvalidIntegerKey}
                                onChange={(e) => setIntegerField("minNights", e.target.value)}
                                className={inputClassName}

                            />
                        </label>

                        <label>
                            <span className={labelClassName}>Số đêm tối đa</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.maxNights}
                                onKeyDown={preventInvalidIntegerKey}
                                onChange={(e) => setIntegerField("maxNights", e.target.value)}
                                className={inputClassName}

                            />
                        </label>

                        <label>
                            <span className={labelClassName}>Nhận phòng từ</span>
                            <select
                                required
                                value={form.checkInFrom}
                                onChange={(e) => setField("checkInFrom", e.target.value)}
                                className={inputClassName}
                            >
                                {TIME_OPTIONS.map((time) => (
                                    <option key={`check-in-${time}`} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span className={labelClassName}>Trả phòng trước</span>
                            <select
                                required
                                value={form.checkOutBefore}
                                onChange={(e) => setField("checkOutBefore", e.target.value)}
                                className={inputClassName}
                            >
                                {TIME_OPTIONS.map((time) => (
                                    <option key={`check-out-${time}`} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        <label><span className={labelClassName}>Loại phòng</span><select value={form.roomType} onChange={(e) => setField("roomType", e.target.value as FormState["roomType"])} className={inputClassName}><option value="entire_place">Nguyên căn</option><option value="private_room">Phòng riêng</option><option value="shared_room">Phòng chung</option></select></label>
                        <label><span className={labelClassName}>Chính sách hủy</span><select value={form.cancellationPolicy} onChange={(e) => setField("cancellationPolicy", e.target.value as FormState["cancellationPolicy"])} className={inputClassName}><option value="flexible">Linh hoạt</option><option value="moderate">Vừa phải</option><option value="strict">Nghiêm ngặt</option></select></label>
                        {!isEditMode ? (
                            <label><span className={labelClassName}>Trạng thái</span><select value={form.status} onChange={(e) => setField("status", e.target.value as FormState["status"])} className={inputClassName}><option value="draft">Lưu nháp</option><option value="pending_approval">Gửi admin duyệt</option></select></label>
                        ) : null}
                    </div>

                    <div>
                        <span className={labelClassName}>Ảnh chỗ nghỉ</span>
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition-colors hover:border-cyan-400 hover:bg-cyan-50/40">
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                multiple
                                className="sr-only"
                                onChange={(event) => handleImageChange(event.target.files)}
                            />
                            <span className="text-sm font-semibold text-gray-800">Chọn ảnh từ thiết bị</span>
                            <span className="mt-1 text-xs text-gray-500">JPG, PNG, WebP hoặc GIF. Tối đa 30 ảnh, mỗi ảnh 5MB.</span>
                        </label>

                        {existingImages.length > 0 ? (
                            <div className="mt-4">
                                <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ảnh đã lưu.</p>
                                    {isEditMode ? (
                                        <button
                                            type="button"
                                            onClick={handleAnalyzeImagesWithAi}
                                            disabled={aiAnalyzing}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition-colors hover:border-violet-200 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Sparkles size={16} />
                                            {aiAnalyzing ? "Đang phân tích ảnh..." : "Phân tích ảnh bằng AI"}
                                        </button>
                                    ) : null}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                                    {existingImages.map((image, index) => {
                                        const tags = getImageTags(image, tagTaxonomies);
                                        const tagCodes = new Set(tags.map((tag) => tag.tag));
                                        const analysisStatus = getExistingImageAnalysisStatus(image, tags);
                                        const isAnalyzingImage = analyzingImageIds.has(image.imageId);
                                        const isSavingTags = savingTagImageIds.has(image.imageId);
                                        const availableTags = tagTaxonomies.filter((taxonomy) => !tagCodes.has(taxonomy.code));

                                        return (
                                            <div key={image.imageId} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                                                <img src={image.url} alt={buildExistingImageLabel(image, index)} className="h-32 w-full object-cover" />
                                                <div className="space-y-2 px-3 py-2">
                                                    <div className="truncate text-xs text-gray-500">{buildExistingImageLabel(image, index)}</div>
                                                    <div className={`text-xs font-semibold ${analysisStatus.className}`}>
                                                        {isAnalyzingImage ? "Đang phân tích ảnh bằng AI" : analysisStatus.label}
                                                    </div>

                                                    {tags.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {tags.map((tag) => (
                                                                <span key={tag.tag} className="inline-flex max-w-full items-center gap-1 rounded-full bg-cyan-50 px-2 py-1 text-[11px] font-semibold text-cyan-600">
                                                                    <span className="truncate">{tag.labelVi}</span>
                                                                    <button
                                                                        type="button"
                                                                        disabled={isSavingTags}
                                                                        onClick={() => handleRemoveImageTag(image, tag.tag)}
                                                                        className="text-cyan-500 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        aria-label={`Xóa tag ${tag.labelVi}`}
                                                                    >
                                                                        x
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : null}

                                                    <select
                                                        value=""
                                                        disabled={isSavingTags || availableTags.length === 0}
                                                        onChange={(event) => {
                                                            const tagCode = event.target.value;
                                                            if (tagCode) handleAddImageTag(image, tagCode);
                                                        }}
                                                        className="w-full rounded-2xl border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                                                    >
                                                        <option value="">Thêm tag thiếu</option>
                                                        {availableTags.map((taxonomy) => (
                                                            <option key={taxonomy.code} value={taxonomy.code}>
                                                                {taxonomy.labelVi}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <div className="flex items-center justify-between gap-2">
                                                        {image.isCover ? <span className="text-xs font-semibold text-cyan-600">Ảnh bìa</span> : <span />}
                                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAnalyzeSingleImage(image.imageId)}
                                                                disabled={isAnalyzingImage}
                                                                className="text-xs font-semibold text-violet-700 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {analysisStatus.label.includes("lỗi") ? "Thử lại" : "Phân tích"}
                                                            </button>
                                                            {!image.isCover ? (
                                                                <button type="button" onClick={() => handleSetCoverImage(image.imageId)} className="text-xs font-semibold text-cyan-600 hover:text-cyan-800">Đặt bìa</button>
                                                            ) : null}
                                                            <button type="button" onClick={() => handleDeleteExistingImage(image.imageId)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">Xóa</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        {selectedImages.length > 0 ? (
                            <div className="mt-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Ảnh mới chờ upload.</p>
                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                                    {selectedImages.map((image, index) => (
                                        <div key={image.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                                            <img src={image.previewUrl} alt={`Ảnh mới ${index + 1}`} className="h-32 w-full object-cover" />
                                            <div className="space-y-2 px-3 py-2">
                                                <div className="truncate text-xs text-gray-500">{`Ảnh chỗ nghỉ ${existingImages.length + index + 1}`}</div>
                                                <div className="flex items-center justify-between gap-2 text-xs">
                                                    <span className={getSelectedImageStatusClass(image.status)}>
                                                        {getSelectedImageStatusText(image.status)}
                                                    </span>
                                                    {!["uploading", "analyzing", "success", "tagged"].includes(image.status) ? (
                                                        <button type="button" onClick={() => removeSelectedImage(image.id)} className="font-semibold text-rose-600 hover:text-rose-700">Xóa</button>
                                                    ) : null}
                                                </div>
                                                {image.error ? <p className="text-xs text-rose-600">{image.error}</p> : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {selectedImages.length > 0 ? (
                            <button type="button" onClick={clearSelectedImages} className="mt-3 text-sm font-medium text-rose-600 hover:text-rose-700">
                                Xóa toàn bộ ảnh mới đã chọn
                            </button>
                        ) : null}
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-gray-100 p-4">
                        <input type="checkbox" checked={form.instantBookEnabled} onChange={(e) => setField("instantBookEnabled", e.target.checked)} />
                        <span className="text-sm font-medium text-gray-700">Cho phép đặt nhanh</span>
                    </label>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={resetForm} className={secondaryButtonClass}>Xóa </button>
                        <button type="submit" disabled={saving || loadingDetail} className={primaryButtonClass}>{saving ? "Đang lưu..." : isEditMode ? "Cập nhật chỗ nghỉ" : "Lưu chỗ nghỉ"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ThemChoNghi;
