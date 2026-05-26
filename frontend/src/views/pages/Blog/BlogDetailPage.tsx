import { FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";

import { APP_ROUTES } from "../../../config/routes";
import { blogPosts, formatBlogDate } from "../../../data/blogPosts";
import BlogPostCard from "../../components/blog/BlogPostCard";

const getRelatedPosts = (slug: string, category: string) => {
    const sameCategoryPosts = blogPosts.filter((post) => post.slug !== slug && post.category === category);
    const otherPosts = blogPosts.filter((post) => post.slug !== slug && post.category !== category);

    return [...sameCategoryPosts, ...otherPosts].slice(0, 3);
};

const BlogDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const post = blogPosts.find((item) => item.slug === slug);

    if (!post) {
        return (
            <div className="min-h-screen bg-[#f7f8fb] px-4 pt-28 text-slate-900 sm:px-6 lg:px-8">
                <section className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-10">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Không tìm thấy bài viết</p>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                        Bài viết bạn cần không tồn tại hoặc đã được thay đổi đường dẫn.
                    </h1>
                    <p className="mt-4 text-base leading-8 text-slate-600">
                        Bạn có thể quay lại danh sách bài viết để chọn một cẩm nang khác về du lịch và đặt villa tại Vũng Tàu.
                    </p>
                    <Link
                        to={APP_ROUTES.blog}
                        className="mt-7 inline-flex items-center justify-center rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
                    >
                        Quay lại danh sách bài viết
                    </Link>
                </section>
            </div>
        );
    }

    const relatedPosts = getRelatedPosts(post.slug, post.category);

    return (
        <div className="min-h-screen bg-[#f7f8fb] pt-24 text-slate-900 md:pt-28">
            <main>
                <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
                    <Link
                        to={APP_ROUTES.blog}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition-colors hover:text-cyan-900"
                    >
                        <FaArrowLeft className="text-xs" />
                        Quay lại danh sách bài viết
                    </Link>

                    <div className="mt-7 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <img src={post.coverImage} alt={post.title} className="h-[280px] w-full object-cover sm:h-[460px]" />

                        <article className="px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                <span className="rounded-full bg-cyan-50 px-3 py-1 font-semibold text-cyan-700">
                                    {post.category}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <FaCalendarAlt className="text-cyan-600" />
                                    {formatBlogDate(post.publishedAt)}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <FaClock className="text-cyan-600" />
                                    {post.readTime}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-cyan-600" />
                                    {post.location}
                                </span>
                            </div>

                            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
                                {post.title}
                            </h1>
                            <p className="mt-5 text-lg leading-8 text-slate-600">{post.excerpt}</p>

                            <div className="mt-8 space-y-5 border-t border-slate-100 pt-8 text-base leading-8 text-slate-700 sm:text-lg">
                                {post.content.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                        </article>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Bài viết liên quan</p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                                Gợi ý đọc tiếp
                            </h2>
                        </div>
                        <Link
                            to={APP_ROUTES.blog}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition-colors hover:text-cyan-900"
                        >
                            Xem tất cả bài viết
                            <FaArrowLeft className="rotate-180 text-xs" />
                        </Link>
                    </div>

                    <div className="mt-7 grid gap-5 md:grid-cols-3">
                        {relatedPosts.map((relatedPost) => (
                            <BlogPostCard key={relatedPost.id} post={relatedPost} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default BlogDetailPage;
