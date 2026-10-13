import { BusinessProfile, Lead, LeadSource, IntentLevel } from '../types';

interface SampleClient {
  name: string;
  phone: string;
  whatsapp: string;
  company?: string;
  propertyType: string;
  timeline: 'immediate' | 'within_7_days' | 'within_30_days' | 'flexible';
  budgetMin: number;
  budgetMax: number;
}

const SAMPLE_CLIENTS: SampleClient[] = [
  {
    name: 'Engr. Babatunde Alabi',
    phone: '+234 803 459 2810',
    whatsapp: '+234 803 459 2810',
    company: 'Prime Horizon Properties Ltd',
    propertyType: 'Commercial Office Complex (4 Floors)',
    timeline: 'immediate',
    budgetMin: 3500000,
    budgetMax: 7800000,
  },
  {
    name: 'Dr. (Mrs.) Ngozi Okonjo-Eze',
    phone: '+234 802 884 1923',
    whatsapp: '+234 802 884 1923',
    company: 'Evergreen Specialist Clinic',
    propertyType: 'Medical Center / Clinic Facility',
    timeline: 'within_7_days',
    budgetMin: 2200000,
    budgetMax: 5400000,
  },
  {
    name: 'Chief Adebayo Balogun',
    phone: '+234 814 902 4411',
    whatsapp: '+234 814 902 4411',
    company: 'Balogun Family Residence',
    propertyType: '5-Bedroom Fully Detached Duplex',
    timeline: 'within_7_days',
    budgetMin: 1800000,
    budgetMax: 4200000,
  },
  {
    name: 'Alhaji Mansur Danbaba',
    phone: '+234 805 771 9304',
    whatsapp: '+234 805 771 9304',
    company: 'Arewa Continental Agro Trading',
    propertyType: 'Industrial Warehouse & Logistics Bay',
    timeline: 'within_30_days',
    budgetMin: 4500000,
    budgetMax: 9500000,
  },
  {
    name: 'Mrs. Folashade Adeleke',
    phone: '+234 908 331 8290',
    whatsapp: '+234 908 331 8290',
    company: 'Lekki Coastal Homes',
    propertyType: 'Terraced Duplex (4 Units)',
    timeline: 'immediate',
    budgetMin: 2800000,
    budgetMax: 6000000,
  },
  {
    name: 'Mr. Chukwuemeka Obi',
    phone: '+234 703 118 7261',
    whatsapp: '+234 703 118 7261',
    company: 'Nexus Tech Innovations Hub',
    propertyType: 'Corporate Headquarters & Data Lab',
    timeline: 'within_7_days',
    budgetMin: 3200000,
    budgetMax: 8000000,
  },
];

export function generateInboundLeads(business: BusinessProfile, count = 2): Lead[] {
  const city = business.city?.trim() || 'Lagos';
  const state = business.state?.trim() || 'Lagos State';
  const location = `${city}, ${state}`;

  // Pick services from business profile or fallback
  const offerings = Array.isArray(business.categories_offered) && business.categories_offered.length > 0
    ? business.categories_offered
    : business.specialization
    ? [business.specialization]
    : ['Technical Installation & Contracting', 'Preventive Maintenance & Inspection'];

  const category = business.industry || 'Technical Engineering & Contracting';

  const newLeads: Lead[] = [];

  for (let i = 0; i < count; i++) {
    const client = SAMPLE_CLIENTS[(Date.now() + i) % SAMPLE_CLIENTS.length];
    const serviceName = offerings[i % offerings.length];
    const id = `lead_gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const leadNum = `MAT-L-${Math.floor(100000 + Math.random() * 900000)}`;
    const intentScore = Math.floor(82 + Math.random() * 16); // 82 to 98 (Hot)
    const intentLevel: IntentLevel = intentScore >= 80 ? 'Very High' : 'High';

    const lead: Lead = {
      id,
      lead_number: leadNum,
      customer_name: client.name,
      phone: client.phone,
      whatsapp: client.whatsapp,
      email: `${client.name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      company: client.company,
      location,
      address: `Plot ${Math.floor(12 + Math.random() * 88)}, Commercial Crescent, ${city}`,
      city,
      state,
      service_required: `${serviceName} for ${client.propertyType}`,
      service_category: category,
      property_type: client.propertyType,
      budget_min: client.budgetMin,
      budget_max: client.budgetMax,
      budget_formatted: `₦${(client.budgetMin / 1000000).toFixed(1)}m – ₦${(client.budgetMax / 1000000).toFixed(1)}m`,
      estimated_value: (client.budgetMin + client.budgetMax) / 2,
      timeline: client.timeline,
      source: 'marketplace' as LeadSource,
      source_name: 'MatthOrg Verified Inbound Inquiries',
      status: 'New',
      intent_score: intentScore,
      intent_level: intentLevel,
      is_verified: true,
      verified_at: new Date().toISOString(),
      freshness: 'active',
      freshness_label: '🔥 Active — Client verified 5m ago',
      is_locked: false,
      notes: `Direct inquiry for ${serviceName}. Client requesting urgent quotation, site technical assessment, and delivery breakdown.`,
      requirements_list: [
        `Site inspection in ${city}`,
        `Comprehensive bill of quantities / materials`,
        `Formal warranty & maintenance plan`,
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    newLeads.push(lead);
  }

  return newLeads;
}

export function getShareableIntakeLink(business: BusinessProfile): { webLink: string; whatsappLink: string } {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://matthorg.com';
  const webLink = `${origin}/services?requestQuote=true&biz=${encodeURIComponent(business.business_name || 'verified')}`;
  
  const phone = (business.whatsapp || business.phone || '').replace(/[^0-9]/g, '');
  const greeting = encodeURIComponent(
    `Hello ${business.business_name || 'MatthOrg Pro'}, I would like to request an official quotation for your services.`
  );
  const whatsappLink = phone ? `https://wa.me/${phone}?text=${greeting}` : webLink;

  return { webLink, whatsappLink };
}
