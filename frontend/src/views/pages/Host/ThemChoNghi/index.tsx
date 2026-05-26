import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import * as L from "leaflet";
import type { LatLngExpression, Marker as LeafletMarker } from "leaflet";
import { MapPin, Sparkles } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { useNavigate, useSearchParams } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { APP_ROUTES } from "../../../../config/routes";
import { VUNG_TAU_WARDS } from "../../../../data/vungTauWards";
import {
    addHostListingImages,
    createHostListing,
    deleteHostListingImage,
    getHostListingDetail,
    setHostListingImageCover,
    updateHostListing,
    type CreateHostListingPayload,
    type HostListingDetail,
    type UpdateHostListingPayload,
} from "../../../../services/hostService";
import { analyzeListingImages } from "../../../../services/api/listingImageAiService";
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
    latitude: 10.345,
    longitude: 107.084,
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
    status: "queued" | "uploading" | "success" | "failed";
    error?: string;
};

type ExistingListingImage = {
    imageId: number;
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

    aiAnalysisStatus?: "pending" | "analyzed" | "failed";
    ai_analysis_status?: "pending" | "analyzed" | "failed";

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

const mapHostListingImageToExisting = (image: HostListingDetail["images"][number]): ExistingListingImage => ({
    imageId: image.imageId,
    url: image.url,
    key: image.key,
    objectKey: image.objectKey,
    caption: image.caption,

    displayTitle: image.displayTitle,
    display_title: image.display_title,

    altText: image.altText,
    alt_text: image.alt_text,

    aiDisplayTitle: image.aiDisplayTitle,

    aiImageType: image.aiImageType,
    ai_image_type: image.ai_image_type,

    aiDescription: image.aiDescription,
    ai_description: image.ai_description,

    aiAnalysisStatus: image.aiAnalysisStatus,
    ai_analysis_status: image.ai_analysis_status,

    sortOrder: image.sortOrder,
    isCover: image.isCover,
});
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
const getLocationValidationError = (value: Pick<FormState, "addressLine" | "ward" | "latitude" | "longitude">) => {
    if (!value.addressLine.trim()) {
        return "Vui lòng nhập địa chỉ chỗ nghỉ.";
    }

    const coordinates = getFormCoordinates(value);

    if (!value.ward.trim() || !coordinates) {
        return locationSelectionError;
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
    const markerPosition = useMemo<LatLngExpression>(
        () => [position.latitude, position.longitude],
        [position.latitude, position.longitude],
    );
    const eventHandlers = useMemo(
        () => ({
            dragend: () => {
                const marker = markerRef.current;

                if (!marker) {
                    return;
                }

                const nextPosition = marker.getLatLng();
                onPositionChange({
                    latitude: nextPosition.lat,
                    longitude: nextPosition.lng,
                });
            },
        }),
        [onPositionChange],
    );

    return (
        <MapContainer
            center={markerPosition}
            zoom={14}
            scrollWheelZoom
            className="h-full w-full"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewUpdater position={position} />
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

    useEffect(() => {
        return () => {
            selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        };
    }, []);

    useEffect(() => {
        if (!listingIdForEdit) {
            setExistingImages([]);
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

    const uploadSelectedImagesForListing = async (
        listingId: string | number,
        imagesToUpload: SelectedImage[],
        existingImageCount: number,
        initialSortOrder: number,
    ) => {
        const failures: string[] = [];
        let successCount = 0;

        for (const [index, image] of imagesToUpload.entries()) {
            setUploadMessage(`Đang upload ảnh ${index + 1}/${imagesToUpload.length}...`);
            setImageUploadState(image.id, { status: "uploading", error: undefined });

            try {
                const uploaded = await uploadFileToR2(image.file, { listingId });
                await addHostListingImages(listingId, [
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
            } catch (uploadError) {
                const message = uploadError instanceof Error ? uploadError.message : "Upload ảnh thất bại.";
                failures.push(`${image.file.name}: ${message}`);
                setImageUploadState(image.id, { status: "failed", error: message });
            }
        }

        setUploadMessage(successCount > 0 ? "Upload thành công" : "");
        return { successCount, failures };
    };

    const handleDeleteExistingImage = async (imageId: number) => {
        if (!listingIdForEdit) return;

        setError("");
        setSuccess("");

        try {
            await deleteHostListingImage(listingIdForEdit, imageId);
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
            const detail = await getHostListingDetail(listingIdForEdit);

            setExistingImages((detail.images ?? []).map(mapHostListingImageToExisting));

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

        const imagesToUpload = selectedImages.filter((image) => image.status !== "success");

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
                    : { successCount: 0, failures: [] };

                if (uploadResult.failures.length > 0) {
                    const detail = await getHostListingDetail(listingIdForEdit);
                    setExistingImages((detail.images ?? []).map(mapHostListingImageToExisting));
                    setError(`Đã lưu thông tin chỗ nghỉ nhưng một số ảnh upload thất bại: ${uploadResult.failures.join("; ")}`);
                    return;
                }

                clearSelectedImages();
                const detail = await getHostListingDetail(listingIdForEdit);
                setExistingImages((detail.images ?? []).map(mapHostListingImageToExisting));
                setSuccess("Đã cập nhật chỗ nghỉ và ảnh thành công.");
                return;
            }

            const created = await createHostListing(buildCreatePayload());
            const createdListingId = created.listingId;
            const uploadResult = imagesToUpload.length
                ? await uploadSelectedImagesForListing(createdListingId, imagesToUpload, 0, 0)
                : { successCount: 0, failures: [] };

            if (uploadResult.failures.length > 0) {
                navigate(`${APP_ROUTES.hostNewProperty}?listingId=${createdListingId}`, { replace: true });
                setError(`Chỗ nghỉ đã tạo nhưng upload ảnh thất bại, vui lòng thử thêm ảnh lại: ${uploadResult.failures.join("; ")}`);
                return;
            }

            setSuccess("Đã tạo chỗ nghỉ thành công.");
            resetForm();
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

                {loadingDetail ? <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-600">Đang tải chỗ nghỉ...</div> : null}
                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
                {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div> : null}
                {uploadMessage ? <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm font-medium text-cyan-700">{uploadMessage}</div> : null}
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
                                        <MapPin size={18} className="text-cyan-600" />
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
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition-colors hover:border-violet-200 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Sparkles size={16} />
                                            {aiAnalyzing ? "Đang phân tích ảnh..." : "Phân tích ảnh bằng AI"}
                                        </button>
                                    ) : null}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                                    {existingImages.map((image, index) => (
                                        <div key={image.imageId} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                                            <img src={image.url} alt={buildExistingImageLabel(image, index)} className="h-32 w-full object-cover" />
                                            <div className="space-y-2 px-3 py-2">
                                                <div className="truncate text-xs text-gray-500">{buildExistingImageLabel(image, index)}</div>
                                                <div className="flex items-center justify-between gap-2">
                                                    {image.isCover ? <span className="text-xs font-semibold text-cyan-700">Ảnh bìa</span> : <span />}
                                                    <div className="flex items-center gap-2">
                                                        {!image.isCover ? (
                                                            <button type="button" onClick={() => handleSetCoverImage(image.imageId)} className="text-xs font-semibold text-cyan-700 hover:text-cyan-800">Đặt bìa</button>
                                                        ) : null}
                                                        <button type="button" onClick={() => handleDeleteExistingImage(image.imageId)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">Xóa</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {selectedImages.length > 0 ? (
                            <div className="mt-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Ảnh mới chờ upload.</p>
                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                                    {selectedImages.map((image, index) => (
                                        <div key={image.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                                            <img src={image.previewUrl} alt={`Ảnh mới ${index + 1}`} className="h-32 w-full object-cover" />
                                            <div className="space-y-2 px-3 py-2">
                                                <div className="truncate text-xs text-gray-500">{`Ảnh chỗ nghỉ ${existingImages.length + index + 1}`}</div>
                                                <div className="flex items-center justify-between gap-2 text-xs">
                                                    <span className={
                                                        image.status === "success"
                                                            ? "font-semibold text-emerald-600"
                                                            : image.status === "failed"
                                                                ? "font-semibold text-rose-600"
                                                                : image.status === "uploading"
                                                                    ? "font-semibold text-cyan-600"
                                                                    : "text-gray-500"
                                                    }>
                                                        {image.status === "success" ? "Upload thành công" : image.status === "failed" ? "Upload thất bại" : image.status === "uploading" ? "Đang upload ảnh..." : "Chờ upload"}
                                                    </span>
                                                    {image.status !== "uploading" && image.status !== "success" ? (
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
