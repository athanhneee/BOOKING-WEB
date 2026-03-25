import {
    forwardRef,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type SearchPopoverAlign = "start" | "center" | "end";

type SearchPopoverProps = {
    isOpen: boolean;
    anchorEl: HTMLElement | null;
    children: ReactNode;
    className?: string;
    align?: SearchPopoverAlign;
    offset?: number;
    viewportPadding?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const SearchPopover = forwardRef<HTMLDivElement, SearchPopoverProps>(
    (
        {
            isOpen,
            anchorEl,
            children,
            className = "",
            align = "center",
            offset = 12,
            viewportPadding = 16,
        },
        forwardedRef,
    ) => {
        const localRef = useRef<HTMLDivElement | null>(null);
        const [panelStyle, setPanelStyle] = useState<CSSProperties>({
            position: "fixed",
            left: 0,
            top: 0,
            visibility: "hidden",
            pointerEvents: "none",
        });

        useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement, []);

        useLayoutEffect(() => {
            if (!isOpen || !anchorEl || !localRef.current) {
                return;
            }

            const updatePosition = () => {
                if (!localRef.current) {
                    return;
                }

                const anchorRect = anchorEl.getBoundingClientRect();
                const panelRect = localRef.current.getBoundingClientRect();
                const panelWidth = panelRect.width;
                const panelHeight = panelRect.height;

                let left = anchorRect.left;

                if (align === "center") {
                    left = anchorRect.left + anchorRect.width / 2 - panelWidth / 2;
                } else if (align === "end") {
                    left = anchorRect.right - panelWidth;
                }

                left = clamp(left, viewportPadding, window.innerWidth - panelWidth - viewportPadding);

                const preferredTop = anchorRect.bottom + offset;
                const fitsBelow = preferredTop + panelHeight <= window.innerHeight - viewportPadding;
                const topAbove = anchorRect.top - panelHeight - offset;
                const top = fitsBelow || topAbove < viewportPadding
                    ? clamp(preferredTop, viewportPadding, window.innerHeight - panelHeight - viewportPadding)
                    : topAbove;

                setPanelStyle({
                    position: "fixed",
                    left,
                    top,
                    visibility: "visible",
                    pointerEvents: "auto",
                });
            };

            updatePosition();

            window.addEventListener("resize", updatePosition);
            window.addEventListener("scroll", updatePosition, true);

            return () => {
                window.removeEventListener("resize", updatePosition);
                window.removeEventListener("scroll", updatePosition, true);
            };
        }, [align, anchorEl, isOpen, offset, viewportPadding]);

        if (!isOpen || !anchorEl) {
            return null;
        }

        return createPortal(
            <div
                ref={localRef}
                className={`z-[90] ${className}`}
                style={panelStyle}
            >
                {children}
            </div>,
            document.body,
        );
    },
);

SearchPopover.displayName = "SearchPopover";

export default SearchPopover;
