import type {
    StayAmenity,
    StayCategory,
    StayHighlight,
    StayPolicy,
    StayQuickChoice,
} from "../../../../models/entities/Listing";

export type StaySortOption =
    | "gia-thap-den-cao"
    | "danh-gia-cao-nhat"
    | "gan-trung-tam"
    | "phu-hop-nhom-dong";

export type PriceBounds = {
    min: number;
    max: number;
};

export type StayFilterState = {
    categories: StayCategory[];
    priceMin: number | null;
    priceMax: number | null;
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    amenities: StayAmenity[];
    highlights: StayHighlight[];
    policies: StayPolicy[];
    quickChoices: StayQuickChoice[];
    sortBy: StaySortOption | null;
};

export type CounterKey = "guests" | "bedrooms" | "beds" | "bathrooms";

export type CounterFilterItem = {
    key: CounterKey;
    label: string;
    description: string;
};