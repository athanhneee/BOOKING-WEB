import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type PaginationProps = {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
};

const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-center gap-3">
            <button
                type="button"
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
                aria-label="Trang trước"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700 hover:shadow-[0_18px_36px_-22px_rgba(8,145,178,0.35)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
                <FiChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => onChange(value)}
                    aria-label={`Trang ${value}`}
                    aria-current={value === page ? "page" : undefined}
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold transition-all ${value === page
                        ? "bg-cyan-500 text-white shadow-[0_18px_36px_-20px_rgba(6,182,212,0.7)]"
                        : "border border-slate-200 bg-white text-slate-600 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-[0_18px_36px_-22px_rgba(8,145,178,0.35)]"
                        }`}
                >
                    {value}
                </button>
            ))}

            <button
                type="button"
                onClick={() => onChange(page + 1)}
                disabled={page === totalPages}
                aria-label="Trang sau"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700 hover:shadow-[0_18px_36px_-22px_rgba(8,145,178,0.35)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
                <FiChevronRight size={18} />
            </button>
        </div>
    );
};

export default Pagination;
