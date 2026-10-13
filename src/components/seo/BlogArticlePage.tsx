import React, { useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Share2,
  ArrowRight,
  BookOpen,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Info,
  MapPin,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { BlogPost, INITIAL_BLOG_POSTS, getBlogPostBySlug } from '../../data/blogPosts';
import { getManagedArticles } from '../../lib/articlesDb';
import { Breadcrumbs } from './Breadcrumbs';
import { SeoMarketplaceCta } from './SeoMarketplaceCta';
import { updatePageMetadata, generateArticleSchema, generateBreadcrumbSchema } from '../../utils/seo';

interface BlogArticlePageProps {
  slug: string;
  onNavigateHome: () => void;
  onNavigateBlog: () => void;
  onSelectArticle: (slug: string) => void;
  onNavigateServiceLocation: (serviceSlug?: string, locationSlug?: string) => void;
  onFindPros: (serviceCategory?: string) => void;
  onPostRequest: (prefillService?: string) => void;
  onJoinAsBusiness: () => void;
}

export const BlogArticlePage: React.FC<BlogArticlePageProps> = ({
  slug,
  onNavigateHome,
  onNavigateBlog,
  onSelectArticle,
  onNavigateServiceLocation,
  onFindPros,
  onPostRequest,
  onJoinAsBusiness,
}) => {
  // Find article from static guide repository or dynamically managed articles
  const article: BlogPost | undefined = useMemo(() => {
    const staticMatch = getBlogPostBySlug(slug);
    if (staticMatch) return staticMatch;

    const managedMatch = getManagedArticles().find(
      (a) => a.slug === slug.toLowerCase().trim() && a.status === 'published'
    );
    if (managedMatch) {
      return {
        id: managedMatch.id,
        slug: managedMatch.slug,
        title: managedMatch.title,
        seoTitle: managedMatch.seoTitle || managedMatch.title,
        seoDescription: managedMatch.seoDescription || managedMatch.excerpt,
        excerpt: managedMatch.excerpt,
        category: managedMatch.category,
        categorySlug: managedMatch.category.toLowerCase().replace(/[^\w]/g, '-'),
        featuredImage: managedMatch.featured_image,
        featuredImageAlt: managedMatch.title,
        author: { name: managedMatch.author, role: 'MatthOrg Expert Contributor' },
        readTimeMinutes: Math.max(3, Math.round((managedMatch.body || '').split(' ').length / 200)),
        publishedAt: managedMatch.published_at || managedMatch.created_at,
        updatedAt: managedMatch.updated_at,
        status: 'published',
        contentSections: [
          {
            heading: 'Detailed Guide',
            id: 'detailed-guide',
            body: managedMatch.body ? managedMatch.body.split('\n\n').filter(Boolean) : [managedMatch.excerpt],
          },
        ],
        suggestedAction: {
          serviceCategory: managedMatch.category,
          ctaHeadline: `Need a ${managedMatch.category} Professional?`,
          ctaSubtext: 'Find verified contractors on MatthOrg or submit your project details.',
          findProsText: `Find ${managedMatch.category} Pros`,
          postRequestText: 'Post a Request',
        },
      };
    }

    return undefined;
  }, [slug]);

  // Update SEO Metadata and Structured Schema
  useEffect(() => {
    if (article) {
      const canonical = `/blog/${article.slug}`;
      const articleSchema = generateArticleSchema({
        title: article.seoTitle || article.title,
        description: article.seoDescription || article.excerpt,
        url: canonical,
        imageUrl: article.featuredImage,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
        authorName: article.author.name,
      });

      const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Guides', url: '/blog' },
        { name: article.category, url: '/blog' },
        { name: article.title, url: canonical },
      ]);

      updatePageMetadata({
        title: `${article.seoTitle || article.title} | MatthOrg`,
        description: article.seoDescription || article.excerpt,
        canonicalPath: canonical,
        ogType: 'article',
        ogImage: article.featuredImage,
        articlePublishedTime: article.publishedAt,
        articleModifiedTime: article.updatedAt,
        articleAuthor: article.author.name,
        schema: [articleSchema, breadcrumbSchema],
      });
    }
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Guide Not Found</h1>
        <p className="text-sm text-gray-600 mt-2 max-w-md">
          The article you are looking for may have moved or is currently in draft review.
        </p>
        <button
          onClick={onNavigateBlog}
          className="mt-6 px-6 py-2.5 bg-[#3D74D9] hover:bg-[#2B5BB8] text-white font-semibold text-sm rounded-xl transition-all"
        >
          Return to MatthOrg Guides
        </button>
      </div>
    );
  }

  // Related Guides
  const relatedArticles = INITIAL_BLOG_POSTS.filter(
    (p) => p.slug !== article.slug && (p.category === article.category || article.relatedGuideSlugs?.includes(p.slug))
  ).slice(0, 3);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Article link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="text-lg font-black tracking-tight text-[#0B192C] flex items-center gap-1"
            >
              <span>Matth</span>
              <span className="text-[#3D74D9]">Org</span>
            </button>
            <span className="text-gray-300 font-light">/</span>
            <button
              onClick={onNavigateBlog}
              className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-[#3D74D9] transition-colors"
            >
              Guides
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Share article"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => onPostRequest(article.serviceName || article.category)}
              className="px-4 py-2 bg-[#3D74D9] hover:bg-[#2B5BB8] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all"
            >
              Post a Request
            </button>
          </div>
        </div>
      </header>

      {/* Main Article Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { label: 'Marketplace', onClick: onNavigateHome },
            { label: 'Guides', onClick: onNavigateBlog },
            { label: article.category, onClick: onNavigateBlog },
            { label: article.title },
          ]}
          className="mb-6"
        />

        {/* Article Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#3D74D9] border border-blue-100 mb-4">
            <span>{article.category}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
            {article.excerpt}
          </p>

          {/* Author & Timestamp Bar */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {article.author.avatar ? (
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#3D74D9] flex items-center justify-center font-bold text-sm">
                  {article.author.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900">{article.author.name}</p>
                <p className="text-xs text-gray-500">{article.author.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {article.readTimeMinutes} min read
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="mb-10 rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-gray-100 h-64 sm:h-96 w-full">
          <img
            src={article.featuredImage}
            alt={article.featuredImageAlt}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Table of Contents */}
        {article.tableOfContents && article.tableOfContents.length > 0 && (
          <div className="mb-10 p-6 bg-white border border-gray-200 rounded-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              In this guide
            </h2>
            <ul className="space-y-2 text-sm">
              {article.tableOfContents.map((item, idx) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-[#3D74D9] mt-0.5">{idx + 1}.</span>
                  <a
                    href={`#${item.id}`}
                    className="text-gray-700 hover:text-[#3D74D9] font-medium transition-colors"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Content Body */}
        <article className="prose prose-blue max-w-none space-y-8 text-gray-800 leading-relaxed text-sm sm:text-base">
          {article.contentSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                {section.heading}
              </h2>

              <div className="space-y-4">
                {section.body.map((paragraph, pIdx) => (
                  <p key={pIdx} className="text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {section.callout && (
                <div
                  className={`mt-6 p-4 rounded-xl border flex items-start gap-3 ${
                    section.callout.type === 'tip'
                      ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                      : section.callout.type === 'warning'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  {section.callout.type === 'tip' ? (
                    <HelpCircle className="w-5 h-5 text-[#3D74D9] flex-shrink-0 mt-0.5" />
                  ) : section.callout.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-1">
                      {section.callout.title}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed">{section.callout.text}</p>
                  </div>
                </div>
              )}
            </section>
          ))}
        </article>

        {/* Action Callout Box */}
        <div className="mt-12">
          <SeoMarketplaceCta
            serviceName={article.serviceName || article.category}
            locationName="Nigeria"
            onFindPros={() => onFindPros(article.serviceSlug || article.category)}
            onPostRequest={() => onPostRequest(article.serviceName || article.category)}
            onJoinAsBusiness={onJoinAsBusiness}
          />
        </div>

        {/* Related Guides Section */}
        {relatedArticles.length > 0 && (
          <section className="mt-16 pt-10 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Related Guides & Articles</h2>
              <button
                onClick={onNavigateBlog}
                className="text-xs font-bold text-[#3D74D9] hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectArticle(rel.slug)}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="h-36 overflow-hidden">
                    <img
                      src={rel.featuredImage}
                      alt={rel.featuredImageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#3D74D9] uppercase tracking-wider">
                        {rel.category}
                      </span>
                      <h3 className="font-bold text-gray-900 text-sm mt-1 line-clamp-2 group-hover:text-[#3D74D9] transition-colors">
                        {rel.title}
                      </h3>
                    </div>
                    <span className="mt-3 text-xs font-semibold text-gray-600 flex items-center gap-1">
                      Read guide <ArrowRight className="w-3 h-3 text-[#3D74D9]" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
