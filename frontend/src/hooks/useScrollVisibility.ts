import { useEffect, useRef, useState } from "react";

type UseScrollVisibilityOptions = {
    threshold?: number;
    topOffset?: number;
};

const useScrollVisibility = (options: UseScrollVisibilityOptions = {}) => {
    const { threshold = 10, topOffset = 40 } = options;
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollYRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const updateVisibility = () => {
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollYRef.current;

            if (currentScrollY <= topOffset) {
                setIsVisible(true);
                lastScrollYRef.current = currentScrollY;
                return;
            }

            if (Math.abs(delta) < threshold) {
                return;
            }

            setIsVisible((prev) => {
                const next = delta < 0;
                return prev === next ? prev : next;
            });

            lastScrollYRef.current = currentScrollY;
        };

        const onScroll = () => {
            if (rafRef.current !== null) {
                return;
            }

            rafRef.current = window.requestAnimationFrame(() => {
                updateVisibility();
                rafRef.current = null;
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current);
            }
        };
    }, [threshold, topOffset]);

    return isVisible;
};

export default useScrollVisibility;
