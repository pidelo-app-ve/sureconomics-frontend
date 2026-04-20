import { userRequest } from "../lib/userApi";
import { normalizePaginatedPosts, normalizePaginatedSubmissions } from "./contentMappers";

export const getMyBookmarks = async (params = {}) => {
  const data = await userRequest("/me/bookmarks", {
    method: "GET",
    query: { page: params.page, limit: params.limit },
  });
  return normalizePaginatedPosts(data);
};

export const addBookmark = (postId) =>
  userRequest(`/posts/${encodeURIComponent(postId)}/bookmark`, { method: "POST" });

export const removeBookmark = (postId) =>
  userRequest(`/posts/${encodeURIComponent(postId)}/bookmark`, { method: "DELETE" });

export const postComment = (slug, content) =>
  userRequest(`/posts/${encodeURIComponent(slug)}/comments`, {
    method: "POST",
    json: { content },
  });

export const listMySubmissions = async (params = {}) => {
  const data = await userRequest("/me/submissions", {
    method: "GET",
    query: { page: params.page, limit: params.limit },
  });
  return normalizePaginatedSubmissions(data);
};

export const createSubmission = (payload) =>
  userRequest("/me/submissions", {
    method: "POST",
    json: {
      title: payload.title,
      excerpt: payload.excerpt,
      content: payload.content,
      featured_image_url: payload.featured_image_url ?? payload.featuredImageUrl ?? "",
    },
  });

export const getSubmissionById = async (id) => {
  const data = await userRequest(`/me/submissions/${encodeURIComponent(id)}`, { method: "GET" });
  if (!data || typeof data !== "object") {
    return null;
  }
  return {
    id: String(data.id ?? id),
    title: String(data.title ?? ""),
    excerpt: String(data.excerpt ?? ""),
    content: String(data.content ?? ""),
    featuredImageUrl: String(data.featured_image_url ?? data.featuredImageUrl ?? ""),
    status: String(data.status ?? ""),
    createdAt: String(data.created_at ?? data.createdAt ?? ""),
  };
};
