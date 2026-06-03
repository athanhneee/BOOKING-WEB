import { useCallback, useEffect, useState, type ReactNode } from "react";
import { FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";

import { APP_ROUTES } from "../../../config/routes";
import { formatBlogDate, type BlogPost } from "../../../data/blogPosts";
import { ApiError } from "../../../services/api/apiClient";
import { getBlogBySlug, getBlogs } from "../../../services/blogService";
import BlogPostCard from "../../components/blog/BlogPostCard";

const getRelatedPosts = (currentPost: BlogPost, posts: BlogPost[]) => {
    const sameCategoryPosts = posts.filter(
        (post) => post.slug !== currentPost.slug && post.category === currentPost.category,
    );
    const otherPosts = posts.filter(
        (post) => post.slug !== currentPost.slug && post.category !== currentPost.category,
    );

    return [...sameCategoryPosts, ...otherPosts].slice(0, 3);
};

type StatusCardProps = {
    title: string;
    description?: string;
    action?: ReactNode;
};

const StatusCard = ({ title, description, action }: StatusCardProps) => (
    <div className="min-h-screen bg-[#f7f8fb] px-4 pt-28 text-slate-900 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Blog Minh Thành Villa</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
            {description ? <p className="mt-4 text-base leading-8 text-slate-600">{description}</p> : null}
            {action ? <div className="mt-7">{action}</div> : null}
        </section>
    </div>
);

const BlogDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [notFound, setNotFound] = useState(false);

    const loadPost = useCallback(async () => {
        if (!slug) {
            setNotFound(true);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setLoadError("");
        setNotFound(false);

        try {
            const result = await getBlogBySlug(slug);
            setPost(result);

            try {
                const blogList = await getBlogs({ page: 1, limit: 12 });
                setRelatedPosts(getRelatedPosts(result, blogList.items));
            } catch {
                setRelatedPosts([]);
            }
        } catch (error) {
            setPost(null);
            setRelatedPosts([]);

            if (error instanceof ApiError && error.status === 404) {
                setNotFound(true);
            } else {
                setLoadError("Không tải được bài viết. Vui lòng thử lại.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        void loadPost();
    }, [loadPost]);

    if (isLoading) {
        return <StatusCard title="Đang tải bài viết..." />;
    }

    if (loadError) {
        return (
            <StatusCard
                title="Không tải được bài viết"
                description={loadError}
                action={
                    <button
                        type="button"
                        onClick={() => void loadPost()}
                        className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
                    >
                        Tải lại
                    </button>
                }
            />
        );
    }

    if (notFound || !post) {
        return (
            <StatusCard
                title="Bài viết bạn cần không tồn tại hoặc đã được thay đổi đường dẫn."
                description="Bạn có thể quay lại danh sách bài viết để chọn một cẩm nang khác về du lịch và đặt villa tại Vũng Tàu."
                action={
                    <Link
                        to={APP_ROUTES.blog}
                        className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
                    >
                        Quay lại danh sách bài viết
                    </Link>
                }
            />
        );
    }

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
                                    <FaCalendarAlt className="text-cyan-500" />
                                    {formatBlogDate(post.publishedAt)}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <FaClock className="text-cyan-500" />
                                    {post.readTime}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-cyan-500" />
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

                {relatedPosts.length > 0 ? (
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
                ) : null}
            </main>
        </div>
    );
};

export default BlogDetailPage;
