import { useEffect, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

import { APP_ROUTES } from "../../../config/routes";
import type { BlogPost } from "../../../data/blogPosts";
import { getBlogs } from "../../../services/blogService";
import BlogPostCard from "./BlogPostCard";

const BlogHighlightsSection = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadPosts = async () => {
            setIsLoading(true);
            setLoadError("");

            try {
                const result = await getBlogs({ page: 1, limit: 3 });

                if (!cancelled) {
                    setPosts(result.items);
                }
            } catch {
                if (!cancelled) {
                    setPosts([]);
                    setLoadError("Không tải được bài viết mới.");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadPosts();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section className="bg-[#f7f8fb]">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Bài viết mới</p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                            Kinh nghiệm lưu trú nổi bật
                        </h2>
                    </div>
                    <div className="max-w-xl">
                        <p className="text-sm leading-7 text-slate-500">
                            Nội dung tập trung vào nhu cầu thực tế khi đặt villa tại Vũng Tàu, từ nhóm gia đình đến nhóm bạn đông người.
                        </p>
                        <Link
                            to={APP_ROUTES.blog}
                            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition-colors hover:text-cyan-900"
                        >
                            Xem tất cả bài viết
                            <FaArrowRight className="text-xs" />
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <div className="mt-7 rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm font-medium text-slate-500 shadow-sm">
                        Đang tải bài viết...
                    </div>
                ) : loadError ? (
                    <div className="mt-7 rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm font-medium text-amber-700">
                        {loadError}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="mt-7 rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm font-medium text-slate-500 shadow-sm">
                        Chưa có bài viết nổi bật.
                    </div>
                ) : (
                    <div className="mt-7 grid gap-5 md:grid-cols-3">
                        {posts.map((post) => (
                            <BlogPostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default BlogHighlightsSection;
