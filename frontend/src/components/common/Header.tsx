import { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/img/logo_mau.svg";
import useScrollVisibility from "../../hooks/useScrollVisibility";

const navLinks = [
    { to: "/", label: "Trang chủ" },
    { to: "/hotels", label: "Nơi lưu trú" },
    { to: "/blog", label: "Blog" },
    { to: "/news", label: "Liên hệ" },
    { to: "/contact", label: "Đăng nhập" },
];

const Header = () => {
    const show = useScrollVisibility({ threshold: 12, topOffset: 36 });
    const location = useLocation();
    const [useDarkText, setUseDarkText] = useState(location.pathname !== "/");
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const updateTextMode = () => {
            const isHome = location.pathname === "/";
            setUseDarkText(!isHome || window.scrollY > 80);
        };

        updateTextMode();
        window.addEventListener("scroll", updateTextMode, { passive: true });

        return () => {
            window.removeEventListener("scroll", updateTextMode);
        };
    }, [location.pathname]);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const desktopLinkClass = useDarkText
        ? "transition-colors hover:text-cyan-700 hover:underline"
        : "transition-colors hover:text-cyan-200 hover:underline";

    const mobileButtonClass = useDarkText
        ? "border-zinc-300 bg-white/80 text-zinc-900"
        : "border-white/40 bg-black/20 text-white backdrop-blur [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]";

    const isVisible = show || mobileOpen;

    return (
        <header
            className={`fixed top-0 left-0 z-50 w-full py-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform md:py-4 ${
                isVisible ? "translate-y-0" : "-translate-y-full"
            }`}
        >
            <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
                <Link to="/">
                    <img src={logo} alt="Villa Vung Tau" className="h-8 object-contain md:h-9" />
                </Link>

                <nav
                    className={`hidden items-center space-x-8 text-base font-medium md:flex ${
                        useDarkText ? "text-zinc-900" : "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]"
                    }`}
                >
                    {navLinks.map(({ to, label }) => (
                        <Link key={to} to={to} className={desktopLinkClass}>
                            {label}
                        </Link>
                    ))}
                </nav>

                <button
                    type="button"
                    aria-label="Toggle menu"
                    onClick={() => setMobileOpen((prev) => !prev)}
                    className={`md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${mobileButtonClass}`}
                >
                    {mobileOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            {mobileOpen && (
                <div className="px-4 pt-3 md:hidden">
                    <div className="mx-auto max-w-7xl rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-xl backdrop-blur">
                        <nav className="flex flex-col text-zinc-900">
                            {navLinks.map(({ to, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className="rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-zinc-100"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
