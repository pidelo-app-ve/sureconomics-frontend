const asString = (value) => (typeof value === "string" ? value : value == null ? "" : String(value));

const asNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const pickFirstNonEmpty = (...values) => values.find((v) => v !== undefined && v !== null && String(v).trim() !== "");

const normalizeSlug = (value) => {
  const s = asString(value).trim();
  return s;
};

const normalizeMaybeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
};

export const normalizeCategory = (raw) => {
  if (!raw || typeof raw !== "object") {
    return { id: "", name: "", slug: "" };
  }
  return {
    id: asString(raw.id ?? raw._id ?? raw.uuid ?? ""),
    name: asString(raw.name ?? raw.label ?? raw.title ?? ""),
    slug: normalizeSlug(raw.slug ?? raw.key ?? raw.code ?? ""),
  };
};

export const normalizeTag = (raw) => {
  if (!raw || typeof raw !== "object") {
    return { id: "", name: "", slug: "" };
  }
  return {
    id: asString(raw.id ?? raw._id ?? raw.uuid ?? ""),
    name: asString(raw.name ?? raw.label ?? raw.title ?? ""),
    slug: normalizeSlug(raw.slug ?? raw.key ?? raw.code ?? ""),
  };
};

export const normalizePost = (raw) => {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      slug: "",
      title: "",
      excerpt: "",
      content: "",
      featuredImage: "",
      categories: [],
      tags: [],
      author: "",
      publishDate: "",
      metaTitle: "",
      metaDescription: "",
      canonicalUrl: "",
    };
  }

  const categoriesRaw = pickFirstNonEmpty(raw.categories, raw.category, raw.category_list, raw.categoryList);
  const tagsRaw = pickFirstNonEmpty(raw.tags, raw.tag_list, raw.tagList);

  const normalizedCategories = normalizeMaybeArray(categoriesRaw)
    .map((c) => (typeof c === "string" ? { name: c, slug: c } : c))
    .map(normalizeCategory)
    .filter((c) => c.slug || c.name);

  const normalizedTags = normalizeMaybeArray(tagsRaw)
    .map((t) => (typeof t === "string" ? { name: t, slug: t } : t))
    .map(normalizeTag)
    .filter((t) => t.slug || t.name);

  const publishDate =
    asString(
      pickFirstNonEmpty(
        raw.publishDate,
        raw.published_at,
        raw.publishedAt,
        raw.created_at,
        raw.createdAt,
        raw.date
      )
    ) || "";

  return {
    id: asString(raw.id ?? raw._id ?? raw.uuid ?? ""),
    slug: normalizeSlug(raw.slug ?? raw.permalink ?? ""),
    title: asString(raw.title ?? raw.name ?? ""),
    excerpt: asString(raw.excerpt ?? raw.summary ?? raw.description ?? ""),
    content: asString(raw.content ?? raw.body ?? raw.html ?? raw.markdown ?? ""),
    featuredImage: asString(
      pickFirstNonEmpty(
        raw.featuredImage,
        raw.featured_image,
        raw.featured_image_url,
        raw.image,
        raw.imageUrl,
        raw.image_url,
        raw.cover
      )
    ),
    categories: normalizedCategories,
    tags: normalizedTags,
    author: asString(
      pickFirstNonEmpty(raw.author?.name, raw.author_name, raw.authorName, raw.author, raw.byline)
    ),
    publishDate,
    metaTitle: asString(pickFirstNonEmpty(raw.metaTitle, raw.meta_title, raw.seo_title, raw.seoTitle, raw.title)),
    metaDescription: asString(
      pickFirstNonEmpty(raw.metaDescription, raw.meta_description, raw.seo_description, raw.seoDescription, raw.excerpt)
    ),
    canonicalUrl: asString(pickFirstNonEmpty(raw.canonicalUrl, raw.canonical_url, raw.url, raw.link)),
  };
};

export const normalizeHeadline = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  return {
    id: asNumber(raw.id) ?? raw.id,
    title: asString(raw.title) ?? "",
    summary: asString(raw.summary ?? raw.excerpt) ?? "",
    sourceName: asString(raw.source_name ?? raw.sourceName) ?? "",
    sourceUrl: asString(raw.source_url ?? raw.sourceUrl) ?? "",
    publishedAt: asString(raw.published_at ?? raw.publishDate) ?? "",
    isActive: raw.is_active !== false,
  };
};

export const normalizePaginatedPosts = (payload) => {
  if (!payload) {
    return { items: [], page: 1, limit: 10, total: 0, totalPages: 1 };
  }

  if (
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    payload.data !== undefined &&
    payload.meta != null &&
    typeof payload.meta === "object"
  ) {
    const itemsRaw = payload.data;
    const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizePost) : [];
    const m = payload.meta;
    const page = Number(m.page ?? m.current_page ?? 1) || 1;
    const limit = Number(m.limit ?? m.per_page ?? m.page_size ?? 10) || 10;
    const total = Number(m.total ?? m.count ?? m.total_items ?? items.length) || 0;
    const totalPages =
      Number(m.totalPages ?? m.total_pages ?? m.pages) ||
      Math.max(1, Math.ceil((Number.isFinite(total) && total > 0 ? total : items.length) / (limit || 1)));
    return { items, page, limit, total: Number.isFinite(total) ? total : items.length, totalPages };
  }

  // Accept array response: [post, post, ...]
  if (Array.isArray(payload)) {
    const items = payload.map(normalizePost);
    return { items, page: 1, limit: items.length || 10, total: items.length, totalPages: 1 };
  }

  const itemsRaw =
    payload.items ??
    payload.results ??
    payload.posts ??
    payload.data ??
    payload;

  const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizePost) : [];
  const page = Number(payload.page ?? payload.current_page ?? 1) || 1;
  const limit = Number(payload.limit ?? payload.per_page ?? payload.page_size ?? 10) || 10;

  const total = Number(
    payload.total ??
      payload.count ??
      payload.total_items ??
      payload.totalResults ??
      payload.total_posts ??
      items.length
  );

  const totalPages =
    Number(payload.totalPages ?? payload.total_pages ?? payload.pages) ||
    Math.max(1, Math.ceil((Number.isFinite(total) ? total : items.length) / limit));

  return { items, page, limit, total: Number.isFinite(total) ? total : items.length, totalPages };
};

export const normalizeComment = (raw) => {
  if (!raw || typeof raw !== "object") {
    return { id: "", content: "", author: "", status: "", createdAt: "" };
  }
  return {
    id: asString(raw.id ?? raw._id ?? raw.uuid ?? ""),
    content: asString(raw.content ?? raw.body ?? raw.text ?? ""),
    author: asString(
      pickFirstNonEmpty(raw.author?.name, raw.author_name, raw.authorName, raw.author, raw.user?.name, "Lector")
    ),
    status: asString(raw.status ?? raw.state ?? ""),
    createdAt: asString(
      pickFirstNonEmpty(raw.created_at, raw.createdAt, raw.publishDate, raw.published_at, raw.date)
    ),
  };
};

export const normalizePaginatedList = (payload, mapItem) => {
  if (!payload) {
    return { items: [], page: 1, limit: 10, total: 0, totalPages: 1 };
  }

  if (
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    payload.data !== undefined &&
    payload.meta != null &&
    typeof payload.meta === "object"
  ) {
    const itemsRaw = payload.data;
    const items = Array.isArray(itemsRaw) ? itemsRaw.map(mapItem) : [];
    const m = payload.meta;
    const page = Number(m.page ?? m.current_page ?? 1) || 1;
    const limit = Number(m.limit ?? m.per_page ?? m.page_size ?? 10) || 10;
    const total = Number(m.total ?? m.count ?? m.total_items ?? items.length) || 0;
    const totalPages =
      Number(m.totalPages ?? m.total_pages ?? m.pages) ||
      Math.max(1, Math.ceil((Number.isFinite(total) && total > 0 ? total : items.length) / (limit || 1)));
    return { items, page, limit, total: Number.isFinite(total) ? total : items.length, totalPages };
  }

  if (Array.isArray(payload)) {
    const items = payload.map(mapItem);
    return { items, page: 1, limit: items.length || 10, total: items.length, totalPages: 1 };
  }

  const itemsRaw = payload.items ?? payload.results ?? payload.comments ?? payload.data ?? payload;
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(mapItem) : [];
  const page = Number(payload.page ?? payload.current_page ?? 1) || 1;
  const limit = Number(payload.limit ?? payload.per_page ?? payload.page_size ?? 10) || 10;
  const total = Number(
    payload.total ?? payload.count ?? payload.total_items ?? payload.totalResults ?? items.length
  );
  const totalPages =
    Number(payload.totalPages ?? payload.total_pages ?? payload.pages) ||
    Math.max(1, Math.ceil((Number.isFinite(total) ? total : items.length) / limit));
  return { items, page, limit, total: Number.isFinite(total) ? total : items.length, totalPages };
};

export const normalizePaginatedComments = (payload) => normalizePaginatedList(payload, normalizeComment);

export const normalizeSubmission = (raw) => {
  if (!raw || typeof raw !== "object") {
    return { id: "", title: "", excerpt: "", content: "", featuredImageUrl: "", status: "", createdAt: "" };
  }
  return {
    id: asString(raw.id ?? raw._id ?? ""),
    title: asString(raw.title ?? ""),
    excerpt: asString(raw.excerpt ?? raw.summary ?? ""),
    content: asString(raw.content ?? raw.body ?? ""),
    featuredImageUrl: asString(raw.featured_image_url ?? raw.featuredImageUrl ?? ""),
    status: asString(raw.status ?? ""),
    createdAt: asString(
      pickFirstNonEmpty(raw.created_at, raw.createdAt, raw.updated_at, raw.updatedAt, raw.submitted_at)
    ),
  };
};

export const normalizePaginatedSubmissions = (payload) => normalizePaginatedList(payload, normalizeSubmission);

