import { useEffect, useRef, useState } from "react";

type UseScrollVisibilityOptions = {
    threshold?: number;
    topOffset?: number;
    hideStartRatio?: number;
};

const useScrollVisibility = (options: UseScrollVisibilityOptions = {}) => {
    const { threshold = 10, topOffset = 40, hideStartRatio = 0 } = options;
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollYRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const getHideStartOffset = () => topOffset + Math.max(0, hideStartRatio) * window.innerHeight;

        const updateVisibility = () => {
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollYRef.current;
            const hideStartOffset = getHideStartOffset();

            if (currentScrollY <= hideStartOffset) {
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
    }, [hideStartRatio, threshold, topOffset]);

    return isVisible;
};

export default useScrollVisibility;
