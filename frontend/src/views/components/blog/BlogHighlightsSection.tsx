import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

import { APP_ROUTES } from "../../../config/routes";
import { homeBlogPosts } from "../../../data/blogPosts";
import BlogPostCard from "./BlogPostCard";

const BlogHighlightsSection = () => {
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

                <div className="mt-7 grid gap-5 md:grid-cols-3">
                    {homeBlogPosts.map((post) => (
                        <BlogPostCard key={post.id} post={post} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BlogHighlightsSection;
