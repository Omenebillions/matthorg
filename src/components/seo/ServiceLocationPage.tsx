import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  FileText,
  DollarSign,
  ChevronRight,
  BookOpen,
  Sparkles,
  Search,
  X,
  Filter,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Zap,
  Wrench,
  Building,
  Wind,
  Monitor,
  Paintbrush,
  Hammer,
  Truck,
  Camera,
  Cpu,
  Compass,
  Droplets,
  Car,
  Layers,
} from 'lucide-react';
import {
  ServiceTaxonomyItem,
  getServiceBySlug,
  getAllServices,
  getServiceCategoriesCatalog,
} from '../../data/serviceTaxonomy';
import {
  LocationState,
  LocationCity,
  getLocationBySlug,
  getCityBySlug,
  NIGERIA_LOCATIONS,
} from '../../data/nigeriaLocations';
import { INITIAL_BLOG_POSTS } from '../../data/blogPosts';
import { PublicProfessionalProfile } from '../../types';
import { fetchPublicProfessionals } from '../../lib/db';
import { Breadcrumbs } from './Breadcrumbs';
import { RealProsList } from './RealProsList';
import { SeoMarketplaceCta } from './SeoMarketplaceCta';
import {
  updatePageMetadata,
  generateBreadcrumbSchema,
  generateServiceSchema,
} from '../../utils/seo';

interface ServiceLocationPageProps {
  serviceSlug: string;
  locationSlug?: string;
  citySlug?: string;
  onNavigateHome: () => void;
  onNavigateService: (service: string, location?: string) => void;
  onNavigateLocation: (location: string, service?: string) => void;
  onNavigateArticle: (slug: string) => void;
  onSelectProfessional: (pro: PublicProfessionalProfile) => void;
  onPostRequest: (prefillService?: string, prefillLocation?: string) => void;
  onJoinAsBusiness: () => void;
}

export const ServiceLocationPage: React.FC<ServiceLocationPageProps> = ({
  serviceSlug,
  locationSlug,
  citySlug,
  onNavigateHome,
  onNavigateService,
  onNavigateLocation,
  onNavigateArticle,
  onSelectProfessional,
  onPostRequest,
  onJoinAsBusiness,
}) => {
  // Determine if viewing "All Services" marketplace directory or a specific service
  const isAllServices = !serviceSlug || serviceSlug.toLowerCase() === 'all' || serviceSlug.toLowerCase() === 'services';

  // Search & Filter state for the Services Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Dynamic services list and categories
  const [servicesList, setServicesList] = useState<ServiceTaxonomyItem[]>(() => getAllServices());
  const [categoriesCatalog, setCategoriesCatalog] = useState(() => getServiceCategoriesCatalog());

  useEffect(() => {
    const handleUpdate = () => {
      setServicesList(getAllServices());
      setCategoriesCatalog(getServiceCategoriesCatalog());
    };
    window.addEventListener('matthorg_services_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('matthorg_services_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Resolve Location State
  const locationState: LocationState | undefined = useMemo(() => {
    return locationSlug ? getLocationBySlug(locationSlug) : undefined;
  }, [locationSlug]);

  // Resolve Sub-City if present
  const locationCity: LocationCity | undefined = useMemo(() => {
    if (locationState && citySlug) {
      return getCityBySlug(locationState, citySlug);
    }
    return undefined;
  }, [locationState, citySlug]);

  // Active Display Names
  const currentLocName = locationCity
    ? `${locationCity.name}, ${locationState?.name}`
    : locationState
    ? locationState.isFct
      ? 'Abuja (FCT)'
      : `${locationState.name} State`
    : 'Nigeria';

  const currentAreaShort = locationCity?.name || locationState?.name || 'Nigeria';

  // Resolve Specific Service (when not on "all")
  const service: ServiceTaxonomyItem = useMemo(() => {
    if (isAllServices) {
      return servicesList[0] || getAllServices()[0];
    }
    return getServiceBySlug(serviceSlug) || servicesList[0] || getAllServices()[0];
  }, [serviceSlug, isAllServices, servicesList]);

  // Filtered possible services for the directory view
  const filteredServices = useMemo(() => {
    return servicesList.filter((item) => {
      // Category filter
      if (activeCategory !== 'all') {
        const matchesCategory =
          item.categorySlug.toLowerCase() === activeCategory.toLowerCase() ||
          item.category.toLowerCase().includes(activeCategory.toLowerCase());
        if (!matchesCategory) return false;
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesDesc = item.shortDescription.toLowerCase().includes(q);
        const matchesSub = item.subServices.some((sub) => sub.toLowerCase().includes(q));
        const matchesKeywords = item.seoKeywords.some((k) => k.toLowerCase().includes(q));
        return matchesName || matchesCategory || matchesDesc || matchesSub || matchesKeywords;
      }

      return true;
    });
  }, [searchQuery, activeCategory, servicesList]);

  // Real Database Professionals (Strict truth-in-advertising: zero invented businesses)
  const [professionals, setProfessionals] = useState<PublicProfessionalProfile[]>([]);
  const [isLoadingPros, setIsLoadingPros] = useState(true);

  // Fetch real verified professionals from database
  useEffect(() => {
    let isMounted = true;
    setIsLoadingPros(true);

    fetchPublicProfessionals({
      category: isAllServices ? (activeCategory !== 'all' ? activeCategory : undefined) : service.category || service.name,
      location: locationState?.name || undefined,
      randomize: true,
    })
      .then((data) => {
        if (isMounted) {
          setProfessionals(data || []);
          setIsLoadingPros(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingPros(false);
      });

    return () => {
      isMounted = false;
    };
  }, [service, locationState, isAllServices, activeCategory]);

  // Update Page SEO Metadata & JSON-LD Structured Data
  useEffect(() => {
    if (isAllServices) {
      const pageTitle = `Marketplace Services Directory | All Possible Services | MatthOrg`;
      const metaDesc = `Browse all 24 verified contracting disciplines, trade specialties, and commercial services on MatthOrg. Search possible services, compare scopes, and request quotes across Nigeria.`;
      const canonicalPath = `/services`;

      const breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Marketplace', url: '/' },
        { name: 'Services', url: '/services' },
      ];

      const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

      updatePageMetadata({
        title: pageTitle,
        description: metaDesc,
        canonicalPath,
        ogType: 'website',
        ogImage: servicesList[0]?.featuredImage,
        keywords: [
          'services directory',
          'hire contractors in nigeria',
          'verified professionals marketplace',
          'solar',
          'cctv',
          'plumbing',
          'deep cleaning',
          'construction',
          'hvac',
        ],
        schema: [breadcrumbSchema],
      });
      return;
    }

    const isLocal = Boolean(locationState);
    const pageTitle = isLocal
      ? `${service.name} in ${currentLocName} | MatthOrg Marketplace`
      : `${service.name} Services in Nigeria | MatthOrg Marketplace`;

    const metaDesc = isLocal
      ? `Find verified ${service.name.toLowerCase()} contractors in ${currentLocName}. Compare registered businesses, check project scopes, and get transparent quotes on MatthOrg.`
      : `Compare verified ${service.name.toLowerCase()} contractors across Nigeria. Get transparent quotes, check business registrations, and hire with confidence.`;

    const canonicalPath = isLocal
      ? locationCity
        ? `/services/${service.slug}/${locationState?.slug}/${locationCity.slug}`
        : `/services/${service.slug}/${locationState?.slug}`
      : `/services/${service.slug}`;

    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Marketplace', url: '/' },
      { name: 'Services', url: '/services' },
      { name: service.name, url: canonicalPath },
    ];

    if (isLocal && locationState) {
      breadcrumbs.push({ name: locationState.name, url: canonicalPath });
    }

    const serviceSchema = generateServiceSchema({
      serviceName: service.name,
      locationName: currentLocName,
      description: metaDesc,
      url: canonicalPath,
    });

    const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

    updatePageMetadata({
      title: pageTitle,
      description: metaDesc,
      canonicalPath,
      ogType: 'website',
      ogImage: service.featuredImage,
      keywords: [
        `${service.name.toLowerCase()} in ${currentAreaShort.toLowerCase()}`,
        `${service.category.toLowerCase()} ${currentAreaShort.toLowerCase()}`,
        ...service.seoKeywords,
      ],
      schema: [serviceSchema, breadcrumbSchema],
    });
  }, [isAllServices, service, locationState, locationCity, currentLocName, currentAreaShort]);

  // Relevant Informational Guides
  const relevantGuides = useMemo(() => {
    return INITIAL_BLOG_POSTS.filter(
      (p) => p.serviceSlug === service.slug || p.category === service.category
    ).slice(0, 3);
  }, [service]);

  // Related Services in the same locality
  const relatedServices = useMemo(() => {
    return servicesList.filter((s) => s.slug !== service.slug).slice(0, 4);
  }, [service, servicesList]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically via reactive filteredServices
  };

  // Helper icon renderer
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'Bolt':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'Wrench':
        return <Wrench className="w-5 h-5 text-blue-500" />;
      case 'Shield':
        return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      case 'Building':
        return <Building className="w-5 h-5 text-orange-500" />;
      case 'Wind':
        return <Wind className="w-5 h-5 text-cyan-500" />;
      case 'Monitor':
        return <Monitor className="w-5 h-5 text-indigo-500" />;
      case 'Paintbrush':
        return <Paintbrush className="w-5 h-5 text-pink-500" />;
      case 'Hammer':
        return <Hammer className="w-5 h-5 text-amber-600" />;
      case 'Truck':
        return <Truck className="w-5 h-5 text-emerald-600" />;
      case 'Camera':
        return <Camera className="w-5 h-5 text-rose-500" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-red-500" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-teal-500" />;
      case 'Droplets':
        return <Droplets className="w-5 h-5 text-sky-500" />;
      case 'Car':
        return <Car className="w-5 h-5 text-blue-600" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-slate-600" />;
      default:
        return <Briefcase className="w-5 h-5 text-[#3D74D9]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="text-lg sm:text-xl font-black tracking-tight text-[#0B192C] flex items-center gap-1 cursor-pointer"
            >
              <span>Matth</span>
              <span className="text-[#3D74D9]">Org</span>
            </button>
            <span className="text-gray-300 font-light">/</span>
            <button
              onClick={() => onNavigateService('all')}
              className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#3D74D9] transition-colors cursor-pointer"
            >
              Services
            </button>
            {!isAllServices && (
              <>
                <span className="text-gray-300 font-light">/</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[140px] sm:max-w-none">
                  {service.name}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onPostRequest(isAllServices ? undefined : service.name, currentAreaShort)}
              className="px-4 py-2 bg-[#3D74D9] hover:bg-[#2B5BB8] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Post a Request
            </button>
            <button
              onClick={onNavigateHome}
              className="hidden sm:inline-flex text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-2 transition-colors cursor-pointer"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* ========================================================================= */}
        {/* BREADCRUMB NAVIGATION: Home / Marketplace / Services                      */}
        {/* ========================================================================= */}
        <Breadcrumbs
          items={[
            {
              label: 'Marketplace',
              onClick: onNavigateHome,
            },
            {
              label: 'Services',
              onClick: !isAllServices ? () => onNavigateService('all') : undefined,
            },
            ...(!isAllServices
              ? [
                  {
                    label: service.name,
                    onClick: locationState ? () => onNavigateService(service.slug) : undefined,
                  },
                ]
              : []),
            ...(locationState
              ? [
                  {
                    label: locationState.name,
                    onClick: locationCity ? () => onNavigateService(service.slug, locationState.slug) : undefined,
                  },
                ]
              : []),
            ...(locationCity ? [{ label: locationCity.name }] : []),
          ]}
          className="mb-6"
        />

        {/* ========================================================================= */}
        {/* VIEW A: ALL POSSIBLE SERVICES DIRECTORY & SEARCH                          */}
        {/* ========================================================================= */}
        {isAllServices ? (
          <div>
            {/* Hero Section */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm mb-8 relative overflow-hidden">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-[#3D74D9] border border-blue-100 mb-4">
                  <ShieldCheck className="w-4 h-4 text-[#3D74D9]" />
                  <span>MatthOrg Verified Service Marketplace</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                  All Possible Services & Trades
                </h1>

                <p className="mt-3.5 text-base sm:text-lg text-gray-600 leading-relaxed">
                  Browse {servicesList.length} possible technical, commercial, and trade services available across MatthOrg. Search for services, compare scopes of work, and request direct quotations.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onPostRequest(undefined, currentAreaShort)}
                    className="px-6 py-3 bg-[#3D74D9] hover:bg-[#2B5BB8] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Post a Service Request
                  </button>
                  <button
                    onClick={onJoinAsBusiness}
                    className="px-6 py-3 bg-white border border-gray-300 hover:border-gray-400 text-gray-800 text-sm font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    Join as a Professional
                  </button>
                </div>
              </div>

              {/* Decorative background glow */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
            </div>

            {/* ========================================================================= */}
            {/* SEARCH & FILTER COMPONENT WITH DEDICATED SEARCH BUTTON                     */}
            {/* ========================================================================= */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm mb-8">
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search possible services (e.g. Solar, Inverter, AC, CCTV, Borehole, Tiling, Painting...)"
                    className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D74D9] focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* DEDICATED SEARCH BUTTON */}
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
                >
                  <Search className="w-4 h-4 text-white" />
                  <span>Search Services</span>
                </button>
              </form>

              {/* Category Filter Chips */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2.5">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Filter by Trade Category:
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {categoriesCatalog.map((cat) => {
                    const isSelected = activeCategory === cat.slug;
                    const count =
                      cat.slug === 'all'
                        ? servicesList.length
                        : servicesList.filter(
                            (s) =>
                              s.categorySlug.toLowerCase() === cat.slug.toLowerCase() ||
                              s.category.toLowerCase().includes(cat.name.toLowerCase())
                          ).length;

                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => setActiveCategory(cat.slug)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#3D74D9] text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Result Counter */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing <strong className="text-gray-900">{filteredServices.length}</strong> of{' '}
                  <strong className="text-gray-900">{servicesList.length}</strong> possible services
                  {searchQuery && ` matching "${searchQuery}"`}
                </span>
                {(searchQuery || activeCategory !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                    className="text-[#3D74D9] hover:underline font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* POSSIBLE SERVICES GRID                                                    */}
            {/* ========================================================================= */}
            <div className="mb-14">
              {filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#3D74D9]/40 transition-all group flex flex-col justify-between"
                    >
                      <div>
                        {/* Cover Image */}
                        <div
                          onClick={() => onNavigateService(item.slug, locationState?.slug)}
                          className="h-48 overflow-hidden relative cursor-pointer"
                        >
                          <img
                            src={item.featuredImage}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-gray-900 backdrop-blur-md shadow-xs flex items-center gap-1.5">
                              {renderCategoryIcon(item.iconName)}
                              <span>{item.category}</span>
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <span className="text-xs font-medium text-white/90">
                              {item.subServices.length} Certified Sub-disciplines
                            </span>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-5">
                          <h3
                            onClick={() => onNavigateService(item.slug, locationState?.slug)}
                            className="text-lg font-bold text-gray-900 group-hover:text-[#3D74D9] transition-colors cursor-pointer line-clamp-1"
                          >
                            {item.name}
                          </h3>

                          <p className="mt-2 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {item.shortDescription}
                          </p>

                          {/* Sub-Services Tags */}
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {item.subServices.slice(0, 3).map((sub, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-50 text-gray-700 border border-gray-200"
                              >
                                {sub}
                              </span>
                            ))}
                            {item.subServices.length > 3 && (
                              <span className="inline-block px-1.5 py-0.5 text-[10px] text-gray-400 font-semibold">
                                +{item.subServices.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="p-5 pt-0 border-t border-gray-100 mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onPostRequest(item.name, currentAreaShort)}
                          className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#3D74D9] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Request Quotation
                        </button>

                        <button
                          type="button"
                          onClick={() => onNavigateService(item.slug, locationState?.slug)}
                          className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-[#3D74D9] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Explore Scope</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-lg mx-auto">
                  <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900">No Services Found</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    No services matched "{searchQuery}". Try searching for terms like "Solar", "AC", "Borehole", or reset the filter.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                    className="mt-4 px-5 py-2 bg-[#3D74D9] text-white text-xs font-bold rounded-lg"
                  >
                    View All Services
                  </button>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* REGISTERED BUSINESSES STATUS (Zero-Invented Businesses Policy)             */}
            {/* ========================================================================= */}
            <div className="my-12">
              {professionals.length > 0 ? (
                <RealProsList
                  professionals={professionals}
                  serviceTitle="Service Marketplace"
                  locationName={currentLocName}
                  isLoading={isLoadingPros}
                  onSelectProfessional={onSelectProfessional}
                  onRequestQuotes={() => onPostRequest(undefined, currentAreaShort)}
                  onJoinAsBusiness={onJoinAsBusiness}
                />
              ) : (
                /* Honest Empty State for Registered Businesses (Directory In Building Mode) */
                <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#3D74D9]">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full mb-3">
                    Directory Under Active Building
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                    No placeholder businesses. Genuine registrations only.
                  </h3>
                  <p className="text-sm text-gray-600 mt-2.5 leading-relaxed max-w-md mx-auto">
                    MatthOrg strictly adheres to verified listings and does not invent fake contractors. As businesses register and complete verification, they will be listed here.
                  </p>

                  <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={onJoinAsBusiness}
                      className="w-full sm:w-auto px-6 py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Register Your Business (Join MatthOrg)
                    </button>
                    <button
                      onClick={() => onPostRequest(undefined, currentAreaShort)}
                      className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 hover:border-gray-400 text-gray-800 text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Post a Service Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW B: INDIVIDUAL SERVICE DETAIL VIEW                                     */
          /* ========================================================================= */
          <div>
            {/* Quick Search & Switcher Bar at the top of specific service view */}
            <div className="mb-6 bg-white border border-gray-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Search className="w-4 h-4 text-gray-400" />
                <span>Looking for other services?</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onNavigateService('all')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#3D74D9]" />
                  <span>Browse All 24 Possible Services</span>
                </button>
              </div>
            </div>

            {/* Hero Section for Specific Service */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm mb-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#3D74D9] border border-blue-100 mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{currentLocName}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                  {service.name} in {currentLocName}
                </h1>

                <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
                  {service.fullOverview}
                </p>

                {locationState && (
                  <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-700 leading-relaxed">
                    <span className="font-bold text-gray-900 block mb-1">
                      Local Context for {locationState.name}:
                    </span>
                    {locationState.localOverview} {locationState.climatePowerContext}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onPostRequest(service.name, currentAreaShort)}
                    className="px-6 py-2.5 bg-[#3D74D9] hover:bg-[#2B5BB8] text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    Request Quotations
                  </button>
                  <button
                    onClick={onJoinAsBusiness}
                    className="px-5 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-800 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Join as a Professional
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 h-64 sm:h-72 rounded-2xl overflow-hidden relative shadow-inner border border-gray-200">
                <img
                  src={service.featuredImage}
                  alt={`${service.name} in ${currentLocName}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-semibold">
                    Verified Contracting & Service Coverage in {currentLocName}
                  </span>
                </div>
              </div>
            </div>

            {/* Real Professionals Directory Display (Zero Invented Businesses) */}
            <RealProsList
              professionals={professionals}
              serviceTitle={service.name}
              locationName={currentLocName}
              isLoading={isLoadingPros}
              onSelectProfessional={onSelectProfessional}
              onRequestQuotes={() => onPostRequest(service.name, currentAreaShort)}
              onJoinAsBusiness={onJoinAsBusiness}
            />

            {/* Detailed Local Service Technical Guide */}
            <section className="my-12 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                {service.name} in {currentLocName}: Planning & Scope Guide
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#3D74D9]" />
                    Typical Project Scopes
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Key scopes handled by certified contractors in {currentAreaShort}:
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                    {service.subServices.map((sub, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3D74D9] mt-2 flex-shrink-0" />
                        <span>{sub}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#3D74D9]" />
                    Questions to Ask Before Awarding Contracts
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Verify these details with contractors before releasing mobilization funds:
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                    {service.keyQuestionsToAsk.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm mt-8 pt-8 border-t border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#3D74D9]" />
                    What Affects Pricing & Cost?
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                    {service.costFactors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    How to Compare Professionals
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                    {service.comparisonGuide.map((guide, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
                        <span>{guide}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Marketplace CTA Banner */}
            <SeoMarketplaceCta
              serviceName={service.name}
              locationName={currentLocName}
              onFindPros={() => onNavigateService('all')}
              onPostRequest={() => onPostRequest(service.name, currentAreaShort)}
              onJoinAsBusiness={onJoinAsBusiness}
            />

            {/* Related Guides Section */}
            {relevantGuides.length > 0 && (
              <section className="my-12">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">
                    Helpful Guides for {service.name}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {relevantGuides.map((guide) => (
                    <div
                      key={guide.id}
                      onClick={() => onNavigateArticle(guide.slug)}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="h-36 overflow-hidden">
                        <img
                          src={guide.featuredImage}
                          alt={guide.featuredImageAlt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-[#3D74D9] uppercase tracking-wider">
                            {guide.category}
                          </span>
                          <h3 className="font-bold text-gray-900 text-sm mt-1 line-clamp-2 group-hover:text-[#3D74D9] transition-colors">
                            {guide.title}
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

            {/* Internal Linking Network: Related Services & Locations */}
            <section className="mt-16 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Related Services in this location */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Other Possible Services
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {relatedServices.map((rel) => (
                      <button
                        key={rel.slug}
                        onClick={() => onNavigateService(rel.slug, locationState?.slug)}
                        className="text-left text-xs p-2.5 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-800 font-medium transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate">{rel.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub / Major Locations */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Explore Coverage by Location
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {NIGERIA_LOCATIONS.slice(0, 6).map((loc) => (
                      <button
                        key={loc.slug}
                        onClick={() => onNavigateLocation(loc.slug, service.slug)}
                        className="text-left text-xs p-2 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate">{loc.name}</span>
                        <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-900" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
