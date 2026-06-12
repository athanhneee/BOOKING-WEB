import { Outlet } from "react-router-dom";
import heroOne from "../../assets/img/NDT05929-HDR1.jpg";
import heroTwo from "../../assets/img/nabi.JPG";

const photoCards = [
    {
        image: heroOne,
        alt: "Không gian nghỉ dưỡng tạiminh thanh villa ",
        title: "Không gian nghỉ dưỡng riêng tư",
        description: "Biệt thự rộng rãi, tiện nghi cho gia đình và nhóm bạn tận hưởng kỳ nghỉ trọn vẹn.",
        className: "left-[8%] top-[12%] rotate-[-10deg]",
    },
    {
        image: heroTwo,
        alt: "Khung cảnh thư giãn tạiminh thanh villa ",
        title: "Trải nghiệm thư giãn gần biển",
        description: "Bình yên, ấm cúng và luôn sẵn sàng cho những buổi sáng đầy nắng tại Vũng Tàu.",
        className: "right-[8%] bottom-[10%] rotate-[9deg]",
    },
];

const AuthLayout = () => {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#eef2f7] font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(93,83,247,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,138,84,0.16),transparent_28%)]" />
            <div className="absolute left-0 top-16 h-72 w-72 -translate-x-1/3 rounded-full bg-[#5d53f7]/14 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/4 rounded-full bg-[#ff8a54]/16 blur-3xl" />

            <div className="pointer-events-none absolute inset-0 hidden xl:block">
                {photoCards.map((card) => (
                    <div
                        key={card.title}
                        className={`absolute w-[270px] rounded-3xl border border-white/70 bg-white/78 p-3 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.55)] backdrop-blur-lg ${card.className}`}
                    >
                        <img src={card.image} alt={card.alt} className="h-72 w-full rounded-3xl object-cover" />
                        <div className="px-2 pb-2 pt-4">
                            <p className="text-lg font-bold text-slate-900">{card.title}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="w-full max-w-[560px]">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
