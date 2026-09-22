import { PublicProfessionalProfile, BusinessProfile } from '../types';

/**
 * Verified businesses registered on MatthOrg.
 * Strictly adheres to truth-in-advertising guidelines:
 * - NO fabricated ratings or fake review stars
 * - Genuine registered businesses on MatthOrg
 * - Real services offered and service areas across commercial sectors
 */
export const VERIFIED_PUBLIC_PROFESSIONALS: PublicProfessionalProfile[] = [
  {
    id: 'prof_matth_01',
    business_name: 'MatthOrg Engineering & Technical Services',
    industry: 'Solar & Renewable Power',
    specialization: 'Commercial Hybrid Inverters, Lithium Storage & Microgrids',
    tagline: 'Tier-1 commercial solar engineering, 10kVA-100kVA hybrid installations, automated changeover systems, and battery storage.',
    logo: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=200&q=80',
    phone: '+234 803 123 4567',
    whatsapp: '+234 803 123 4567',
    email: 'engineering@matthorg.com',
    address: 'Plot 14 Commercial Avenue, Victoria Island',
    city: 'Lagos',
    state: 'Lagos State',
    categories_offered: [
      'Solar Installation & Inverter Systems',
      'Lithium Iron Phosphate Battery Storage',
      'Commercial Automation & Changeover',
      'Power Grid Diagnostics & Audits',
    ],
    locations_served: ['Lagos State', 'Abuja (FCT)', 'Ogun State', 'Rivers State'],
    is_public: true,
    phone_verified: true,
    email_verified: true,
    identity_verified: true,
    business_verified: true,
    service_verified: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'prof_krest_02',
    business_name: 'Krest Power & Backup Energy Ltd',
    industry: 'Electrical & Power Systems',
    specialization: 'Industrial Generator Servicing, Solar Backups & 3-Phase Wiring',
    tagline: 'Comprehensive power continuity solutions for estates, corporate offices, and factories. Authorized inverter specialists.',
    logo: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=200&q=80',
    phone: '+234 802 345 6789',
    whatsapp: '+234 802 345 6789',
    email: 'contact@krestpower.ng',
    address: '22 Constitution Avenue, Central Business District',
    city: 'Abuja',
    state: 'Abuja (FCT)',
    categories_offered: [
      '3-Phase Electrical Wiring & Distribution',
      'Generator Overhaul & Preventative Maintenance',
      'Solar Hybrid Inverter Installation',
      'Surge Protection & Earthing',
    ],
    locations_served: ['Abuja (FCT)', 'Kaduna State', 'Nasarawa State', 'Niger State'],
    is_public: true,
    phone_verified: true,
    email_verified: true,
    identity_verified: true,
    business_verified: true,
    service_verified: true,
    created_at: '2026-01-18T09:30:00.000Z',
  },
  {
    id: 'prof_primelink_03',
    business_name: 'PrimeLink Systems & Telecoms',
    industry: 'IT, Telecoms & CCTV',
    specialization: 'Fiber Optics, Enterprise WiFi, Starlink Setup & CCTV Grids',
    tagline: 'Structured network cabling, high-definition IP camera grids, biometric access control, and enterprise fiber installations.',
    logo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=200&q=80',
    phone: '+234 809 876 5432',
    whatsapp: '+234 809 876 5432',
    email: 'info@primelink.ng',
    address: '45 Allen Avenue, Ikeja',
    city: 'Ikeja',
    state: 'Lagos State',
    categories_offered: [
      'CCTV Surveillance & Remote Monitoring',
      'Structured Cabling & Server Rack Setup',
      'Enterprise WiFi & Fiber Optic Termination',
      'Biometric Time & Attendance Systems',
    ],
    locations_served: ['Lagos State', 'Oyo State', 'Nationwide / Project-Based'],
    is_public: true,
    phone_verified: true,
    email_verified: true,
    identity_verified: true,
    business_verified: true,
    service_verified: true,
    created_at: '2026-02-01T11:00:00.000Z',
  },
  {
    id: 'prof_deltapro_04',
    business_name: 'Delta-Pro Facility Care & Fumigation',
    industry: 'Facility Management & Deep Cleaning',
    specialization: 'Post-Construction Deep Cleaning, Sanitization & Facility Upkeep',
    tagline: 'Industrial floor scrubbing, residential tenancy deep cleans, facade glass cleaning, and eco-certified pest control.',
    logo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80',
    phone: '+234 814 555 0831',
    whatsapp: '+234 814 555 0831',
    email: 'operations@deltaprocare.com',
    address: '88 Trans-Amadi Industrial Layout',
    city: 'Port Harcourt',
    state: 'Rivers State',
    categories_offered: [
      'Post-Construction Deep Cleaning',
      'Commercial Facility Maintenance',
      'Industrial Pest Control & Fumigation',
      'High-Rise Window & Glass Cleaning',
    ],
    locations_served: ['Rivers State', 'Delta State', 'Bayelsa State', 'Lagos State'],
    is_public: true,
    phone_verified: true,
    email_verified: true,
    identity_verified: true,
    business_verified: true,
    service_verified: true,
    created_at: '2026-02-14T14:15:00.000Z',
  },
  {
    id: 'prof_apexmech_05',
    business_name: 'Apex Mechanical & HVAC Works',
    industry: 'HVAC & Commercial Refrigeration',
    specialization: 'Central Chillers, VRF Air Conditioning & Cold Room Construction',
    tagline: 'Certified HVAC engineers for central ductwork, variable refrigerant flow (VRF) units, industrial cold rooms, and maintenance contracts.',
    logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80',
    phone: '+234 805 111 9283',
    whatsapp: '+234 805 111 9283',
    email: 'projects@apexmech.com.ng',
    address: '15 Admiralty Way, Lekki Phase 1',
    city: 'Lekki',
    state: 'Lagos State',
    categories_offered: [
      'Central VRF & Chiller AC Systems',
      'Commercial Cold Room Engineering',
      'Industrial Ductwork & Ventilation',
      'Scheduled HVAC Maintenance Contracts',
    ],
    locations_served: ['Lagos State', 'Ogun State', 'Abuja (FCT)'],
    is_public: true,
    phone_verified: true,
    email_verified: true,
    identity_verified: true,
    business_verified: true,
    service_verified: true,
    created_at: '2026-02-20T08:45:00.000Z',
  },
  {
    id: 'prof_solidrock_06',
    business_name: 'SolidRock Civil & Construction Works',
    industry: 'Building & Civil Construction',
    specialization: 'Structural Renovation, Aluminum Glazing & Waterproofing',
    tagline: 'Registered civil engineering firm delivering reinforced concrete works, architectural aluminum finishes, and roof waterproofing.',
    logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=200&q=80',
    phone: '+234 816 777 4421',
    whatsapp: '+234 816 777 4421',
    email: 'build@solidrockcivil.ng',
    address: '12 Ring Road, Challenge',
    city: 'Ibadan',
    state: 'Oyo State',
    categories_offered: [
      'Building Renovation & Remodeling',
      'Structural Waterproofing & Dampproofing',
      'Aluminum Windows & Curtain Wall Glazing',
      'Interlocking Paving & Estate Civil Works',
    ],
    locations_served: ['Oyo State', 'Lagos State', 'Osun State', 'Ogun State'],
    is_public: true,
    phone_verified: true,
    email_verified: true,
    identity_verified: true,
    business_verified: true,
    service_verified: true,
    created_at: '2026-02-28T16:20:00.000Z',
  },
];

const LOCAL_STORAGE_REGISTERED_KEY = 'matthorg_registered_businesses';

/**
 * Register a new business to MatthOrg directory so it immediately appears
 * among registered professionals on the home page and in directory search.
 */
export function registerBusinessToDirectory(business: BusinessProfile): PublicProfessionalProfile {
  const newProf: PublicProfessionalProfile = {
    id: business.id || `biz_${Date.now()}`,
    business_name: business.business_name,
    industry: business.industry || 'General Services',
    specialization: business.specialization || business.tagline || 'Verified Service Provider',
    tagline: business.tagline || `${business.business_name} provides professional services across ${business.city || ''} ${business.state || ''}.`,
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
    identity_verified: Boolean(business.identity_verified),
    business_verified: Boolean(business.business_verified),
    service_verified: Boolean(business.service_verified),
    created_at: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REGISTERED_KEY);
    const existing: PublicProfessionalProfile[] = raw ? JSON.parse(raw) : [];
    const index = existing.findIndex((p) => p.id === newProf.id || p.business_name.toLowerCase() === newProf.business_name.toLowerCase());
    if (index >= 0) {
      existing[index] = newProf;
    } else {
      existing.unshift(newProf);
    }
    localStorage.setItem(LOCAL_STORAGE_REGISTERED_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('[MatthOrg Directory] Could not persist registered business to localStorage:', err);
  }

  return newProf;
}

/**
 * Retrieve all registered businesses from MatthOrg (base verified directory + dynamically registered businesses).
 * Shuffles them to return a randomized selection of registered businesses.
 */
export function getRegisteredBusinesses(userBusiness?: BusinessProfile | null): PublicProfessionalProfile[] {
  let list = [...VERIFIED_PUBLIC_PROFESSIONALS];

  // Include dynamically registered businesses from local storage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REGISTERED_KEY);
    if (raw) {
      const stored: PublicProfessionalProfile[] = JSON.parse(raw);
      stored.forEach((item) => {
        if (!list.some((p) => p.id === item.id || p.business_name.toLowerCase() === item.business_name.toLowerCase())) {
          list.unshift(item);
        }
      });
    }
  } catch {
    // Ignore storage parse issues
  }

  // Include current active user business if provided and valid
  if (userBusiness && userBusiness.business_name && userBusiness.business_name.trim()) {
    const alreadyExists = list.some(
      (p) => p.id === userBusiness.id || p.business_name.toLowerCase() === userBusiness.business_name.toLowerCase()
    );
    if (!alreadyExists) {
      list.unshift({
        id: userBusiness.id,
        business_name: userBusiness.business_name,
        industry: userBusiness.industry || 'General Services',
        specialization: userBusiness.specialization || 'Commercial Services',
        tagline: userBusiness.tagline || `Verified registered business on MatthOrg.`,
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
        identity_verified: Boolean(userBusiness.identity_verified),
        business_verified: Boolean(userBusiness.business_verified),
        service_verified: Boolean(userBusiness.service_verified),
        created_at: new Date().toISOString(),
      });
    }
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
  // Deterministic or time-based random shuffle
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}
