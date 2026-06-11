import { FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

import { APP_ROUTES } from "../../../config/routes";
import type { BlogPost } from "../../../data/blogPosts";

type BlogPostCardProps = {
    post: BlogPost;
};

const BlogPostCard = ({ post }: BlogPostCardProps) => {
    return (
        <Link
            to={APP_ROUTES.blogPost(post.slug)}
            aria-label={`Đọc bài viết: ${post.title}`}
            className="group block h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
        >
            <article className="flex h-full flex-col">
                <img src={post.coverImage} alt={post.title} className="h-48 w-full rounded-t-2xl object-cover" loading="lazy" />
                <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-600">
                            {post.category}
                        </span>
                        <span>{post.readTime}</span>
                    </div>
                    <h3 className="mt-3 min-h-16 text-lg font-bold leading-7 text-slate-950 transition-colors group-hover:text-cyan-600">
                        {post.title}
                    </h3>
                    <p className="mt-2 min-h-24 text-sm leading-7 text-slate-600">{post.excerpt}</p>
                    <div className="mt-auto flex items-center gap-2 pt-4 text-sm font-semibold text-cyan-600">
                        <FaMapMarkerAlt className="text-xs" />
                        {post.location}
                    </div>
                </div>
            </article>
        </Link>
    );
};

export default BlogPostCard;
