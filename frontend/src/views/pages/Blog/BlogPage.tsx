import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { FaArrowRight, FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

import { APP_ROUTES } from "../../../config/routes";
import { formatBlogDate, type BlogPost } from "../../../data/blogPosts";
import { getBlogs } from "../../../services/blogService";
import BlogPostCard from "../../components/blog/BlogPostCard";

const travelTips = [
    "Ưu tiên đặt sớm nếu đi cuối tuần hoặc dịp lễ.",
    "Kiểm tra số khách tối đa trước khi thanh toán.",
    "Hỏi host về bếp, BBQ, chỗ đậu xe và giờ nhận phòng.",
    "Giữ lịch trình nhẹ để có thời gian tận hưởng villa.",
];

type BlogStatusPanelProps = {
    title: string;
    description?: string;
    action?: ReactNode;
};

const BlogStatusPanel = ({ title, description, action }: BlogStatusPanelProps) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p> : null}
        {action ? <div className="mt-5">{action}</div> : null}
    </div>
);

const BlogPage = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [totalPosts, setTotalPosts] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const loadBlogs = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");

        try {
            const result = await getBlogs({ page: 1, limit: 50 });
            setPosts(result.items);
            setTotalPosts(result.pagination.total);
        } catch {
            setPosts([]);
            setTotalPosts(0);
            setLoadError("Không tải được danh sách blog. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadBlogs();
    }, [loadBlogs]);

    const featuredBlogPost = posts[0] ?? null;
    const visiblePostCount = useMemo(() => totalPosts || posts.length, [posts.length, totalPosts]);

    return (
        <div className="min-h-screen bg-[#f7f8fb] pt-24 text-slate-900 md:pt-28">
            <main>
                <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-600">
                                Blog Minh Thanh Villa
                            </p>
                            <h1 className="mt-4 max-w-4xl text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
                                Cẩm nang chọn villa, ăn chơi và nghỉ dưỡng tại Vũng Tàu
                            </h1>
                            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                                Tổng hợp kinh nghiệm thực tế cho khách đặt villa: chọn khu vực, lên lịch trình, chuẩn bị nhóm đông và tận hưởng kỳ nghỉ gần biển gọn gàng hơn.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
                            <div>
                                <p className="text-2xl font-bold text-cyan-600 sm:text-3xl">{visiblePostCount || "--"}</p>
                                <p className="mt-1 text-sm text-slate-500">bài viết kinh nghiệm</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-cyan-600 sm:text-3xl">24/7</p>
                                <p className="mt-1 text-sm text-slate-500">hỗ trợ khách</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white py-10">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:px-8">
                        {isLoading ? (
                            <BlogStatusPanel title="Đang tải blog..." />
                        ) : loadError ? (
                            <BlogStatusPanel
                                title="Không tải được blog"
                                description={loadError}
                                action={
                                    <button
                                        type="button"
                                        onClick={() => void loadBlogs()}
                                        className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
                                    >
                                        Tải lại
                                    </button>
                                }
                            />
                        ) : featuredBlogPost ? (
                            <Link
                                to={APP_ROUTES.blogPost(featuredBlogPost.slug)}
                                className="group block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                aria-label={`Đọc bài viết: ${featuredBlogPost.title}`}
                            >
                                <article>
                                    <img
                                        src={featuredBlogPost.coverImage}
                                        alt={featuredBlogPost.title}
                                        className="h-[280px] w-full object-cover sm:h-[420px]"
                                    />
                                    <div className="p-5 sm:p-7">
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                            <span className="rounded-full bg-cyan-50 px-3 py-1 font-semibold text-cyan-600">
                                                {featuredBlogPost.category}
                                            </span>
                                            <span className="inline-flex items-center gap-2">
                                                <FaCalendarAlt className="text-cyan-500" />
                                                {formatBlogDate(featuredBlogPost.publishedAt)}
                                            </span>
                                            <span className="inline-flex items-center gap-2">
                                                <FaClock className="text-cyan-500" />
                                                {featuredBlogPost.readTime}
                                            </span>
                                            <span className="inline-flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-cyan-500" />
                                                {featuredBlogPost.location}
                                            </span>
                                        </div>
                                        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 transition-colors group-hover:text-cyan-600 sm:text-3xl">
                                            {featuredBlogPost.title}
                                        </h2>
                                        <p className="mt-3 text-base leading-8 text-slate-600">{featuredBlogPost.excerpt}</p>
                                    </div>
                                </article>
                            </Link>
                        ) : (
                            <BlogStatusPanel
                                title="Chưa có bài viết"
                                description="Blog sẽ hiển thị khi admin xuất bản bài đầu tiên."
                            />
                        )}

                        <aside className="rounded-2xl border border-slate-100 bg-[#f7f8fb] p-5 sm:p-6">
                            <h2 className="text-xl font-bold text-slate-950">Gợi ý nhanh trước chuyến đi</h2>
                            <div className="mt-5 space-y-4">
                                {travelTips.map((tip, index) => (
                                    <div key={tip} className="flex gap-3">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white">
                                            {index + 1}
                                        </span>
                                        <p className="pt-1 text-sm leading-6 text-slate-600">{tip}</p>
                                    </div>
                                ))}
                            </div>
                            <Link
                                to={APP_ROUTES.search}
                                className="mt-7 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
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
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-600">Bài viết mới</p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                Kinh nghiệm lưu trú nổi bật
                            </h2>
                        </div>
                        <p className="max-w-xl text-sm leading-7 text-slate-500">
                            Nội dung tập trung vào nhu cầu thực tế khi đặt villa tại Vũng Tàu, từ nhóm gia đình đến nhóm bạn đông người.
                        </p>
                    </div>

                    {!isLoading && !loadError && posts.length > 0 ? (
                        <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {posts.map((post) => (
                                <BlogPostCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : null}
                </section>
            </main>
        </div>
    );
};

export default BlogPage;
