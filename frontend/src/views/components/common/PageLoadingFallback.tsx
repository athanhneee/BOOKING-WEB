const PageLoadingFallback = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f7f8fa]">
        {/* Decorative background blurs */}
        <div className="pointer-events-none absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/3 h-64 w-64 rounded-full bg-teal-200/20 blur-3xl" />

        {/* Glass card */}
        <div className="relative flex flex-col items-center gap-6 rounded-3xl border border-white/60 bg-white/70 px-12 py-10 shadow-[0_32px_80px_-30px_rgba(6,182,212,0.18)] backdrop-blur-xl">
            {/* Animated spinner ring */}
            <div className="relative flex h-16 w-16 items-center justify-center">
                <div
                    className="absolute inset-0 rounded-full border-[3px] border-transparent"
                    style={{
                        borderTopColor: "#06b6d4",
                        borderRightColor: "#0891b2",
                        animation: "mtv-spin 0.85s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite",
                    }}
                />
                <div
                    className="absolute inset-1.5 rounded-full border-[2px] border-transparent"
                    style={{
                        borderBottomColor: "#22d3ee",
                        borderLeftColor: "#67e8f9",
                        animation: "mtv-spin 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite reverse",
                    }}
                />
                {/* Center dot */}
                <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
            </div>

            {/* Brand text */}
            <div className="flex flex-col items-center gap-1.5">
                <p className="text-sm font-bold tracking-wide text-slate-800">
                    Minh Thành Villa
                </p>
                <p
                    className="text-xs font-medium text-slate-400"
                    style={{ animation: "mtv-pulse 1.8s ease-in-out infinite" }}
                >
                    Đang tải trang...
                </p>
            </div>
        </div>

        {/* Inline keyframes */}
        <style>{`
            @keyframes mtv-spin {
                to { transform: rotate(360deg); }
            }
            @keyframes mtv-pulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
        `}</style>
    </div>
);

export default PageLoadingFallback;
