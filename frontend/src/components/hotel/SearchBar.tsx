import { useEffect, useRef, useState } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaUser } from "react-icons/fa";
import useScrollVisibility from "../../hooks/useScrollVisibility";

const SearchBar = () => {
    const [greeting, setGreeting] = useState<string>("");
    const [isPinned, setIsPinned] = useState(false);
    const show = useScrollVisibility({ threshold: 12, topOffset: 36 });
    const pinnedRef = useRef(false);
    const rafRef = useRef<number | null>(null);

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
        const pinAt = 280;
        const unpinAt = 180;

        const updatePinnedState = () => {
            const currentY = window.scrollY;
            const nextPinned = pinnedRef.current ? currentY > unpinAt : currentY > pinAt;

            if (nextPinned !== pinnedRef.current) {
                pinnedRef.current = nextPinned;
                setIsPinned(nextPinned);
            }
        };

        const handleScroll = () => {
            if (rafRef.current !== null) {
                return;
            }

            rafRef.current = window.requestAnimationFrame(() => {
                updatePinnedState();
                rafRef.current = null;
            });
        };

        updatePinnedState();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    return (
        <div
            className={`${isPinned ? "fixed left-0 top-14 w-full md:top-20" : "relative -mt-20 md:-mt-32"} z-40 flex justify-center px-3 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform md:px-0 ${show ? "translate-y-0 opacity-100" : "-translate-y-16 pointer-events-none opacity-0"
                }`}
        >
            <div
                className={`w-full max-w-6xl text-center ${isPinned ? "bg-transparent p-0 shadow-none" : "rounded-3xl bg-white p-4 shadow-xl sm:p-6 md:p-8"
                    }`}
            >
                <div
                    className={`overflow-hidden transition-all duration-10 ease-[cubic-bezier(0.16,1,0.3,1)] ${isPinned ? "max-h-0 -translate-y-2 opacity-0" : "max-h-52 translate-y-0 opacity-100"
                        }`}
                >
                    <h1 className="mb-3 text-center text-3xl font-bold text-cyan-600 sm:text-4xl md:mb-4 md:text-5xl">
                        Chào buổi {greeting}!
                    </h1>

                    <p className="mb-6 text-center text-base text-gray-600 sm:text-lg md:mb-10">
                        Trân trọng được chào đón bạn tại thành phố biển Vũng Tàu
                    </p>
                </div>

                <div className="rounded-full border bg-white">
                    <div className="flex items-center gap-3 px-4 py-3 md:hidden">
                        <FaMapMarkerAlt className="text-gray-400" />

                        <div className="flex-1 text-left">
                            <p className="text-sm font-semibold text-gray-900">Địa điểm, ngày, khách</p>
                            <p className="text-xs text-gray-500">Tìm nơi lưu trú phù hợp</p>
                        </div>

                        <button
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600 text-white"
                            aria-label="Tìm kiếm"
                        >
                            <FaSearch />
                        </button>
                    </div>

                    <div className="hidden items-center justify-between px-6 py-4 md:flex">
                        <div className="flex flex-1 items-center gap-3">
                            <FaMapMarkerAlt className="text-gray-400" />
                            <div className="text-left">
                                <p className="font-medium">Địa điểm</p>
                                <p className="text-sm text-gray-400">Tìm kiếm điểm đến</p>
                            </div>
                        </div>

                        <div className="mx-4 h-8 border-l" />

                        <div className="flex flex-1 items-center gap-3">
                            <FaCalendarAlt className="text-gray-400" />
                            <div className="text-left">
                                <p className="font-medium">Nhận phòng</p>
                                <p className="text-sm text-gray-400">Thêm ngày</p>
                            </div>
                        </div>

                        <div className="mx-4 h-8 border-l" />

                        <div className="flex flex-1 items-center gap-3">
                            <FaCalendarAlt className="text-gray-400" />
                            <div className="text-left">
                                <p className="font-medium">Trả phòng</p>
                                <p className="text-sm text-gray-400">Thêm ngày</p>
                            </div>
                        </div>

                        <div className="mx-4 h-8 border-l" />

                        <div className="flex flex-1 items-center gap-3">
                            <FaUser className="text-gray-400" />
                            <div className="text-left">
                                <p className="font-medium">Khách</p>
                                <p className="text-sm text-gray-400">Thêm khách</p>
                            </div>
                        </div>

                        <button
                            className="ml-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 text-white"
                            aria-label="Tìm kiếm"
                        >
                            <FaSearch />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
