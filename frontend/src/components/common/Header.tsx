import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/img/logo_mau.svg";
import useScrollVisibility from "../../hooks/useScrollVisibility";

const Header = () => {
    const show = useScrollVisibility({ threshold: 8, topOffset: 24 });
    const location = useLocation();
    const [useDarkText, setUseDarkText] = useState(location.pathname !== "/");

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

    const linkClass = useDarkText
        ? "transition-colors hover:text-cyan-700 hover:underline"
        : "transition-colors hover:text-cyan-200 hover:underline";

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 py-4 transition-transform duration-300 will-change-transform ${
                show ? "translate-y-0" : "-translate-y-full"
            }`}
        >
            <div className="container mx-auto flex justify-between items-center px-6">
                <Link to="/">
                    <img src={logo} alt="Villa Vung Tau" className="h-8 object-contain" />
                </Link>

                <nav
                    className={`flex items-center space-x-8 font-medium ${
                        useDarkText ? "text-zinc-900" : "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]"
                    }`}
                >
                    <Link to="/" className={linkClass}>Trang chủ</Link>
                    <Link to="/hotels" className={linkClass}>Nơi lưu trú</Link>
                    <Link to="/blog" className={linkClass}>Blog</Link>
                    <Link to="/news" className={linkClass}>Liên hệ</Link>
                    <Link to="/contact" className={linkClass}>Đăng nhập</Link>
                </nav>
            </div>
        </header>
    );
};

export default Header;
