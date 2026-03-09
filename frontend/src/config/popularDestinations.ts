export type PopularDestination = {
    id: string;
    name: string;
    address: string;
    rating: number;
    pricePerNight: number;
    imageUrl: string;
};

type PopularDestinationSeed = Omit<PopularDestination, "imageUrl"> & {
    imageFile?: string;
};

const toImageUrl = (imageFile?: string): string => {
    if (!imageFile) {
        return "";
    }

    return new URL(`../assets/img/${imageFile}`, import.meta.url).href;
};

const popularDestinationSeeds: PopularDestinationSeed[] = [
    { id: "villa-01", name: "Casa Villa", address: "111 Phan Chu Trinh, Vũng Tàu", rating: 4.9, pricePerNight: 5000000, imageFile: "lacase.jpg" },
    { id: "villa-02", name: "Nasa Villa", address: "84B13 Phan Chu Trinh, Vũng Tàu", rating: 4.8, pricePerNight: 10000000, imageFile: "nasa.jpg" },
    { id: "villa-03", name: "Nabi Villa", address: "185A Võ Thị Sáu, Vũng Tàu", rating: 4.7, pricePerNight: 5500000, imageFile: "nabi.JPG" },
    { id: "villa-04", name: "S07 Aria", address: "Aria Resort, Vũng Tàu", rating: 4.8, pricePerNight: 5000000, imageFile: "s07.jpg" },
    { id: "villa-05", name: "Casa Mar", address: "93 Phan Chu Trinh, Vũng Tàu", rating: 4.9, pricePerNight: 4500000, imageFile: "casamar.jpg" },
    { id: "villa-06", name: "16 Hà Huy Tập", address: "16 Hà Huy Tập, Vũng Tàu", rating: 4.6, pricePerNight: 5500000, imageFile: "16hahuytap.jpg" },
    { id: "villa-07", name: "C12 Tô Ngọc Vân", address: "C12 Tô Ngọc Vân, Vũng Tàu", rating: 4.7, pricePerNight: 6000000, imageFile: "c12tongocvan.jpg" },
    { id: "villa-08", name: "Mộc Nhiên", address: "B2.50 Thùy Dương, Vũng Tàu", rating: 4.7, pricePerNight: 3000000, imageFile: "mocnhien.jpg" },
    { id: "villa-09", name: "Pha Lê Villa", address: "B2.5 Thùy Dương, Vũng Tàu", rating: 4.8, pricePerNight: 4000000, imageFile: "NDT05929-HDR1.jpg" },
    { id: "villa-10", name: "A2 Đặng Thùy Trâm", address: "A2 Đặng Thùy Trâm, Vũng Tàu", rating: 4.6, pricePerNight: 5500000, imageFile: "a3dtt.jpg" },
    { id: "villa-11", name: "B5 Đặng Thùy Trâm", address: "B5 Đặng Thùy Trâm, Vũng Tàu", rating: 4.6, pricePerNight: 8000000, imageFile: "b5dtt.jpg" },
    { id: "villa-12", name: "11 Trần Phú", address: "11 Trần Phú, Vũng Tàu", rating: 4.9, pricePerNight: 8500000, imageFile: "11tranphu.jpg" },
    { id: "villa-13", name: "19 Trần Phú", address: "19 Trần Phú, Vũng Tàu", rating: 4.9, pricePerNight: 7500000, imageFile: "19tranphu.jpg" },
    { id: "villa-14", name: "87 Trần Phú", address: "87 Trần Phú, Vũng Tàu", rating: 4.8, pricePerNight: 6000000, imageFile: "87tranphu.jpg" },
    { id: "villa-15", name: "109 Trần Phú", address: "109 Trần Phú, Vũng Tàu", rating: 4.8, pricePerNight: 9000000, imageFile: "109tranphu.jpg" },
    { id: "villa-16", name: "34/3 Võ Thị Sáu", address: "34/3 Võ Thị Sáu, Vũng Tàu", rating: 4.7, pricePerNight: 6000000, imageFile: "343vothisau.jpg" },
    { id: "villa-17", name: "6 Nguyễn Tuân", address: "6 Nguyễn Tuân, Vũng Tàu", rating: 4.7, pricePerNight: 6500000, imageFile: "6nguyentuan.jpg" },
    { id: "villa-18", name: "1 Phan Huy Chú", address: "1 Phan Huy Chú, Vũng Tàu", rating: 4.7, pricePerNight: 7000000, imageFile: "1phanhuychu.jpg" },
    { id: "villa-19", name: "Osaka Villa", address: "164B Phan Chu Trinh, Vũng Tàu", rating: 4.8, pricePerNight: 5000000, imageFile: "osaka.jpg" },
    { id: "villa-20", name: "160/22A Hoàng Hoa Thám", address: "160/22A Hoàng Hoa Thám, Vũng Tàu", rating: 4.7, pricePerNight: 4000000, imageFile: "16022ahht.jpg" },
    { id: "villa-21", name: "220/12A Phan Chu Trinh", address: "220/12A Phan Chu Trinh, Vũng Tàu", rating: 4.8, pricePerNight: 6000000, imageFile: "22012aphanchutrinh.jpg" },
    { id: "villa-22", name: "Diamond Villa", address: "B2.21 Thùy Dương, Vũng Tàu", rating: 4.9, pricePerNight: 7000000, imageFile: "diamond.jpg" },
    { id: "villa-23", name: "Sunset Horizon", address: "68/7 Hạ Long, Vũng Tàu", rating: 4.7, pricePerNight: 7000000, imageFile: "sunset.jpg" },
];

export const popularDestinations: PopularDestination[] = popularDestinationSeeds.map(({ imageFile, ...destination }) => ({
    ...destination,
    imageUrl: toImageUrl(imageFile),
}));
