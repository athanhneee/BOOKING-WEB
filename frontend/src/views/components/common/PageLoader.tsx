type PageLoaderProps = {
    label?: string;
};

const PageLoader = ({ label = "Đang tải..." }: PageLoaderProps) => {
    return (
        <div className="flex min-h-[240px] w-full items-center justify-center px-4 py-12" role="status" aria-live="polite">
            <div className="flex flex-col items-center gap-4 text-center text-sm font-medium text-slate-500">
                <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-cyan-600 border-t-transparent shadow-sm"></div>
                <span>{label}</span>
            </div>
        </div>
    );
};

export default PageLoader;
