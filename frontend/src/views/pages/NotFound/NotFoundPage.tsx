import { Link, useNavigate } from "react-router-dom";

import { APP_ROUTES } from "../../../config/routes";

const NotFoundPage = () => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate(APP_ROUTES.home);
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-cyan-50 via-white to-teal-50">
            <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl" />
            <div className="absolute -left-16 top-20 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl" />
            <div className="absolute -right-20 bottom-12 h-64 w-64 rounded-full bg-cyan-200/25 blur-3xl" />

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-14 px-6 py-10 lg:flex-row lg:gap-10 lg:px-10 xl:px-12">
                <div className="relative flex w-full max-w-[720px] items-end justify-center lg:flex-1" aria-hidden="true">
                    <div className="absolute bottom-3 h-40 w-[88%] rounded-full bg-teal-200/55 blur-2xl" />
                    <div className="absolute left-[11%] top-6 h-10 w-20 rounded-full bg-cyan-200/80" />
                    <div className="absolute left-[24%] top-16 h-8 w-14 rounded-full bg-teal-200/70" />
                    <div className="absolute right-[10%] top-[12%] flex h-24 w-24 rotate-12 items-center justify-center rounded-2xl border-2 border-cyan-300/70 bg-white/80 shadow-[0_18px_50px_rgba(13,148,136,0.16)] backdrop-blur">
                        <span className="text-2xl font-black uppercase tracking-[0.32em] text-teal-500">404</span>
                    </div>

                    <div className="relative w-full max-w-[620px] pb-24">
                        <div className="absolute left-16 top-6 h-[380px] w-[76%] rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-[0_28px_70px_rgba(8,145,178,0.28)]" />
                        <div className="absolute left-8 top-10 h-[380px] w-[76%] rounded-2xl bg-teal-950/90 shadow-[0_20px_40px_rgba(15,118,110,0.24)]" />

                        <div className="relative ml-auto w-[84%] rounded-2xl border-[10px] border-cyan-300 bg-white shadow-[0_35px_80px_rgba(8,145,178,0.22)]">
                            <div className="rounded-2xl bg-gradient-to-b from-cyan-50 via-white to-teal-50 p-6 sm:p-8">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-cyan-300" />
                                    <span className="h-3 w-3 rounded-full bg-cyan-200" />
                                    <span className="h-3 w-3 rounded-full bg-teal-300" />
                                </div>

                                <div className="mt-5 h-3 w-24 rounded-full bg-cyan-100" />

                                <div className="mt-8 flex items-end gap-1 sm:gap-2">
                                    <span className="text-[5.5rem] font-black leading-none tracking-[-0.08em] text-cyan-400 sm:text-[7.5rem]">4</span>
                                    <span className="text-[5.5rem] font-black leading-none tracking-[-0.08em] text-teal-500 sm:text-[7.5rem]">0</span>
                                    <span className="text-[5.5rem] font-black leading-none tracking-[-0.08em] text-cyan-500 sm:text-[7.5rem]">4</span>
                                </div>

                                <p className="mt-3 text-xl font-black uppercase tracking-[0.32em] text-teal-800 sm:text-2xl">Error</p>
                                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.32em] text-cyan-500 sm:text-base">
                                    Page not found
                                </p>

                                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                                    <div className="h-14 rounded-2xl bg-cyan-100/80" />
                                    <div className="h-14 rounded-2xl bg-teal-100/80" />
                                    <div className="h-14 rounded-2xl bg-cyan-100/80" />
                                </div>
                            </div>
                        </div>

                        <div className="relative mx-auto mt-[-4px] h-10 w-28 rounded-b-2xl bg-gradient-to-b from-cyan-400 to-teal-600 shadow-[0_12px_24px_rgba(13,148,136,0.25)]" />
                        <div className="mx-auto h-7 w-52 rounded-full bg-teal-500/90 shadow-[0_16px_32px_rgba(13,148,136,0.18)]" />

                        <div className="absolute bottom-2 left-[18%] h-24 w-72 rounded-full border-[4px] border-teal-900/70" />
                       
                  
                    </div>
                </div>

                <div className="w-full max-w-[560px] flex-1 text-center lg:text-left">
                    <span className="inline-flex rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 shadow-sm">
                        404 / Điều hướng lạc nhịp
                    </span>

                    <h1 className="mt-6 text-4xl font-semibold leading-[1.08] text-teal-950 sm:text-5xl xl:text-[4.2rem]">
                        Xin lỗi, chúng tôi không tìm thấy trang bạn cần.
                    </h1>

                    <p className="mt-5 text-base leading-8 text-teal-700/85 sm:text-lg">
                        Liên kết này có thể đã thay đổi hoặc không còn tồn tại. Bạn có thể quay về trang chủ hoặc tiếp tục khám
                        phá các chỗ ở đang mở để không bị ngắt mạch trải nghiệm.
                    </p>

                    <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                        <Link
                            to={APP_ROUTES.home}
                            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-7 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(6,182,212,0.28)] transition-transform duration-200 hover:-translate-y-0.5"
                        >
                            Về trang chủ
                        </Link>

                        <button
                            type="button"
                            onClick={handleGoBack}
                            className="inline-flex items-center justify-center rounded-full border border-teal-200 bg-white/85 px-7 py-4 text-base font-semibold text-teal-700 shadow-[0_14px_32px_rgba(15,118,110,0.12)] transition-colors duration-200 hover:border-teal-300 hover:bg-white"
                        >
                            Quay lại trang trước
                        </button>
                    </div>

                    <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
                        <div className="rounded-2xl border border-cyan-200/80 bg-white/75 p-5 shadow-[0_18px_40px_rgba(8,145,178,0.12)] backdrop-blur">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Mã lỗi</p>
                            <p className="mt-3 text-4xl font-black text-cyan-500">404</p>
                            <p className="mt-2 text-sm leading-6 text-teal-700/80">Trang hiện tại không có dữ liệu để hiển thị.</p>
                        </div>

                        <div className="rounded-2xl border border-teal-200/80 bg-white/75 p-5 shadow-[0_18px_40px_rgba(15,118,110,0.12)] backdrop-blur">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Gợi ý tiếp theo</p>
                            <p className="mt-3 text-lg font-semibold leading-7 text-teal-900">
                                Kiểm tra lại đường dẫn hoặc chuyển sang danh sách nơi lưu trú.
                            </p>
                            <Link
                                to={APP_ROUTES.search}
                                className="mt-4 inline-flex text-sm font-semibold text-cyan-600 transition-colors hover:text-teal-600"
                            >
                                Khám phá nơi lưu trú
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
