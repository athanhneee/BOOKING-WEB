import { apiClient, type PaginationMeta } from "./api/apiClient";
import type { BlogPost } from "../data/blogPosts";
import { resolveBlogCoverImage } from "../data/blogPosts";

type ApiBlogPost = Omit<BlogPost, "id" | "coverImage" | "content" | "publishedAt"> & {
    id?: string | number;
    blogId?: string | number;
    coverImage?: string | null;
    content?: string[] | null;
    publishedAt?: string | null;
    status?: "draft" | "published";
};

export type BlogListResponse = {
    items: BlogPost[];
    pagination: PaginationMeta;
};

const toContent = (content: ApiBlogPost["content"]) =>
    Array.isArray(content) ? content.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];

const mapBlogPost = (post: ApiBlogPost): BlogPost => ({
    id: String(post.id ?? post.blogId ?? post.slug),
    slug: post.slug,
    title: post.title,
    category: post.category,
    readTime: post.readTime ?? "",
    location: post.location ?? "",
    excerpt: post.excerpt,
    coverImage: resolveBlogCoverImage(post.coverImage, post.slug),
    content: toContent(post.content),
    publishedAt: post.publishedAt ?? "",
});

export const getBlogs = async (query?: {
    q?: string;
    category?: string;
    page?: number;
    limit?: number;
}) => {
    const result = await apiClient.get<{
        items: ApiBlogPost[];
        pagination: PaginationMeta;
    }>("/api/blogs", { query });

    return {
        ...result,
        items: result.items.map(mapBlogPost),
    };
};

export const getBlogBySlug = async (slug: string) => {
    const result = await apiClient.get<ApiBlogPost>(`/api/blogs/${slug}`);

    return mapBlogPost(result);
};
