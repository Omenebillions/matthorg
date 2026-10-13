import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, BookOpen, ArrowRight, Sparkles, Filter, ChevronRight, CheckCircle2 } from 'lucide-react';
import { INITIAL_BLOG_POSTS, BlogPost } from '../../data/blogPosts';
import { SERVICE_CATEGORIES_CATALOG } from '../../data/serviceTaxonomy';
import { NIGERIA_LOCATIONS } from '../../data/nigeriaLocations';
import { getManagedArticles } from '../../lib/articlesDb';
import { Breadcrumbs } from './Breadcrumbs';
import { updatePageMetadata, generateBreadcrumbSchema } from '../../utils/seo';

interface BlogHomePageProps {
  onSelectArticle: (slug: string) => void;
  onNavigateHome: () => void;
  onNavigateServices: (serviceSlug?: string, locationSlug?: string) => void;
  onNavigateLocations: (locationSlug?: string) => void;
  onPostRequest: () => void;
}

export const BlogHomePage: React.FC<BlogHomePageProps> = ({
  onSelectArticle,
  onNavigateHome,
  onNavigateServices,
  onNavigateLocations,
  onPostRequest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Combine initial posts and user-managed published articles
  const allArticles: BlogPost[] = useMemo(() => {
    const managed: BlogPost[] = getManagedArticles()
      .filter((a) => a.status === 'published')
      .map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        seoTitle: a.seoTitle || a.title,
        seoDescription: a.seoDescription || a.excerpt,
        excerpt: a.excerpt,
        category: a.category,
        categorySlug: a.category.toLowerCase().replace(/[^\w]/g, '-'),
        featuredImage: a.featured_image,
        featuredImageAlt: a.title,
        author: { name: a.author, role: 'Contributor' },
        readTimeMinutes: Math.max(3, Math.round((a.body || '').split(' ').length / 200)),
        publishedAt: a.published_at || a.created_at,
        updatedAt: a.updated_at,
        status: 'published' as const,
        contentSections: [
          {
            heading: 'Overview',
            id: 'overview',
            body: a.body ? a.body.split('\n\n').filter(Boolean) : [a.excerpt],
          },
        ],
        suggestedAction: {
          serviceCategory: a.category,
          ctaHeadline: `Need a ${a.category} Specialist?`,
          ctaSubtext: 'Find verified professionals on MatthOrg.',
          findProsText: 'Find Professionals',
          postRequestText: 'Post a Request',
        },
      }));

    // Deduplicate by slug
    const combined: BlogPost[] = [...managed];
    INITIAL_BLOG_POSTS.forEach((post) => {
      if (!combined.some((c) => c.slug === post.slug)) {
        combined.push(post);
      }
    });

    return combined;
  }, []);

  // Update SEO Metadata for Blog Homepage
  useEffect(() => {
    updatePageMetadata({
      title: 'MatthOrg Guides — Practical Advice for Projects & Growing Businesses',
      description: 'Practical advice for finding professionals, planning projects, costs, and growing service businesses in Nigeria.',
      canonicalPath: '/blog',
      ogType: 'website',
      schema: generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'MatthOrg Guides', url: '/blog' },
      ]),
    });
  }, []);

  // Search and Category Filter
  const filteredArticles = useMemo(() => {
    return allArticles.filter((article) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        article.category.toLowerCase() === selectedCategory.toLowerCase() ||
        article.categorySlug === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [allArticles, selectedCategory, searchQuery]);

  const featuredArticle = filteredArticles[0] || allArticles[0];
  const gridArticles = filteredArticles.length > 1 ? filteredArticles.slice(1) : filteredArticles;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Editorial Header Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onNavigateHome}
              className="text-xl font-black tracking-tight text-[#0B192C] flex items-center gap-1.5"
            >
              <span>Matth</span>
              <span className="text-[#3D74D9]">Org</span>
              <span className="text-xs uppercase px-2 py-0.5 ml-1.5 bg-gray-100 text-gray-700 font-bold rounded-md">
                Guides
              </span>
            </button>

            <nav className="hidden md:flex items-center space-x-5 text-sm font-medium text-gray-600">
              <button onClick={() => onNavigateServices()} className="hover:text-[#3D74D9] transition-colors">
                Browse Services
              </button>
              <button onClick={() => onNavigateLocations()} className="hover:text-[#3D74D9] transition-colors">
                Locations
              </button>
              <button onClick={() => setSelectedCategory('all')} className="text-[#3D74D9] font-semibold">
                All Guides
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onPostRequest}
              className="px-4 py-2 bg-[#3D74D9] hover:bg-[#2B5BB8] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Post a Request</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNavigateHome}
              className="hidden sm:inline-flex text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-2 transition-colors"
            >
              Main Marketplace
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { label: 'Marketplace', onClick: onNavigateHome },
            { label: 'MatthOrg Guides' },
          ]}
          className="mb-6"
        />

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#3D74D9] border border-blue-100 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge Base & Practical Guides
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            MatthOrg Guides
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-700 leading-relaxed font-semibold">
            Practical advice for finding professionals, planning projects and growing service businesses.
          </p>

          {/* Search Box */}
          <div className="mt-7 max-w-xl mx-auto text-left">
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              What are you looking for?
            </label>
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides (e.g. solar Lagos, plumbing, CCTV, electrician cost)"
                className="w-full pl-11 pr-28 py-3.5 bg-white border border-gray-300 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#3D74D9] focus:border-transparent transition-all"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 px-2 py-1 text-xs text-gray-400 hover:text-gray-700 bg-gray-100 rounded"
                >
                  Clear
                </button>
              ) : (
                <button
                  type="button"
                  className="absolute right-2 px-3 py-1.5 bg-[#3D74D9] text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Search guides
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Categories</h2>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs text-[#3D74D9] hover:underline font-medium"
              >
                Reset filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#3D74D9] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
            {SERVICE_CATEGORIES_CATALOG.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? 'bg-[#3D74D9] text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Editorial Post */}
        {featuredArticle && !searchQuery && selectedCategory === 'all' && (
          <div
            onClick={() => onSelectArticle(featuredArticle.slug)}
            className="mb-12 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer grid grid-cols-1 lg:grid-cols-12 group"
          >
            <div className="lg:col-span-7 h-64 sm:h-80 lg:h-auto overflow-hidden relative">
              <img
                src={featuredArticle.featuredImage}
                alt={featuredArticle.featuredImageAlt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-bold rounded-lg uppercase tracking-wider">
                Featured Guide
              </span>
            </div>
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span className="font-bold text-[#3D74D9]">{featuredArticle.category}</span>
                  <span>•</span>
                  <span>{featuredArticle.readTimeMinutes} min read</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-[#3D74D9] transition-colors leading-snug">
                  {featuredArticle.title}
                </h3>
                <p className="mt-3 text-sm text-gray-600 line-clamp-3 leading-relaxed">
                  {featuredArticle.excerpt}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {featuredArticle.author.avatar && (
                    <img
                      src={featuredArticle.author.avatar}
                      alt={featuredArticle.author.name}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{featuredArticle.author.name}</p>
                    <p className="text-[11px] text-gray-500">{featuredArticle.author.role}</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#3D74D9] group-hover:translate-x-1 transition-transform">
                  Read Article <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <section>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Recent & Popular Guides'}
            </h2>
            <span className="text-xs text-gray-500">
              {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
            </span>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  onClick={() => onSelectArticle(article.slug)}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#3D74D9]/40 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={article.featuredImage}
                        alt={article.featuredImageAlt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-[11px] font-bold rounded-md">
                        {article.category}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span>{article.readTimeMinutes} min read</span>
                        <span>•</span>
                        <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base group-hover:text-[#3D74D9] transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>
                      <p className="mt-2 text-xs text-gray-600 line-clamp-3 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-800">{article.author.name}</span>
                    <span className="text-xs font-bold text-[#3D74D9] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Read <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center max-w-lg mx-auto">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">No guides found</h3>
              <p className="text-xs text-gray-600 mt-1">
                We couldn’t find any articles matching your search query. Try searching for "solar", "plumbing", "cctv", or "electrician".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>

        {/* Local Services Discovery Network Banner */}
        <section className="mt-16 bg-white border border-gray-200 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <span className="text-xs font-bold text-[#3D74D9] uppercase tracking-wider">Local Service Discovery</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                Discover Verified Professionals by State & City
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                MatthOrg connects customers with real verified contractors across all 36 Nigerian states and FCT Abuja.
              </p>
            </div>
            <button
              onClick={() => onNavigateLocations()}
              className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-semibold rounded-lg transition-colors self-start md:self-auto"
            >
              View All Locations
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
            {NIGERIA_LOCATIONS.slice(0, 12).map((loc) => (
              <button
                key={loc.slug}
                onClick={() => onNavigateLocations(loc.slug)}
                className="p-3 bg-gray-50 hover:bg-blue-50/60 border border-gray-200 hover:border-[#3D74D9]/40 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 group-hover:text-[#3D74D9]">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#3D74D9]" />
                  <span>{loc.name}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  {loc.majorCities.slice(0, 2).map((c) => c.name).join(', ')}
                </p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
