export interface TripHistory {
    id: string;
    propertyName: string;
    location: string;
    imageUrl: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalPrice: number;
    currency: string;
    status: "completed" | "cancelled" | "pending_review";
    canReview: boolean;
    canRebook: boolean;
}

const toImageUrl = (imageFile: string) => new URL(`../assets/img/${imageFile}`, import.meta.url).href;

export const mockTripHistory: TripHistory[] = [
    {
        id: "trip_001",
        propertyName: "Minh Thành Villa",
        location: "Vũng Tàu",
        imageUrl: toImageUrl("mocnhien.jpg"),
        checkIn: "2024-11-10",
        checkOut: "2024-11-13",
        nights: 3,
        totalPrice: 4500000,
        currency: "VND",
        status: "pending_review",
        canReview: true,
        canRebook: true,
    },
    {
        id: "trip_002",
        propertyName: "Seaview Homestay",
        location: "Đà Nẵng",
        imageUrl: toImageUrl("diamond.jpg"),
        checkIn: "2024-09-05",
        checkOut: "2024-09-08",
        nights: 3,
        totalPrice: 2700000,
        currency: "VND",
        status: "completed",
        canReview: false,
        canRebook: true,
    },
    {
        id: "trip_003",
        propertyName: "Ocean Bungalow",
        location: "Phú Quốc",
        imageUrl: toImageUrl("casamar.jpg"),
        checkIn: "2024-07-20",
        checkOut: "2024-07-25",
        nights: 5,
        totalPrice: 7500000,
        currency: "VND",
        status: "cancelled",
        canReview: false,
        canRebook: true,
    },
    {
        id: "trip_004",
        propertyName: "Đà Lạt Forest House",
        location: "Đà Lạt",
        imageUrl: toImageUrl("sunset.jpg"),
        checkIn: "2024-04-01",
        checkOut: "2024-04-03",
        nights: 2,
        totalPrice: 1800000,
        currency: "VND",
        status: "completed",
        canReview: true,
        canRebook: true,
    },
];
