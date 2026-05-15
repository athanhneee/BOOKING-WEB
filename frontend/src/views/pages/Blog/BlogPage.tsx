import { FaArrowRight, FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import casamarImage from "../../../assets/img/casamar.jpg";
import lacaseImage from "../../../assets/img/lacase.jpg";
import sunsetImage from "../../../assets/img/sunset.jpg";
import { APP_ROUTES } from "../../../config/routes";

type BlogPost = {
    id: string;
    title: string;
    category: string;
    date: string;
    readTime: string;
    excerpt: string;
    imageUrl: string;
};

const featuredPost: BlogPost = {
    id: "vung-tau-villa-weekend",
    title: "Lên lịch nghỉ dưỡng Vũng Tàu 2 ngày 1 đêm cho nhóm bạn",
    category: "Cẩm nang chuyến đi",
    date: "05/05/2026",
    readTime: "5 phút đọc",
    excerpt:
        "Gợi ý cách chọn villa, sắp lịch check-in, chuẩn bị bữa BBQ và di chuyển giữa các điểm biển để chuyến đi ngắn vẫn thật trọn vẹn.",
    imageUrl: lacaseImage,
};

const blogPosts: BlogPost[] = [
    {
        id: "chon-villa-ho-boi",
        title: "Cách chọn villa hồ bơi phù hợp cho gia đình có trẻ nhỏ",
        category: "Kinh nghiệm đặt phòng",
        date: "28/04/2026",
        readTime: "4 phút đọc",
        excerpt:
            "Những tiêu chí nên kiểm tra trước khi đặt: độ sâu hồ bơi, hàng rào an toàn, số phòng ngủ và không gian sinh hoạt chung.",
        imageUrl: casamarImage,
    },
    {
        id: "bai-sau-hoang-hon",
        title: "Những khung giờ đẹp để ngắm biển và chụp ảnh ở Vũng Tàu",
        category: "Khám phá địa phương",
        date: "18/04/2026",
        readTime: "3 phút đọc",
        excerpt:
            "Từ Bãi Sau đến đường Hạ Long, đây là các khoảng thời gian dễ có ánh sáng đẹp và lịch trình di chuyển nhẹ nhàng.",
        imageUrl: sunsetImage,
    },
    {
        id: "dat-villa-nhom-dong",
        title: "Checklist đặt villa cho nhóm đông: giá, phòng ngủ và tiện nghi",
        category: "Mẹo lưu trú",
        date: "12/04/2026",
        readTime: "6 phút đọc",
        excerpt:
            "Một danh sách nhanh giúp bạn so sánh sức chứa, phụ thu, bếp, BBQ và chính sách hủy trước khi chốt nơi ở.",
        imageUrl: lacaseImage,
    },
];

const travelTips = [
    "Ưu tiên đặt sớm nếu đi cuối tuần hoặc dịp lễ.",
    "Kiểm tra số khách tối đa trước khi thanh toán.",
    "Hỏi host về bếp, BBQ, chỗ đậu xe và giờ nhận phòng.",
    "Giữ lịch trình nhẹ để có thời gian tận hưởng villa.",
];

const BlogPage = () => {
    return (
        <div className="min-h-screen bg-[#f7f8fb] pt-24 text-slate-900 md:pt-28">
            <main>
                <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Blog Minh Thanh Villa</p>
                            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
                                Cẩm nang chọn villa, ăn chơi và nghỉ dưỡng tại Vũng Tàu
                            </h1>
                            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                                Tổng hợp kinh nghiệm thực tế cho khách đặt villa: chọn khu vực, lên lịch trình, chuẩn bị nhóm đông và tận hưởng kỳ nghỉ gần biển gọn gàng hơn.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
                            <div>
                                <p className="text-3xl font-bold text-cyan-700">23+</p>
                                <p className="mt-1 text-sm text-slate-500">villa đang gợi ý</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-cyan-700">24/7</p>
                                <p className="mt-1 text-sm text-slate-500">hỗ trợ khách</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white py-10">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:px-8">
                        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                            <img src={featuredPost.imageUrl} alt={featuredPost.title} className="h-[280px] w-full object-cover sm:h-[420px]" />
                            <div className="p-5 sm:p-7">
                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                    <span className="rounded-full bg-cyan-50 px-3 py-1 font-semibold text-cyan-700">{featuredPost.category}</span>
                                    <span className="inline-flex items-center gap-2">
                                        <FaCalendarAlt className="text-cyan-600" />
                                        {featuredPost.date}
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <FaClock className="text-cyan-600" />
                                        {featuredPost.readTime}
                                    </span>
                                </div>
                                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{featuredPost.title}</h2>
                                <p className="mt-3 text-base leading-8 text-slate-600">{featuredPost.excerpt}</p>
                            </div>
                        </article>

                        <aside className="rounded-2xl border border-slate-100 bg-[#f7f8fb] p-5 sm:p-6">
                            <h2 className="text-xl font-bold text-slate-950">Gợi ý nhanh trước chuyến đi</h2>
                            <div className="mt-5 space-y-4">
                                {travelTips.map((tip, index) => (
                                    <div key={tip} className="flex gap-3">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white">
                                            {index + 1}
                                        </span>
                                        <p className="pt-1 text-sm leading-6 text-slate-600">{tip}</p>
                                    </div>
                                ))}
                            </div>
                            <Link
                                to={APP_ROUTES.search}
                                className="mt-7 inline-flex items-center gap-2 rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
                            >
                                Xem nơi lưu trú
                                <FaArrowRight className="text-xs" />
                            </Link>
                        </aside>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Bài viết mới</p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Kinh nghiệm lưu trú nổi bật</h2>
                        </div>
                        <p className="max-w-xl text-sm leading-7 text-slate-500">
                            Nội dung tập trung vào nhu cầu thực tế khi đặt villa tại Vũng Tàu, từ nhóm gia đình đến nhóm bạn đông người.
                        </p>
                    </div>

                    <div className="mt-7 grid gap-5 md:grid-cols-3">
                        {blogPosts.map((post) => (
                            <article key={post.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                                <img src={post.imageUrl} alt={post.title} className="h-48 w-full object-cover" loading="lazy" />
                                <div className="p-5">
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                        <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">{post.category}</span>
                                        <span>{post.readTime}</span>
                                    </div>
                                    <h3 className="mt-3 min-h-16 text-lg font-bold leading-7 text-slate-950">{post.title}</h3>
                                    <p className="mt-2 min-h-24 text-sm leading-7 text-slate-600">{post.excerpt}</p>
                                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-cyan-700">
                                        <FaMapMarkerAlt className="text-xs" />
                                        Vũng Tàu
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default BlogPage;
