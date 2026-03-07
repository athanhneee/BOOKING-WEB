import { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaCalendarAlt, FaUser, FaSearch } from "react-icons/fa";
import useScrollVisibility from "../../hooks/useScrollVisibility";

const SearchBar = () => {
    const [greeting, setGreeting] = useState<string>("");
    const [isPinned, setIsPinned] = useState(false);
    const show = useScrollVisibility({ threshold: 8, topOffset: 24 });

    useEffect(() => {
        const hour = new Date().getHours();

        if (hour < 12) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setGreeting("Sáng");
        } else if (hour < 18) {
            setGreeting("Chiều");
        } else {
            setGreeting("Tối");
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsPinned(window.scrollY > 260);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <div
            className={`${isPinned ? "fixed left-0 top-16 w-full md:top-20" : "relative -mt-32"} z-40 flex justify-center transition-all duration-300 will-change-transform ${show ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0 pointer-events-none"
                }`}
        >
            <div
                className={`w-[90%] max-w-6xl text-center ${isPinned ? "p-0 bg-transparent shadow-none" : "bg-white rounded-3xl shadow-xl p-8"}`}
            >

                {!isPinned && (
                    <>
                        {/* Greeting */}
                <h1 className="text-5xl font-bold text-cyan-600 mb-4 text-center">
                    Chào buổi {greeting}!
                </h1>

                <p className="text-lg text-gray-600 mb-10 text-center">
                    Trân trọng được chào đón bạn tại thành phố biển Vũng Tàu
                </p>

                    </>
                )}

                {/* Search fields */}
                <div className="flex items-center justify-between border rounded-full px-6 py-4 bg-white">

                    {/* Location */}
                    <div className="flex items-center gap-3 flex-1">
                        <FaMapMarkerAlt className="text-gray-400" />
                        <div>
                            <p className="font-medium">Địa điểm</p>
                            <p className="text-gray-400 text-sm">Tìm kiếm điểm đến</p>
                        </div>
                    </div>

                    <div className="border-l h-8 mx-4"></div>

                    {/* Checkin */}
                    <div className="flex items-center gap-3 flex-1">
                        <FaCalendarAlt className="text-gray-400" />
                        <div>
                            <p className="font-medium">Nhận phòng</p>
                            <p className="text-gray-400 text-sm">Thêm ngày</p>
                        </div>
                    </div>

                    <div className="border-l h-8 mx-4"></div>

                    {/* Checkout */}
                    <div className="flex items-center gap-3 flex-1">
                        <FaCalendarAlt className="text-gray-400" />
                        <div>
                            <p className="font-medium">Trả phòng</p>
                            <p className="text-gray-400 text-sm">Thêm ngày</p>
                        </div>
                    </div>

                    <div className="border-l h-8 mx-4"></div>

                    {/* Guests */}
                    <div className="flex items-center gap-3 flex-1">
                        <FaUser className="text-gray-400" />
                        <div>
                            <p className="font-medium">Khách</p>
                            <p className="text-gray-400 text-sm">Thêm khách</p>
                        </div>
                    </div>

                    {/* Search button */}
                    <button className="bg-cyan-600 text-white w-12 h-12 rounded-full flex items-center justify-center ml-4">
                        <FaSearch />
                    </button>

                </div>
            </div>
        </div>
    );
};

export default SearchBar;
