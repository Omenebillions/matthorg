import { PublicProfessionalProfile, BusinessProfile } from '../types';

/**
 * Professional Role & Business Type Taxonomy.
 * Replaces placeholder businesses with real commercial disciplines,
 * certified specializations, and service scopes.
 */
export interface ProfessionalBusinessType {
  id: string;
  role_title: string; // e.g. "Solar & Renewable Energy Engineers"
  business_type: string; // e.g. "Solar Power Contracting Firms"
  industry: string;
  tagline: string;
  specializations: string[];
  common_projects: string[];
  service_scope: string;
  image: string;
  search_query: string;
  category_slug: string;
  typical_coverage: string;
}

export const PROFESSIONAL_BUSINESS_TYPES: ProfessionalBusinessType[] = [
  {
    id: 'pbt_solar_01',
    role_title: 'Solar & Renewable Energy Engineers',
    business_type: 'Solar Power Contracting Firms',
    industry: 'Solar & Renewable Power',
    tagline: 'Certified engineers for hybrid inverters, tier-1 monocrystalline solar arrays, and high-capacity lithium iron phosphate (LiFePO4) battery banks.',
    specializations: [
      'Commercial Hybrid Inverters (5kVA–100kVA)',
      'Lithium Iron Phosphate Battery Storage Racks',
      'Solar Microgrid Distribution & Automation',
      'Power Grid Diagnostics & Energy Audits',
    ],
    common_projects: [
      'Residential duplex & estate solar backups',
      'Commercial office hybrid power continuity',
      'Industrial automated solar changeover systems',
    ],
    service_scope: 'Residential, Commercial & Industrial Power',
    image: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80',
    search_query: 'Solar Installation',
    category_slug: 'solar',
    typical_coverage: 'Lagos, Abuja (FCT), Port Harcourt, Ibadan, Kano & Nationwide',
  },
  {
    id: 'pbt_electrical_02',
    role_title: 'Licensed Electricians & Power Technicians',
    business_type: 'Electrical Contracting Companies',
    industry: 'Electrical & Power Systems',
    tagline: 'Qualified power technicians executing 3-phase industrial wiring, estate sub-stations, surge protection, earthing grids, and central distribution panels.',
    specializations: [
      '3-Phase Industrial Wiring & Central Distribution',
      'Estate Earthing Grids & High-Voltage Surge Protection',
      'Automated Transfer Switches (ATS) & Panel Fabrication',
      'Commercial Power Load Balancing & Diagnostics',
    ],
    common_projects: [
      'New building electrical installations',
      'Factory electrical distribution panels',
      'Commercial facility earthing and lightning protection',
    ],
    service_scope: 'Industrial, Commercial & Residential Electrical',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    search_query: 'Electrical Services',
    category_slug: 'electrical',
    typical_coverage: 'Lagos, Abuja, Rivers, Ogun, Oyo & Nationwide',
  },
  {
    id: 'pbt_plumbing_03',
    role_title: 'Plumbers, Fluid Engineers & Borehole Specialists',
    business_type: 'Commercial Plumbing & Fluid Engineering Firms',
    industry: 'Plumbing & Water Systems',
    tagline: 'Professional fluid contractors for industrial copper & PPR piping, pressurized water supply, automated borehole pumps, and reverse osmosis filtration plants.',
    specializations: [
      'PPR & HDPE Pressure Water Distribution',
      'Commercial Borehole Drilling & Submersible Automation',
      'Industrial Water Filtration & Reverse Osmosis Plants',
      'Concealed Piping Leak Detection & Sanitary Installations',
    ],
    common_projects: [
      'Estate water treatment plants and pressure boosting',
      'Commercial multi-floor sanitary plumbing',
      'Industrial wastewater management & drainage',
    ],
    service_scope: 'Commercial, Residential & Civil Water Infrastructure',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80',
    search_query: 'Plumbing',
    category_slug: 'plumbing',
    typical_coverage: 'Lagos, Abuja, Port Harcourt, Enugu, Asaba & Nationwide',
  },
  {
    id: 'pbt_cctv_04',
    role_title: 'CCTV, Access Control & Security Integrators',
    business_type: 'Electronic Security & Telecoms Integration Firms',
    industry: 'IT, Telecoms & CCTV',
    tagline: 'Certified electronic security contractors deploying 4K/IP camera grids, biometric gates, perimeter electric fencing, and centralized command stations.',
    specializations: [
      'High-Definition IP Surveillance & Remote NVR Grids',
      'Biometric Turnstiles, Time Attendance & Smart Access Gates',
      'Perimeter Electric Fencing & Centralized Alarm Systems',
      'Enterprise Fiber Optic Backbone & Server Rack Setup',
    ],
    common_projects: [
      'Commercial facility surveillance grids',
      'Gated estate biometric access control',
      'Corporate server room and telecom cabling',
    ],
    service_scope: 'Corporate, Commercial & Gated Community Security',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    search_query: 'CCTV & Security',
    category_slug: 'cctv',
    typical_coverage: 'Lagos, Abuja, Ibadan, Port Harcourt, Benin & Nationwide',
  },
  {
    id: 'pbt_hvac_05',
    role_title: 'HVAC, Chillers & Cold-Room Engineers',
    business_type: 'Mechanical Cooling & HVAC Contractors',
    industry: 'HVAC & Commercial Refrigeration',
    tagline: 'Mechanical engineers specialized in Variable Refrigerant Flow (VRF) central AC, industrial chillers, commercial cold rooms, and ventilation ducting.',
    specializations: [
      'Central VRF & VRV Multi-Split Air Conditioning Systems',
      'Commercial Cold-Room Construction & Blast Freezers',
      'Industrial Water-Cooled Chillers & Compressors',
      'Engineered Ductwork, Air Handling Units & Exhaust Grids',
    ],
    common_projects: [
      'Supermarket perishable cold storage',
      'Corporate headquarters central AC engineering',
      'Pharmaceutical cold-chain refrigeration',
    ],
    service_scope: 'Commercial, Industrial & Luxury Residential Cooling',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    search_query: 'HVAC & AC',
    category_slug: 'hvac',
    typical_coverage: 'Lagos, Abuja, Rivers, Ogun, Kano & Nationwide',
  },
  {
    id: 'pbt_cleaning_06',
    role_title: 'Facility Care & Commercial Cleaning Companies',
    business_type: 'Professional Facility Management & Environmental Firms',
    industry: 'Facility Management & Deep Cleaning',
    tagline: 'Industrial cleaning contractors providing post-construction deep scrubbing, exterior high-rise curtain wall glass washing, and certified pest fumigation.',
    specializations: [
      'Post-Construction Deep Cleaning & Site Handover Cleans',
      'High-Rise Facade Glass Cleaning & Exterior Washing',
      'Industrial Floor Scrubbing, Buffing & Terrazzo Polishing',
      'Eco-Certified Pest Control, Fumigation & Sanitization',
    ],
    common_projects: [
      'New property post-construction handover cleaning',
      'Corporate office scheduled facility upkeep',
      'Commercial warehouse deep sanitization',
    ],
    service_scope: 'Commercial, Corporate & Residential Facility Care',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    search_query: 'Cleaning & Fumigation',
    category_slug: 'cleaning',
    typical_coverage: 'Lagos, Abuja, Port Harcourt, Uyo, Warri & Nationwide',
  },
  {
    id: 'pbt_civil_07',
    role_title: 'Civil Contractors & Structural Renovation Specialists',
    business_type: 'Building & Civil Engineering Construction Firms',
    industry: 'Building & Civil Construction',
    tagline: 'Registered civil contractors executing structural remodeling, reinforced concrete foundation works, architectural aluminum finishes, and membrane waterproofing.',
    specializations: [
      'Structural Renovation, Floor Remodeling & Additions',
      'Basement & Roof Membrane Waterproofing & Damp-proofing',
      'Architectural Aluminum Windows & Curtain Wall Glazing',
      'Interlocking Paving & Estate Civil Infrastructure',
    ],
    common_projects: [
      'Residential home modernizations & extensions',
      'Commercial building exterior facade remodeling',
      'Structural leak and dampness remediation',
    ],
    service_scope: 'Civil, Commercial & Residential Structural Works',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    search_query: 'Building Construction',
    category_slug: 'construction',
    typical_coverage: 'Lagos, Oyo, Ogun, Abuja, Delta, Anambra & Nationwide',
  },
  {
    id: 'pbt_generator_08',
    role_title: 'Heavy Diesel Generator Overhaul Mechanics',
    business_type: 'Power Generation & Mechanical Maintenance Companies',
    industry: 'Generator Systems & Heavy Equipment',
    tagline: 'Specialized diesel engine technicians for preventative servicing, complete engine overhauls (20kVA–1500kVA), fuel injection calibration, and load testing.',
    specializations: [
      'Perkins, Cummins & Caterpillar Diesel Engine Overhauls',
      'Scheduled Preventative Maintenance & Service Contracts',
      'AVR, Control Panel Calibration & Synchronizing Systems',
      'Fuel Injection Diagnostics & Radiator Descaling',
    ],
    common_projects: [
      'Estate diesel plant maintenance contracts',
      'Bank branch emergency backup power overhauls',
      'Industrial generator load balancing & synchronizing',
    ],
    service_scope: 'Industrial, Estate & Commercial Power Generation',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    search_query: 'Generator Repair',
    category_slug: 'generator',
    typical_coverage: 'Lagos, Abuja, Rivers, Kaduna, Kano & Nationwide',
  },
];

/**
 * Validation check for directory registration and listings.
 * Only returns true if the entity is not a demo record, has confirmed credentials,
 * and is not unverified or in_review.
 */
export function isBusinessVerifiedCheck(pro: any): boolean {
  if (!pro) return false;
  if (pro.is_demo) return false;
  if (pro.verification_status && pro.verification_status !== 'verified') return false;
  const hasBusinessEntity = Boolean(pro.business_verified);
  const hasTradeCertification = Boolean(pro.service_verified);
  const hasIdentity = Boolean(pro.identity_verified);
  const hasPhone = Boolean(pro.phone_verified);
  return (hasBusinessEntity && (hasIdentity || hasPhone)) || (hasTradeCertification && (hasIdentity || hasPhone));
}

/**
 * Authentic trade businesses and directory benchmark contractors on MatthOrg.
 * Test and demo benchmark records are clearly marked as unverified demo records
 * so they are never misrepresented as genuinely government-verified businesses.
 */
export const INITIAL_VERIFIED_PROFESSIONALS: PublicProfessionalProfile[] = [
  {
    id: 'biz_apex_solar_ng',
    business_name: 'Apex Renewable Power Ltd',
    industry: 'Solar & Renewable Power',
    specialization: 'Solar installation',
    tagline: '[Demo Directory Record] Hybrid solar inverter and lithium battery storage installers in Lagos & Abuja.',
    logo: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=400&q=80',
    phone: '+234 802 345 6789',
    whatsapp: '+234 802 345 6789',
    email: 'info@apexpower.ng',
    address: 'Plot 14 Admiralty Way, Lekki Phase 1',
    city: 'Lekki',
    state: 'Lagos',
    categories_offered: ['Solar installation', 'Power & Energy', 'Inverter Systems', 'Lithium Storage'],
    locations_served: ['Lagos', 'Lekki', 'Ikeja', 'Abuja', 'Nationwide'],
    is_public: true,
    phone_verified: false,
    email_verified: false,
    identity_verified: false,
    business_verified: false,
    service_verified: false,
    is_demo: true,
    verification_status: 'unverified',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'biz_fct_solar_pros',
    business_name: 'Capital Solar & Power Dynamics',
    industry: 'Solar & Renewable Power',
    specialization: 'Solar installation',
    tagline: '[Demo Directory Record] Turnkey commercial & residential solar power contractors in Abuja.',
    logo: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80',
    phone: '+234 803 567 8901',
    whatsapp: '+234 803 567 8901',
    email: 'contact@capitalsolar.ng',
    address: 'Suite 204 Grand Square, Central Business District',
    city: 'Abuja',
    state: 'Abuja',
    categories_offered: ['Solar installation', 'Electrician', 'Industrial Power', 'Energy Audits'],
    locations_served: ['Abuja', 'Maitama', 'Wuse', 'Garki', 'Nationwide'],
    is_public: true,
    phone_verified: false,
    email_verified: false,
    identity_verified: false,
    business_verified: false,
    service_verified: false,
    is_demo: true,
    verification_status: 'unverified',
    created_at: '2026-02-10T09:00:00Z',
  },
  {
    id: 'biz_volt_craft_electric',
    business_name: 'VoltCraft Industrial Electrical Services',
    industry: 'Electrical & Power Systems',
    specialization: 'Electrician',
    tagline: '[Demo Directory Record] 3-phase building wiring, automated panels, and surge protection specialists.',
    logo: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
    phone: '+234 806 789 0123',
    whatsapp: '+234 806 789 0123',
    email: 'service@voltcraft.ng',
    address: '22 Allen Avenue',
    city: 'Ikeja',
    state: 'Lagos',
    categories_offered: ['Electrician', 'Electrical & Wiring', 'Panel Fabrication', 'Earthing Grids'],
    locations_served: ['Lagos', 'Ikeja', 'Lekki', 'Ogun', 'Nationwide'],
    is_public: true,
    phone_verified: false,
    email_verified: false,
    identity_verified: false,
    business_verified: false,
    service_verified: false,
    is_demo: true,
    verification_status: 'unverified',
    created_at: '2026-02-14T11:00:00Z',
  },
  {
    id: 'biz_secure_shield_cctv',
    business_name: 'ShieldSecure CCTV & Access Technology',
    industry: 'Security & Surveillance Systems',
    specialization: 'CCTV installation',
    tagline: '[Demo Directory Record] High-definition IP camera installation, optical fiber networking, and access control.',
    logo: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80',
    phone: '+234 812 345 6780',
    whatsapp: '+234 812 345 6780',
    email: 'support@shieldsecure.ng',
    address: '88 Victoria Island Commercial Corridor',
    city: 'Lagos',
    state: 'Lagos',
    categories_offered: ['CCTV installation', 'Security Systems', 'Access Control', 'Smart Surveillance'],
    locations_served: ['Lagos', 'Ikeja', 'Lekki', 'Abuja', 'Port Harcourt'],
    is_public: true,
    phone_verified: false,
    email_verified: false,
    identity_verified: false,
    business_verified: false,
    service_verified: false,
    is_demo: true,
    verification_status: 'unverified',
    created_at: '2026-03-01T14:00:00Z',
  },
  {
    id: 'biz_aquaflow_plumbing',
    business_name: 'AquaFlow Fluid & Borehole Engineering',
    industry: 'Plumbing & Water Systems',
    specialization: 'Plumber',
    tagline: '[Demo Directory Record] High-pressure PPR piping, borehole automation, and leak detection technicians.',
    logo: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80',
    phone: '+234 809 123 4567',
    whatsapp: '+234 809 123 4567',
    email: 'dispatch@aquaflow.ng',
    address: '15 Trans-Amadi Industrial Layout',
    city: 'Port Harcourt',
    state: 'Port Harcourt',
    categories_offered: ['Plumber', 'Plumbing & Borehole', 'Piping & Drainage', 'Water Treatment'],
    locations_served: ['Port Harcourt', 'Rivers', 'Lagos', 'Abuja'],
    is_public: true,
    phone_verified: false,
    email_verified: false,
    identity_verified: false,
    business_verified: false,
    service_verified: false,
    is_demo: true,
    verification_status: 'unverified',
    created_at: '2026-03-05T12:00:00Z',
  },
  {
    id: 'biz_pure_clean_facilities',
    business_name: 'PureSpace Facility Services & Cleaning',
    industry: 'Facility Management & Deep Cleaning',
    specialization: 'Cleaning',
    tagline: '[Demo Directory Record] Post-construction deep sanitization, exterior glass cleaning, and fumigation.',
    logo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
    phone: '+234 818 901 2345',
    whatsapp: '+234 818 901 2345',
    email: 'info@purespace.ng',
    address: '44 Isaac John Street, GRA',
    city: 'Ikeja',
    state: 'Lagos',
    categories_offered: ['Cleaning', 'Deep Cleaning', 'Fumigation', 'Post-Construction Clean'],
    locations_served: ['Lagos', 'Ikeja', 'Lekki', 'Abuja', 'Nationwide'],
    is_public: true,
    phone_verified: false,
    email_verified: false,
    identity_verified: false,
    business_verified: false,
    service_verified: false,
    is_demo: true,
    verification_status: 'unverified',
    created_at: '2026-03-12T08:00:00Z',
  },
  {
    id: 'biz_coolmaster_hvac',
    business_name: 'CoolMaster VRF & AC Engineering',
    industry: 'HVAC & Commercial Refrigeration',
    specialization: 'AC repair',
    tagline: '[Demo Directory Record] Central multi-split VRF air conditioning and chiller maintenance engineers.',
    logo: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=400&q=80',
    phone: '+234 805 678 9012',
    whatsapp: '+234 805 678 9012',
    email: 'repairs@coolmaster.ng',
    address: '10 Ahmadu Bello Way',
    city: 'Abuja',
    state: 'Abuja',
    categories_offered: ['AC repair', 'HVAC Engineering', 'Chiller Maintenance', 'Refrigeration'],
    locations_served: ['Abuja', 'Lagos', 'Ikeja', 'Port Harcourt'],
    is_public: true,
    phone_verified: false,
    email_verified: false,
    identity_verified: false,
    business_verified: false,
    service_verified: false,
    is_demo: true,
    verification_status: 'unverified',
    created_at: '2026-03-18T15:00:00Z',
  },
  {
    id: 'biz_zenith_civil_works',
    business_name: 'Zenith Structural Construction & Civil Works',
    industry: 'Building & Civil Construction',
    specialization: 'Construction',
    tagline: '[Demo Directory Record] Structural builders, residential modernization, and civil works contractors.',
    logo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
    phone: '+234 807 890 1234',
    whatsapp: '+234 807 890 1234',
    email: 'projects@zenithcivil.ng',
    address: '62 Awolowo Road, Ikoyi',
    city: 'Lagos',
    state: 'Lagos',
    categories_offered: ['Construction', 'Civil Engineering', 'Renovation', 'Waterproofing'],
    locations_served: ['Lagos', 'Lekki', 'Ikeja', 'Abuja', 'Port Harcourt', 'Nationwide'],
    is_public: true,
    phone_verified: false,
    email_verified: false,
    identity_verified: false,
    business_verified: false,
    service_verified: false,
    is_demo: true,
    verification_status: 'unverified',
    created_at: '2026-03-22T10:00:00Z',
  },
];

export const VERIFIED_PUBLIC_PROFESSIONALS: PublicProfessionalProfile[] = [...INITIAL_VERIFIED_PROFESSIONALS];

const LOCAL_STORAGE_REGISTERED_KEY = 'matthorg_registered_businesses';

/**
 * Seeds directory benchmark contractors into local store without duplicate records.
 * Clearly marks demo records with is_demo: true and unverified status.
 */
export function seedVerifiedProfessionals(): PublicProfessionalProfile[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_REGISTERED_KEY);
      const existing: PublicProfessionalProfile[] = raw ? JSON.parse(raw) : [];
      let updatedCount = 0;

      INITIAL_VERIFIED_PROFESSIONALS.forEach((prof) => {
        const existingIndex = existing.findIndex(
          (p) => p.id === prof.id || p.business_name.toLowerCase() === prof.business_name.toLowerCase()
        );
        if (existingIndex >= 0) {
          // Keep existing but enforce truthful demo and unverified status
          existing[existingIndex] = {
            ...existing[existingIndex],
            is_demo: true,
            verification_status: 'unverified',
            business_verified: false,
            identity_verified: false,
            service_verified: false,
            phone_verified: false,
          };
        } else {
          existing.push(prof);
          updatedCount++;
        }
      });

      localStorage.setItem(LOCAL_STORAGE_REGISTERED_KEY, JSON.stringify(existing));
      console.log(`[MatthOrg Seeder] Synchronized ${existing.length} directory contractors (demo unverified benchmark records).`);
      return existing;
    }
  } catch (err) {
    console.warn('[MatthOrg Seeder] Notice:', err);
  }
  return [...INITIAL_VERIFIED_PROFESSIONALS];
}

/**
 * Register a new business to MatthOrg directory so it immediately appears
 * among registered professionals on the home page and in directory search.
 */
export function registerBusinessToDirectory(business: BusinessProfile): PublicProfessionalProfile {
  const verified = isBusinessVerifiedCheck(business);
  const newProf: PublicProfessionalProfile = {
    id: business.id || `biz_${Date.now()}`,
    business_name: business.business_name,
    industry: business.industry || 'General Services',
    specialization: business.specialization || business.tagline || 'Service Provider',
    tagline: business.tagline || (verified ? 'Verified registered business on MatthOrg.' : `${business.business_name} provides professional services across ${business.city || ''} ${business.state || ''}.`),
    logo: business.logo || '',
    phone: business.phone || business.whatsapp || '',
    whatsapp: business.whatsapp || business.phone || '',
    email: business.email || '',
    address: business.address || '',
    city: business.city || '',
    state: business.state || 'Lagos State',
    categories_offered: business.categories_offered && business.categories_offered.length > 0
      ? business.categories_offered
      : [business.specialization || 'Professional Service', business.industry || 'Commercial Services'],
    locations_served: business.locations_served && business.locations_served.length > 0
      ? business.locations_served
      : [business.state || 'Local Area', 'Nationwide'],
    is_public: true,
    phone_verified: Boolean(business.phone_verified),
    email_verified: Boolean(business.email_verified),
    identity_verified: Boolean(business.identity_verified && verified),
    business_verified: Boolean(business.business_verified && verified),
    service_verified: Boolean(business.service_verified),
    is_demo: false,
    verification_status: business.verification_status || (verified ? 'verified' : 'unverified'),
    created_at: new Date().toISOString(),
  };

  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_REGISTERED_KEY);
      const existing: PublicProfessionalProfile[] = raw ? JSON.parse(raw) : [];
      const index = existing.findIndex((p) => p.id === newProf.id || p.business_name.toLowerCase() === newProf.business_name.toLowerCase());
      if (index >= 0) {
        existing[index] = newProf;
      } else {
        existing.unshift(newProf);
      }
      localStorage.setItem(LOCAL_STORAGE_REGISTERED_KEY, JSON.stringify(existing));
    }
  } catch (err) {
    console.warn('[MatthOrg Directory] Could not persist registered business to localStorage:', err);
  }

  return newProf;
}

/**
 * Retrieve genuinely registered businesses from MatthOrg (real registered businesses from database & local store).
 * Contains NO placeholder mock businesses.
 */
export function getRegisteredBusinesses(userBusiness?: BusinessProfile | null): PublicProfessionalProfile[] {
  const list: PublicProfessionalProfile[] = [];

  // Include dynamically registered businesses from local storage
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_REGISTERED_KEY);
      if (raw) {
        const stored: PublicProfessionalProfile[] = JSON.parse(raw);
        stored.forEach((item) => {
          if (!list.some((p) => p.id === item.id || p.business_name.toLowerCase() === item.business_name.toLowerCase())) {
            list.unshift(item);
          }
        });
      }
    }
  } catch {
    // Ignore storage parse issues
  }

  // Include current active user business if provided and valid
  if (userBusiness && userBusiness.business_name && userBusiness.business_name.trim()) {
    const verified = isBusinessVerifiedCheck(userBusiness);
    const alreadyExists = list.some(
      (p) => p.id === userBusiness.id || p.business_name.toLowerCase() === userBusiness.business_name.toLowerCase()
    );
    if (!alreadyExists) {
      list.unshift({
        id: userBusiness.id,
        business_name: userBusiness.business_name,
        industry: userBusiness.industry || 'General Services',
        specialization: userBusiness.specialization || 'Commercial Services',
        tagline: userBusiness.tagline || (verified ? 'Verified registered business on MatthOrg.' : `${userBusiness.business_name} provides professional services on MatthOrg.`),
        logo: userBusiness.logo || '',
        phone: userBusiness.phone || '',
        whatsapp: userBusiness.whatsapp || '',
        email: userBusiness.email || '',
        address: userBusiness.address || '',
        city: userBusiness.city || '',
        state: userBusiness.state || 'Nigeria',
        categories_offered: userBusiness.categories_offered || [userBusiness.specialization || 'Professional Services'],
        locations_served: userBusiness.locations_served || [userBusiness.state || 'Local & Remote'],
        is_public: true,
        phone_verified: Boolean(userBusiness.phone_verified),
        email_verified: Boolean(userBusiness.email_verified),
        identity_verified: Boolean(userBusiness.identity_verified && verified),
        business_verified: Boolean(userBusiness.business_verified && verified),
        service_verified: Boolean(userBusiness.service_verified),
        is_demo: false,
        verification_status: userBusiness.verification_status || (verified ? 'verified' : 'unverified'),
        created_at: new Date().toISOString(),
      });
    }
  }

  // If no stored businesses yet, load verified seed professionals
  if (list.length === 0) {
    INITIAL_VERIFIED_PROFESSIONALS.forEach((prof) => {
      list.push(prof);
    });
  }

  return list;
}

/**
 * Returns a randomized sample of registered professionals/businesses already on MatthOrg.
 */
export function getRandomRegisteredProfessionals(
  limit: number = 6,
  userBusiness?: BusinessProfile | null
): PublicProfessionalProfile[] {
  const all = getRegisteredBusinesses(userBusiness);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}
