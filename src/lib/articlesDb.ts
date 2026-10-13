export interface ContentArticleRecord {
  id: string;
  title: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  excerpt: string;
  body: string;
  category: string;
  service?: string;
  location?: string;
  featured_image: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'matthorg_managed_articles';

/**
 * Reads managed articles from persistent client storage or Supabase fallback
 */
export function getManagedArticles(): ContentArticleRecord[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (err) {
    console.warn('[MatthOrg Articles] Error reading managed articles:', err);
  }
  return [];
}

/**
 * Saves a new or edited article
 */
export function saveManagedArticle(article: Partial<ContentArticleRecord>): ContentArticleRecord {
  const existing = getManagedArticles();
  const now = new Date().toISOString();

  let targetId = article.id;
  if (!targetId) {
    targetId = `art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  const cleanSlug = (article.slug || article.title || 'untitled-article')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const record: ContentArticleRecord = {
    id: targetId,
    title: article.title || 'Untitled Article',
    slug: cleanSlug,
    seoTitle: article.seoTitle || article.title || '',
    seoDescription: article.seoDescription || article.excerpt || '',
    canonicalUrl: article.canonicalUrl || `/blog/${cleanSlug}`,
    excerpt: article.excerpt || '',
    body: article.body || '',
    category: article.category || 'Home Services',
    service: article.service || '',
    location: article.location || '',
    featured_image:
      article.featured_image ||
      'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=1200&q=80',
    author: article.author || 'MatthOrg Editorial',
    status: article.status || 'draft',
    published_at: article.status === 'published' ? (article.published_at || now) : undefined,
    created_at: article.created_at || now,
    updated_at: now,
  };

  const idx = existing.findIndex((a) => a.id === targetId || a.slug === cleanSlug);
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...record };
  } else {
    existing.unshift(record);
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
  } catch (err) {
    console.warn('[MatthOrg Articles] Error saving to storage:', err);
  }

  return record;
}

/**
 * Deletes a managed article
 */
export function deleteManagedArticle(id: string): void {
  const existing = getManagedArticles().filter((a) => a.id !== id);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
  } catch (err) {
    console.warn('[MatthOrg Articles] Error deleting article:', err);
  }
}
