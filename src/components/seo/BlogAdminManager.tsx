import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Archive,
  Search,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  ContentArticleRecord,
  getManagedArticles,
  saveManagedArticle,
  deleteManagedArticle,
} from '../../lib/articlesDb';
import { INITIAL_BLOG_POSTS } from '../../data/blogPosts';
import { SERVICE_CATEGORIES_CATALOG } from '../../data/serviceTaxonomy';
import { NIGERIA_LOCATIONS } from '../../data/nigeriaLocations';

interface BlogAdminManagerProps {
  onViewPublicArticle?: (slug: string) => void;
}

export const BlogAdminManager: React.FC<BlogAdminManagerProps> = ({ onViewPublicArticle }) => {
  const [articles, setArticles] = useState<ContentArticleRecord[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('Solar & Power');
  const [formService, setFormService] = useState('solar');
  const [formLocation, setFormLocation] = useState('Lagos');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formImage, setFormImage] = useState(
    'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=1200&q=80'
  );
  const [formAuthor, setFormAuthor] = useState('MatthOrg Editorial');
  const [formStatus, setFormStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDescription, setFormSeoDescription] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Refresh articles list
  const refreshArticles = () => {
    const list = getManagedArticles();
    setArticles(list);
  };

  useEffect(() => {
    refreshArticles();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormTitle('');
    setFormSlug('');
    setFormCategory('Solar & Power');
    setFormService('solar');
    setFormLocation('Lagos');
    setFormExcerpt('');
    setFormBody('');
    setFormImage('https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=1200&q=80');
    setFormAuthor('MatthOrg Editorial');
    setFormStatus('published');
    setFormSeoTitle('');
    setFormSeoDescription('');
    setIsEditing(true);
  };

  const handleEdit = (art: ContentArticleRecord) => {
    setEditingId(art.id);
    setFormTitle(art.title);
    setFormSlug(art.slug);
    setFormCategory(art.category);
    setFormService(art.service || '');
    setFormLocation(art.location || '');
    setFormExcerpt(art.excerpt);
    setFormBody(art.body);
    setFormImage(art.featured_image);
    setFormAuthor(art.author);
    setFormStatus(art.status);
    setFormSeoTitle(art.seoTitle || art.title);
    setFormSeoDescription(art.seoDescription || art.excerpt);
    setIsEditing(true);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteManagedArticle(id);
      refreshArticles();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Article title is required.');
      return;
    }

    const cleanSlug = (formSlug || formTitle)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    saveManagedArticle({
      id: editingId || undefined,
      title: formTitle.trim(),
      slug: cleanSlug,
      category: formCategory,
      service: formService,
      location: formLocation,
      excerpt: formExcerpt.trim(),
      body: formBody.trim(),
      featured_image: formImage.trim(),
      author: formAuthor.trim(),
      status: formStatus,
      seoTitle: formSeoTitle.trim() || formTitle.trim(),
      seoDescription: formSeoDescription.trim() || formExcerpt.trim(),
    });

    setIsEditing(false);
    refreshArticles();
  };

  // Seed sample initial article to managed store if empty
  const handleSeedTemplate = () => {
    INITIAL_BLOG_POSTS.slice(0, 2).forEach((post) => {
      saveManagedArticle({
        title: post.title,
        slug: post.slug,
        category: post.category,
        service: post.serviceSlug,
        excerpt: post.excerpt,
        body: post.contentSections.map((s) => `## ${s.heading}\n\n${s.body.join('\n\n')}`).join('\n\n'),
        featured_image: post.featuredImage,
        author: post.author.name,
        status: 'published',
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
      });
    });
    refreshArticles();
  };

  const filteredArticles = articles.filter(
    (a) =>
      !filterSearch ||
      a.title.toLowerCase().includes(filterSearch.toLowerCase()) ||
      a.category.toLowerCase().includes(filterSearch.toLowerCase()) ||
      a.slug.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#3D74D9] mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            Content Management
          </div>
          <h2 className="text-xl font-bold text-gray-900">Blog, Guides & SEO Content Manager</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create, edit, and publish SEO guides without touching codebase files.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {articles.length === 0 && (
            <button
              onClick={handleSeedTemplate}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Seed Core Guides
            </button>
          )}
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-[#3D74D9] hover:bg-[#2B5BB8] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Guide Article</span>
          </button>
        </div>
      </div>

      {/* Editor Modal / Sub-view */}
      {isEditing ? (
        <form onSubmit={handleSave} className="my-6 p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h3 className="font-bold text-base text-gray-900">
              {editingId ? 'Edit Article' : 'Compose New Guide Article'}
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Article Title *</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => {
                  setFormTitle(e.target.value);
                  if (!editingId && !formSlug) {
                    setFormSlug(e.target.value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'));
                  }
                }}
                placeholder="e.g., How to Choose a Solar Inverter in Lagos"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">URL Slug (Canonical) *</label>
              <input
                type="text"
                required
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g., how-to-choose-a-solar-inverter-in-lagos"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-mono focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
              >
                {SERVICE_CATEGORIES_CATALOG.map((cat) => (
                  <option key={cat.slug} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Target Service</label>
              <input
                type="text"
                value={formService}
                onChange={(e) => setFormService(e.target.value)}
                placeholder="e.g., solar, electrical, plumbing"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Target Location (State/City)</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g., Lagos, Abuja, Port Harcourt"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Author Name</label>
              <input
                type="text"
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
                placeholder="e.g., Engr. David Okonkwo"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Publication Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Live Public)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Featured Image URL</label>
              <input
                type="url"
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
              />
            </div>
          </div>

          {/* SEO Metadata Fields */}
          <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
              SEO & Social Card Metadata
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  SEO Title (30-60 characters)
                </label>
                <input
                  type="text"
                  value={formSeoTitle}
                  onChange={(e) => setFormSeoTitle(e.target.value)}
                  placeholder="Leave empty to use main title"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  SEO Description (120-160 characters)
                </label>
                <input
                  type="text"
                  value={formSeoDescription}
                  onChange={(e) => setFormSeoDescription(e.target.value)}
                  placeholder="Summary for Google and WhatsApp links"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Summary / Excerpt *</label>
            <textarea
              required
              rows={2}
              value={formExcerpt}
              onChange={(e) => setFormExcerpt(e.target.value)}
              placeholder="Short introductory summary for search cards and listings..."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Article Content (Supports markdown & paragraphs) *
            </label>
            <textarea
              required
              rows={8}
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              placeholder="Write the comprehensive article content here. Separate sections with blank lines..."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-mono leading-relaxed focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#3D74D9] hover:bg-[#2B5BB8] text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Save & {formStatus === 'published' ? 'Publish Live' : 'Save Draft'}
            </button>
          </div>
        </form>
      ) : null}

      {/* Article List Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Filter articles..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#3D74D9] focus:outline-none"
            />
          </div>

          <span className="text-xs text-gray-500">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} in database
          </span>
        </div>

        {filteredArticles.length > 0 ? (
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 text-left">Article</th>
                  <th className="px-3 py-3 text-left">Category</th>
                  <th className="px-3 py-3 text-left">Slug / Canonical</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-left">Author</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900 max-w-xs truncate">
                      {art.title}
                    </td>
                    <td className="px-3 py-3 text-gray-600">{art.category}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-gray-500 truncate max-w-[150px]">
                      /blog/{art.slug}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          art.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : art.status === 'draft'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {art.status === 'published' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : art.status === 'draft' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <Archive className="w-3 h-3" />
                        )}
                        {art.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{art.author}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {onViewPublicArticle && art.status === 'published' && (
                          <button
                            onClick={() => onViewPublicArticle(art.slug)}
                            className="p-1.5 text-gray-500 hover:text-[#3D74D9] rounded hover:bg-gray-100"
                            title="View Public Guide"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(art)}
                          className="p-1.5 text-gray-500 hover:text-[#3D74D9] rounded hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(art.id, art.title)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-600">
              No custom managed articles yet. Click "Seed Core Guides" or "New Guide Article" to create your first SEO guide.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
