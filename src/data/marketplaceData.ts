import { IntentLevel } from '../types';

export interface ServiceCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
  subcategories: string[];
  popularTags: string[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'power_tech',
    name: 'Power & Technology',
    iconName: 'Zap',
    description: 'Solar, inverters, backup batteries, CCTV, smart automation & power infrastructure',
    subcategories: [
      'Solar Installation',
      'Inverter Systems & Lithium Batteries',
      'CCTV & Access Control',
      'Smart Home Automation',
      'Networking & Fiber Internet',
      'Generator Services & Changeovers',
    ],
    popularTags: ['5kVA Inverter', 'Lithium Battery', 'Solar Panels', 'CCTV 4-Cam', 'Starlink Setup'],
  },
  {
    id: 'home_property',
    name: 'Home & Property',
    iconName: 'Home',
    description: 'Residential cleaning, maintenance, repairs, plumbing, electrical & renovations',
    subcategories: [
      'Deep Cleaning & Post-Construction',
      'Plumbing & Water Heaters',
      'Electrical Wiring & Fittings',
      'Painting & Wall Screeding',
      'Carpentry & Cabinetry',
      'Pest Control & Fumigation',
      'Relocation & Packing',
    ],
    popularTags: ['Duplex Deep Clean', 'Water Pressure Pump', 'Repainting 4-Bed', 'Kitchen Cabinets'],
  },
  {
    id: 'construction',
    name: 'Construction & Building',
    iconName: 'Building',
    description: 'Architecture, masonry, interior design, POP ceiling, roofing and aluminium',
    subcategories: [
      'Architectural Drawings & 3D Plans',
      'Interior Design & Fit-out',
      'POP Ceiling & Drywall',
      'Tiling & Marble Works',
      'Roofing & Trusses',
      'Aluminium Windows & Glass Partitions',
    ],
    popularTags: ['3D Architectural Plan', 'POP Ceiling Living Room', 'Vitrified Tiling', 'Glass Partitions'],
  },
  {
    id: 'digital_it',
    name: 'Digital & Software',
    iconName: 'Monitor',
    description: 'Custom web apps, mobile applications, brand identities, SEO & IT systems',
    subcategories: [
      'Website Development & WordPress',
      'Mobile App Development (iOS/Android)',
      'Brand Identity & Graphic Design',
      'Digital Marketing & Meta/Google Ads',
      'Search Engine Optimization (SEO)',
      'Office IT Infrastructure & Server Setup',
    ],
    popularTags: ['Corporate Website', 'E-commerce Store', 'Company Brand Kit', 'Google Ads Campaign'],
  },
  {
    id: 'automotive',
    name: 'Automotive Care',
    iconName: 'Car',
    description: 'Vehicle mechanical diagnostics, auto-AC, car detailing, tracking and fleet support',
    subcategories: [
      'Computerized Diagnostics & Repair',
      'Car Air Conditioning Recharge & Servicing',
      'Auto Detailing & Ceramic Coating',
      'GPS Tracker & Fleet Management',
      'Auto Electrical & Alternators',
    ],
    popularTags: ['AC Compressor Fix', 'Engine Diagnostics', 'Ceramic Paint Coating', 'GPS Vehicle Tracker'],
  },
  {
    id: 'events',
    name: 'Events & Media',
    iconName: 'Camera',
    description: 'Professional catering, event photography, videography, decor & sound engineering',
    subcategories: [
      'Corporate & Wedding Catering',
      'Professional Photography',
      'Cinematography & Video Coverage',
      'Event Decoration & Canopy Setup',
      'Sound System & DJ Services',
    ],
    popularTags: ['Wedding Photography', 'Corporate Buffet 100 Pax', '4K Drone Coverage', 'Sound Setup'],
  },
  {
    id: 'business_pro',
    name: 'Business & Professional',
    iconName: 'Briefcase',
    description: 'CAC registration, tax filing, accounting, legal agreements, printing & logistics',
    subcategories: [
      'CAC Registration & Corporate Filing',
      'Accounting & Bookkeeping Services',
      'Commercial Contract & Legal Drafting',
      'Corporate Printing & Merchandise',
      'Interstate Dispatch & Freight Logistics',
    ],
    popularTags: ['CAC Company Reg', 'Tax Clearance Certificate', 'Corporate Brochures', 'Audit Review'],
  },
];

export const POPULAR_LOCATIONS = [
  'Worldwide / Remote',
  'London, United Kingdom',
  'Manchester, United Kingdom',
  'New York, NY, United States',
  'San Francisco, CA, United States',
  'Austin, TX, United States',
  'Toronto, ON, Canada',
  'Vancouver, BC, Canada',
  'Dubai, United Arab Emirates',
  'Nairobi, Kenya',
  'Lagos, Nigeria',
  'Abuja, Nigeria',
  'Johannesburg, South Africa',
  'Sydney, NSW, Australia',
  'Singapore',
  'Berlin, Germany',
  'Amsterdam, Netherlands',
];

export function calculateIntentScore(data: {
  service_required?: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
  budget_formatted?: string;
  budget_min?: number;
  timeline?: string;
  is_verified?: boolean;
  notes?: string;
}): { score: number; level: IntentLevel } {
  let score = 20; // Base score for creating a request

  if (data.service_required && data.service_required.trim().length > 3) {
    score += 15;
  }
  if (data.phone && data.phone.replace(/\D/g, '').length >= 10) {
    score += 15;
  }
  if (data.whatsapp && data.whatsapp.replace(/\D/g, '').length >= 10) {
    score += 10;
  }
  if (data.location && data.location.trim().length > 2) {
    score += 10;
  }
  if (data.budget_formatted || (data.budget_min && data.budget_min > 0)) {
    score += 10;
  }
  if (data.timeline && data.timeline !== 'flexible') {
    score += 10;
  }
  if (data.notes && data.notes.length > 25) {
    score += 5;
  }
  if (data.is_verified) {
    score += 15;
  }

  // Cap at 99 unless both verified and comprehensive
  if (score > 100) score = 100;

  let level: IntentLevel = 'Medium';
  if (score >= 80) level = 'Very High';
  else if (score >= 60) level = 'High';
  else if (score >= 40) level = 'Medium';
  else level = 'Low';

  return { score, level };
}

// "Request Anything" Natural Language Parser (PRD section 19)
export function parseNaturalLanguageRequest(text: string): {
  services: string[];
  category: string;
  location: string;
  property: string;
  budget: string;
  timeline: 'immediate' | 'within_7_days' | 'within_30_days' | 'flexible';
} {
  const lower = text.toLowerCase();

  // Extract detected location
  let detectedLocation = 'Abuja (FCT)';
  if (lower.includes('abuja') || lower.includes('maitama') || lower.includes('wuse') || lower.includes('garki')) {
    detectedLocation = 'Abuja (FCT)';
  } else if (lower.includes('lekki')) {
    detectedLocation = 'Lagos - Lekki Phase 1';
  } else if (lower.includes('ikeja') || lower.includes('maryland')) {
    detectedLocation = 'Lagos - Ikeja & GRA';
  } else if (lower.includes('victoria island') || lower.includes('vi') || lower.includes('ikoyi')) {
    detectedLocation = 'Lagos - Victoria Island';
  } else if (lower.includes('lagos')) {
    detectedLocation = 'Lagos State';
  } else if (lower.includes('port harcourt') || lower.includes('ph')) {
    detectedLocation = 'Port Harcourt (Rivers)';
  } else if (lower.includes('ibadan')) {
    detectedLocation = 'Ibadan (Oyo)';
  }

  // Extract property
  let property = '3-bedroom residence';
  if (lower.includes('duplex')) property = '4-bedroom detached duplex';
  else if (lower.includes('3-bedroom') || lower.includes('3 bedroom') || lower.includes('3 bed')) property = '3-bedroom house';
  else if (lower.includes('2-bedroom') || lower.includes('2 bedroom')) property = '2-bedroom apartment';
  else if (lower.includes('office') || lower.includes('commercial')) property = 'Commercial office space';
  else if (lower.includes('school')) property = 'School facility';
  else if (lower.includes('warehouse')) property = 'Industrial warehouse';

  // Extract services
  const foundServices: string[] = [];
  if (lower.includes('solar') || lower.includes('sun')) foundServices.push('Solar Installation');
  if (lower.includes('inverter') || lower.includes('battery') || lower.includes('lithium')) foundServices.push('Inverter & Battery Backup');
  if (lower.includes('cctv') || lower.includes('camera') || lower.includes('surveillance')) foundServices.push('CCTV & Surveillance Installation');
  if (lower.includes('internet') || lower.includes('wifi') || lower.includes('network') || lower.includes('starlink')) foundServices.push('Networking & Internet Setup');
  if (lower.includes('curtain') || lower.includes('blind')) foundServices.push('Curtains & Window Blinds');
  if (lower.includes('clean') || lower.includes('fumigation')) foundServices.push('Deep Cleaning & Fumigation');
  if (lower.includes('paint')) foundServices.push('House Painting & Screeding');
  if (lower.includes('plumb') || lower.includes('water heater')) foundServices.push('Plumbing & Water System');
  if (lower.includes('ac') || lower.includes('air condition')) foundServices.push('AC Installation & Servicing');
  if (lower.includes('web') || lower.includes('software') || lower.includes('app')) foundServices.push('Website Development');

  if (foundServices.length === 0) {
    foundServices.push('Comprehensive Service Contract');
  }

  // Determine category
  let category = 'Power & Technology';
  if (lower.includes('solar') || lower.includes('inverter') || lower.includes('cctv') || lower.includes('network')) {
    category = 'Power & Technology';
  } else if (lower.includes('clean') || lower.includes('paint') || lower.includes('plumb') || lower.includes('curtain')) {
    category = 'Home & Property';
  } else if (lower.includes('web') || lower.includes('app') || lower.includes('software')) {
    category = 'Digital & Software';
  }

  // Timeline
  let timeline: 'immediate' | 'within_7_days' | 'within_30_days' | 'flexible' = 'within_30_days';
  if (lower.includes('urgent') || lower.includes('immediate') || lower.includes('today') || lower.includes('asap')) {
    timeline = 'immediate';
  } else if (lower.includes('week') || lower.includes('7 days')) {
    timeline = 'within_7_days';
  } else if (lower.includes('month') || lower.includes('30 days')) {
    timeline = 'within_30_days';
  } else if (lower.includes('flexible') || lower.includes('later')) {
    timeline = 'flexible';
  }

  // Budget
  let budget = '₦800,000 – ₦1,500,000';
  if (lower.includes('5m') || lower.includes('5 million') || lower.includes('10m')) {
    budget = '₦5,000,000 – ₦10,000,000';
  } else if (lower.includes('2m') || lower.includes('2 million') || lower.includes('3m')) {
    budget = '₦2,000,000 – ₦3,500,000';
  } else if (lower.includes('1m') || lower.includes('1 million') || lower.includes('1.5m')) {
    budget = '₦1,000,000 – ₦1,800,000';
  } else if (lower.includes('500k') || lower.includes('600k') || lower.includes('700k')) {
    budget = '₦500,000 – ₦800,000';
  }

  return {
    services: foundServices,
    category,
    location: detectedLocation,
    property,
    budget,
    timeline,
  };
}
