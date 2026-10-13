export interface ServiceTaxonomyItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  shortDescription: string;
  fullOverview: string;
  iconName: string;
  subServices: string[];
  keyQuestionsToAsk: string[];
  costFactors: string[];
  comparisonGuide: string[];
  typicalProjectScope: string[];
  seoKeywords: string[];
  featuredImage: string;
}

export interface ServiceCategoryGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  featuredImage: string;
  services: ServiceTaxonomyItem[];
}

export const BASE_SERVICE_TAXONOMY: ServiceTaxonomyItem[] = [
  // 1. Solar & Power
  {
    id: 'solar',
    name: 'Solar Installation & Inverter Systems',
    slug: 'solar',
    category: 'Solar & Power',
    categorySlug: 'solar-power',
    shortDescription: 'Hybrid solar inverter installations, lithium LiFePO4 battery banks, rooftop solar panels, and commercial power backup solutions.',
    fullOverview: 'Comprehensive solar power systems designed to provide 24/7 continuous electricity for homes, estates, commercial offices, and factories. Covers system sizing, monocrystalline panel arrays, hybrid pure-sine inverters, automated changeover switches, and battery energy storage systems.',
    iconName: 'Zap',
    subServices: [
      'Residential Hybrid Solar Systems (3kVA – 15kVA)',
      'Commercial & Industrial Microgrids (20kVA – 250kVA)',
      'Lithium Iron Phosphate (LiFePO4) Battery Upgrades',
      'Solar Water Pumping & Borehole Electrification',
      'Solar Panel Maintenance, Cleaning & Grid Audits',
    ],
    keyQuestionsToAsk: [
      'Are you certified by COREN or NEMSA for commercial electrical & solar installations?',
      'What specific warranty covers the inverter (years), lithium batteries (cycles/years), and Tier-1 solar panels (linear output)?',
      'Does your quotation include a digital surge protective device (SPD), dual DC/AC breakers, and earthing installation?',
      'Can you provide references or recent verifiable installation photos within my state/locality?',
    ],
    costFactors: [
      'Total daily kilowatt-hour (kWh) power consumption and peak surge loads',
      'Battery chemistry choice (Lithium LiFePO4 vs Tubular Gel/Deep Cycle)',
      'Inverter brand rating and pure sine-wave architecture (Hybrid vs Off-grid)',
      'Roof structural integrity, orientation toward true south, and cabling distances',
    ],
    comparisonGuide: [
      'Verify that the installer inspects your DB board to balance phases before connecting high-draw loads.',
      'Check whether the company provides remote monitoring via mobile app or Wi-Fi dongle.',
      'Insist on an itemized contract listing cable gauges (copper vs aluminum) and breaker ratings.',
    ],
    typicalProjectScope: [
      'Site load audit and continuous data logging',
      'Rigid aluminum rail mounting and roof waterproofing seals',
      'DC combiner box with surge protection and lightning arrestor ground line',
      'Inverter commissioning and homeowner handover training',
    ],
    seoKeywords: ['solar installation', 'solar panels price nigeria', 'inverter installation', 'lithium battery for inverter', 'solar company'],
    featuredImage: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=1200&q=80',
  },

  // 2. Electrical
  {
    id: 'electrical',
    name: 'Electrical Engineering & Conduit Wiring',
    slug: 'electrical',
    category: 'Electrical',
    categorySlug: 'electrical',
    shortDescription: 'Certified electrical wiring, distribution panels, surge suppression, lighting automation, and industrial electrical installations.',
    fullOverview: 'Professional residential and commercial electrical contracting. Includes surface and conduit piping, multi-phase distribution board installation, earthing pit construction with copper rods, and surge protection against grid voltage spikes.',
    iconName: 'Bolt',
    subServices: [
      'Full Conduit & Piping Electrical Installations for New Builds',
      'Distribution Board (DB) Upgrades & 3-Phase Balancing',
      'Industrial Motor Starters & Automatic Changeover Switches (ATS)',
      'Lightning Protection Systems & Earth Resistance Testing',
      'Smart Lighting, Dimmers & Architectural Illumination',
    ],
    keyQuestionsToAsk: [
      'Do you use pure 100% copper cables manufactured to NIS/SON standards?',
      'What is the measured Earth Loop Impedance or resistance of the grounding pit you will install?',
      'Will you provide a circuit directory diagram in the main distribution board upon completion?',
    ],
    costFactors: [
      'Number of rooms/points (lighting points, 13A socket outlets, 15A AC points)',
      'Phase requirements (Single phase 230V vs 3-phase 415V supply)',
      'Quality of switchgear, MCBs, RCDs, and distribution boards',
      'Concealed channelling work required in finished masonry',
    ],
    comparisonGuide: [
      'Ensure the contractor includes Residual Current Devices (RCD/GFCI) for electric shock prevention.',
      'Beware of quotations that under-gauge AC cables (always require 4mm² minimum for split ACs).',
    ],
    typicalProjectScope: [
      'Wall chasing and conduit pipe layout before plastering',
      'Cable pulling and phase separation',
      'Fixing of designer switches, sockets, and chandeliers',
      'Earth pit chemical treatment and insulation resistance testing',
    ],
    seoKeywords: ['electrician in nigeria', 'electrical wiring cost', 'licensed electrical contractor', 'changeover switch installation'],
    featuredImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
  },

  // 3. Plumbing
  {
    id: 'plumbing',
    name: 'Plumbing, Water Treatment & Boreholes',
    slug: 'plumbing',
    category: 'Plumbing',
    categorySlug: 'plumbing',
    shortDescription: 'PPR pipe installation, deep borehole drilling, automated pressure pumps, water purification systems, and bathroom sanitary fixtures.',
    fullOverview: 'Comprehensive plumbing engineering services covering sanitary drainage, water supply reticulation using heat-fusion PPR pipes, deep water borehole geophysical surveys, submersible pump installations, and automated reverse osmosis water filtration plants.',
    iconName: 'Wrench',
    subServices: [
      'Deep Geological Borehole Drilling & Casing Installation',
      'High-Pressure PPR Sanitary Water Reticulation',
      'Multi-Stage Water Treatment & Iron Removal Filtration',
      'Automated Inverter Water Pressure Boosters & Overhead Tanks',
      'Bathroom Suite Sanitary Ware, Jacuzzi & Water Heater Fitting',
    ],
    keyQuestionsToAsk: [
      'Do you conduct a geophysical survey before drilling to determine aquifer depth and water yield?',
      'Are you utilizing PN20/PN25 PPR pipes with fusion welding or standard PVC?',
      'What depth and gauge of PVC casing will be installed in the borehole well?',
    ],
    costFactors: [
      'Depth of borehole well needed according to regional water table and geology',
      'Quality of water pump (Pedrollo, Grundfos, or equivalent continuous-duty motor)',
      'Water chemical analysis requirements (iron removal, aeration, carbon filters, UV sterilizer)',
      'Number of bathrooms and sanitary ware fixtures',
    ],
    comparisonGuide: [
      'Avoid galvanized iron pipes which corrode; insist on certified polypropylene random copolymer (PPR).',
      'Confirm whether the borehole quote includes a gravel packing filter around the well screen.',
    ],
    typicalProjectScope: [
      'Geophysical resistivity survey and site mapping',
      'Well rotary or percussion drilling and casing',
      'Overhead tank stand fabrication and piping connection',
      'Pressure testing lines under 10 bar before wall tiling',
    ],
    seoKeywords: ['plumber near me', 'borehole drilling cost nigeria', 'water treatment plant for home', 'bathroom plumbing fittings'],
    featuredImage: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80',
  },

  // 4. Security & CCTV
  {
    id: 'cctv',
    name: 'CCTV & Security Systems',
    slug: 'cctv',
    category: 'Security',
    categorySlug: 'security',
    shortDescription: 'High-definition IP surveillance cameras, remote mobile viewing, biometric access control, smart door locks, and electric fences.',
    fullOverview: 'End-to-end security installations protecting homes, estates, retail plazas, and commercial premises. Includes 4K color night-vision IP cameras, Network Video Recorders (NVR) with high endurance hard drives, perimeter electric fencing, and smart app integration.',
    iconName: 'Shield',
    subServices: [
      'IP Camera Surveillance Grids with Color Night Vision & AI Human Detection',
      'Biometric Fingerprint & RFID Card Access Control Systems',
      'Smart Digital Door Locks with Keypad & App Access',
      'Perimeter Electric Security Fences & Razor Wire Barricades',
      'Intruder Alarm Systems & Automated Sliding Gate Motors',
    ],
    keyQuestionsToAsk: [
      'Are the cameras IP-based with Power over Ethernet (PoE) or older analog coaxial cables?',
      'What brand of NVR and surveillance-rated hard drives (e.g., Western Digital Purple / Seagate SkyHawk) are included?',
      'Does the electric fence setup comply with safety grounding and warning sign regulations?',
    ],
    costFactors: [
      'Number of camera channels (4-channel, 8-channel, 16-channel or 32-channel system)',
      'Storage capacity (number of days/weeks of recorded footage needed)',
      'Outdoor weather rating (IP66/IP67 waterproof housings)',
      'Perimeter perimeter length in linear meters for electric fencing and bracket design',
    ],
    comparisonGuide: [
      'Ensure the surveillance system has uninterruptible power supply (UPS) or solar backup so cameras do not shut down during blackouts.',
      'Check whether the cameras support smart analytics such as tripwire perimeter alerts on smartphones.',
    ],
    typicalProjectScope: [
      'Security site vulnerability survey and camera view angle mapping',
      'Cat6 outdoor Ethernet trunking and conduit installation',
      'NVR installation, remote cloud mobile port forwarding, and camera angle calibration',
      'Client orientation on live monitoring, video export, and access control enrollment',
    ],
    seoKeywords: ['cctv installation nigeria', 'cctv camera price', 'electric fence installer', 'smart lock for house', 'security system company'],
    featuredImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1200&q=80',
  },

  // 5. Cleaning
  {
    id: 'cleaning',
    name: 'Deep Cleaning & Facility Hygiene',
    slug: 'cleaning',
    category: 'Cleaning',
    categorySlug: 'cleaning',
    shortDescription: 'Post-construction cleaning, residential deep scrubbing, corporate janitorial management, fumigation, and upholstery sanitation.',
    fullOverview: 'Thorough, commercial-grade deep cleaning solutions for new buildings, residential moves, corporate offices, and hospitality venues. Utilizes industrial floor polishers, HEPA vacuum cleaners, safe non-toxic degreasers, and antimicrobial sanitizing agents.',
    iconName: 'Sparkles',
    subServices: [
      'Post-Construction & Post-Renovation Heavy Scrubbing',
      'Move-In / Move-Out Deep House Sanitation',
      'Sofa, Mattress & Carpet Steam Extraction Cleaning',
      'Commercial Janitorial & Facility Maintenance Contracts',
      'Pest Control, Termite Treatment & Fumigation',
    ],
    keyQuestionsToAsk: [
      'Are all chemicals used safe for children, pets, and sensitive surfaces like granite and vitrified tiles?',
      'Do you bring industrial scrubbing machines, steam extractors, and industrial ladders?',
      'What is your policy if areas are found unsatisfactory upon final walkthrough inspection?',
    ],
    costFactors: [
      'Property size in square meters or number of bedrooms, bathrooms, and living areas',
      'Condition of the property (heavy paint/cement post-construction vs routine maintenance)',
      'Presence of high glass panels, external facade washing, or chandelier detailing',
    ],
    comparisonGuide: [
      'Verify that the company brings professional grade machines rather than just mops and brooms.',
      'Confirm whether fume masks and safety gear are provided for chemical fumigation applications.',
    ],
    typicalProjectScope: [
      'Initial walkthrough and surface material assessment',
      'Paint splatters, cement residue, and silicone removal from tiles and windows',
      'Machine scrubbing and polishing of tiled and marble floors',
      'Sanitization of kitchen cabinetry, sanitary wares, and light fixtures',
    ],
    seoKeywords: ['cleaning services in nigeria', 'post construction cleaning cost', 'fumigation company near me', 'sofa cleaning service'],
    featuredImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
  },

  // 6. Construction
  {
    id: 'construction',
    name: 'Building Construction & Civil Contracting',
    slug: 'construction',
    category: 'Construction',
    categorySlug: 'construction',
    shortDescription: 'General building contractors, residential duplexes, warehouse construction, structural renovations, tiling, and roofing.',
    fullOverview: 'Turnkey architectural and civil construction management. From site mobilization, soil testing, raft foundation casting, column reinforcement, block laying, to modern interior finishing, POP ceiling, and stone-coated roofing.',
    iconName: 'Building',
    subServices: [
      'Full Turnkey Residential Duplex & Bungalow Construction',
      'Structural Renovation, Wall Knockouts & Building Expansions',
      'Concrete Flooring, Interlocking Pavers & Civil Drainage',
      'Aluminium, Stone-Coated & Shingle Roofing Systems',
      'POP False Ceilings, Drywall Partitioning & Architectural Tiling',
    ],
    keyQuestionsToAsk: [
      'Do you work with registered structural engineers to calculate reinforcement bar sizes and concrete mix ratios?',
      'Can you provide a formal Bill of Quantities (BOQ) with materials and labor separated?',
      'What is your stage-by-stage milestone inspection schedule?',
    ],
    costFactors: [
      'Soil condition and foundation type (strip vs raft vs pile foundation in swampy areas)',
      'Quality of finishing materials (Italian vs local tiles, security doors, sanitary ware)',
      'Fluctuations in steel rebar and cement market prices',
    ],
    comparisonGuide: [
      'Always insist on stage milestone payments tied directly to verified physical completions.',
      'Check whether the contractor has experience dealing with local town planning approval authorities.',
    ],
    typicalProjectScope: [
      'Architectural planning, structural calculation, and planning approvals',
      'Excavation, iron bending, and foundation concrete casting',
      'Superstructure block work, lintels, and decking slab casting',
      'Roofing, plastering, plumbing/electrical conduits, and final paint/tiling finishes',
    ],
    seoKeywords: ['building contractor nigeria', 'cost of building a duplex', 'civil engineering company', 'renovation contractor'],
    featuredImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
  },

  // 7. HVAC & Cooling
  {
    id: 'air-conditioning',
    name: 'Air Conditioning & HVAC Engineering',
    slug: 'air-conditioning',
    category: 'HVAC & Cooling',
    categorySlug: 'hvac-cooling',
    shortDescription: 'Inverter split AC installation, central ducted HVAC, cold room refrigeration, AC gas recharging, and preventive maintenance.',
    fullOverview: 'Professional climate control engineering for tropical climates. Covers multi-split inverter air conditioners, commercial VRF/VRV central chillers, cold room construction for produce and pharmaceuticals, leak diagnostics, and precision coil chemical washes.',
    iconName: 'Wind',
    subServices: [
      'Dual Inverter Split Unit AC Installation & Copper Pipe Runs',
      'Commercial VRF / Ducted Central Cooling Systems',
      'Cold Room Fabrication & Industrial Compressor Servicing',
      'Chemical Coil Washes & Precision R410A / R32 Gas Top-ups',
      'HVAC Ductwork Fabrication & Exhaust Ventilation Systems',
    ],
    keyQuestionsToAsk: [
      'Do you use vacuum pumps to evacuate air and moisture from copper lines before opening refrigerant valves?',
      'What copper pipe gauge do you use, and do you insulate both liquid and suction lines individually?',
      'Do you test for refrigerant leaks with pressure nitrogen or electronic sniffer tools?',
    ],
    costFactors: [
      'Cooling capacity needed (1.0HP, 1.5HP, 2.0HP, 2.5HP, 5.0HP standing units)',
      'Length of copper piping run between indoor fan and outdoor condensing unit',
      'Energy efficiency tier (inverter technology vs non-inverter)',
      'High-rise outdoor bracket mounting accessibility',
    ],
    comparisonGuide: [
      'Avoid technicians who skip line vacuuming—moisture in modern inverter systems acidifies oil and burns out compressors.',
      'Check that exterior brackets are galvanized to withstand weather without rusting down building walls.',
    ],
    typicalProjectScope: [
      'Room heat load calculation and unit placement survey',
      'Core hole drilling and copper line trunking',
      'Nitrogen pressure hold test and vacuum pump evacuation',
      'Current draw and temperature differential verification at the airflow vent',
    ],
    seoKeywords: ['ac repair near me', 'inverter ac installation', 'air conditioner servicing lagos', 'cold room construction nigeria'],
    featuredImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
  },

  // 8. Technology & IT
  {
    id: 'it-networking',
    name: 'IT Services, Networking & Starlink Setup',
    slug: 'it-networking',
    category: 'Technology & IT',
    categorySlug: 'technology-it',
    shortDescription: 'Office fiber networking, enterprise Wi-Fi 6 access points, Starlink satellite installation, server setups, and custom website development.',
    fullOverview: 'Complete technology and connectivity services designed for modern enterprises, co-working spaces, schools, and residences. Covers structured Cat6/Cat6A cabling, rack patch panels, managed switches, enterprise firewall routers, satellite dishes, and software solutions.',
    iconName: 'Monitor',
    subServices: [
      'Enterprise Structured Cabling & Server Rack Installation',
      'High-Speed Wi-Fi 6 Access Points & Seamless Roaming Mesh',
      'Starlink Satellite Internet Mounting, Cabling & Network Integration',
      'Firewall Security, VPNs & Bandwidth Traffic Management',
      'Custom Web Application & Mobile App Development',
    ],
    keyQuestionsToAsk: [
      'Do you certify all Ethernet cable runs with cable testers and label both patch panel ports and wall jacks?',
      'What mesh access point hardware (e.g., UniFi, Aruba, MikroTik) do you recommend for our premises?',
      'Can you set up separate secure VLANs for guest Wi-Fi, staff, and IoT security devices?',
    ],
    costFactors: [
      'Number of network drops/points across the facility',
      'Hardware specification (Unmanaged switches vs Enterprise Layer 3 Managed PoE+ switches)',
      'Building construction material (reinforced concrete walls require more AP density)',
    ],
    comparisonGuide: [
      'Ensure the contractor includes a central UPS inside the network rack to prevent switch resets during power changeovers.',
      'Look for tidy rack patch cable management with cable organizers rather than loose messy cables.',
    ],
    typicalProjectScope: [
      'Wireless RF survey and cable trunking route design',
      'Cable pulling, termination, and patch panel punch down',
      'Router configuration, SSID broadcasting, and bandwidth limits per user',
      'Network speed benchmarks and administrator documentation handover',
    ],
    seoKeywords: ['network installation company', 'starlink installation service nigeria', 'office wifi setup', 'it support company lagos'],
    featuredImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  },

  // 9. Painting & Screeding
  {
    id: 'painting',
    name: 'House Painting, Wall Screeding & Finishing',
    slug: 'painting',
    category: 'Painting & Screeding',
    categorySlug: 'painting-screeding',
    shortDescription: 'Ultra-smooth acrylic wall screeding, exterior weather-guard coatings, decorative stucco, epoxy floors, and wallpaper installation.',
    fullOverview: 'Professional surface preparation and high-end coating contractors. Transforming rough masonry into mirror-flat walls with premium screeding paste, primer sealers, scrubbable silk emulsions, exterior elastomeric waterproofing paint, and textured stucco coatings.',
    iconName: 'Paintbrush',
    subServices: [
      'Interior 3-Coat Acrylic Wall Screeding & Sanding',
      'Exterior Weather-Resistant & Anti-Fungal Textcoat Painting',
      'High-Gloss Italian Stucco & Marble Effect Wall Finishes',
      'Seamless Industrial Epoxy Floor Coatings for Garages & Plazas',
      'Custom Vinyl Wallpaper Sizing & Precision Hanging',
    ],
    keyQuestionsToAsk: [
      'Do you use acrylic bonding agent screed mixes or cheap chalk powder?',
      'Do you apply an alkaline-resistant primer before final coats of paint?',
      'What brand of paint will be used (e.g. Dulux, Meyer, Berger, Portland)?',
    ],
    costFactors: [
      'Total surface area in square meters and ceiling heights',
      'Existing wall condition (plaster roughness, moisture dampness, peeling old paint)',
      'Type of finish chosen (Matte, Satin/Silk, Texture, Stucco marble finish)',
    ],
    comparisonGuide: [
      'Ensure the contractor treats damp spots with damp-proof sealant before screeding.',
      'Check that floors, doors, and aluminium frames are masked with drop sheets and masking tape.',
    ],
    typicalProjectScope: [
      'Surface cleaning, scraping, and crack channelling',
      'Basecoat bonding screed application followed by top screed and fine machine sanding',
      'Alkali-resisting primer coat',
      'Two coats of premium emulsion with cut-ins and clean corners',
    ],
    seoKeywords: ['house painter near me', 'wall screeding price per square meter', 'epoxy floor installers', 'dulux paint contractor'],
    featuredImage: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80',
  },

  // 10. Carpentry & Woodwork
  {
    id: 'carpentry',
    name: 'Custom Carpentry, Kitchen Cabinets & Woodwork',
    slug: 'carpentry',
    category: 'Carpentry & Woodwork',
    categorySlug: 'carpentry-woodwork',
    shortDescription: 'High-gloss acrylic kitchen cabinets, walk-in closets, bespoke wood doors, dining furniture, and acoustic wood slat wall panels.',
    fullOverview: 'Precision joinery and architectural woodwork. Utilizing moisture-resistant MDF (HDF), marine plywood, solid hardwoods (Teak, Mahogany, Iroko), Blum soft-close hinges, quartz and granite countertops, and modern LED recessed lighting.',
    iconName: 'Hammer',
    subServices: [
      'Modern High-Gloss & Matte Acrylic Kitchen Cabinetry',
      'Walk-In Master Wardrobes & Dressing Room Fit-Outs',
      'Solid Hardwood Security Doors & Architraves',
      'Acoustic Wood Slat Wall Panelling & Media Consoles',
      'Office Reception Desks & Boardroom Conference Tables',
    ],
    keyQuestionsToAsk: [
      'Do you use moisture-resistant HDF/marine board for wet kitchen sink areas?',
      'Are the drawer runners and cabinet hinges soft-close and rust-proof?',
      'Will you provide 3D CAD visualization drawings before factory fabrication?',
    ],
    costFactors: [
      'Material choice (Laminated MDF vs Moisture-Resistant HDF vs Solid Hardwood)',
      'Hardware specification (Standard friction slides vs DTC/Blum soft-closing)',
      'Countertop surface material (Corian, Natural Granite, or Quartz composite)',
    ],
    comparisonGuide: [
      'Verify that all board edges are sealed with machine PVC edge-banding to prevent water swelling.',
      'Ask to inspect previously completed installations or factory samples.',
    ],
    typicalProjectScope: [
      'Laser site measurement and utility pipe coordinate mapping',
      '3D photo-realistic CAD design approval',
      'Off-site CNC board cutting and edge banding',
      'On-site installation, levelling, plumbing sink cutout, and appliance integration',
    ],
    seoKeywords: ['kitchen cabinet makers lagos', 'wardrobe carpentry abuja', 'custom wood furniture', 'acoustic wood slats'],
    featuredImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
  },

  // 11. Aluminium & Glazing
  {
    id: 'aluminium-glazing',
    name: 'Aluminium Windows, Doors & Glass Partitions',
    slug: 'aluminium-glazing',
    category: 'Aluminium & Glazing',
    categorySlug: 'aluminium-glazing',
    shortDescription: 'Thermal-break casement windows, frameless glass shower cubicles, office glass partitions, sliding patio doors, and curtain walls.',
    fullOverview: 'Fabrication and installation of architectural aluminium systems and tempered safety glass. Specializing in soundproof double-glazed casement windows, structural facade curtain walls, folding bi-fold glass doors, and heavy stainless steel balustrades.',
    iconName: 'Layers',
    subServices: [
      'High-Performance Soundproof Aluminium Casement Windows',
      'Frameless Tempered Glass Office Partitions & Doors',
      'Luxury Sliding Patio Doors & Bi-Fold Glass Systems',
      'Tempered Glass Shower Cubicles with Stainless Steel Hinges',
      'Commercial Building Facade Curtain Wall Systems',
    ],
    keyQuestionsToAsk: [
      'What profile gauge and aluminium thickness (e.g. 1.5mm vs 2.0mm) do you use?',
      'Is the glass toughened/tempered safety glass with certified edge stamps?',
      'What brand of weather-stripping EPDM rubber seals and multipoint locks are used?',
    ],
    costFactors: [
      'Glass type (Clear float, tinted reflective, frosted, or double-glazed argon-filled)',
      'Profile coating finish (Powder coated black/white, woodgrain transfer, or anodized bronze)',
      'Hardware mechanisms (Heavy duty rollers, multipoint handles, European locks)',
    ],
    comparisonGuide: [
      'Avoid light 0.8mm aluminium profiles that rattle in heavy tropical winds.',
      'Insist on structural neutral-cure silicone sealant rather than acidic bathroom caulk on exterior windows.',
    ],
    typicalProjectScope: [
      'Structural masonry opening measurements and squareness check',
      'Factory miter cutting, corner cleat crimping, and rubber gasket insertion',
      'Expansion bolt fixing into lintels and jambs',
      'Glass installation, glazing bead snapping, and exterior waterproof silicone sealing',
    ],
    seoKeywords: ['aluminium windows price', 'frameless glass partition lagos', 'casement windows abuja', 'shower cubicle glass'],
    featuredImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  },

  // 12. Ceilings & Drywall
  {
    id: 'pop-ceilings',
    name: 'POP Ceilings, Drywall & Architectural Cornices',
    slug: 'pop-ceilings',
    category: 'Ceilings & Drywall',
    categorySlug: 'ceilings-drywall',
    shortDescription: 'Modern Plaster of Paris (POP) false ceilings, recessed cove LED trough designs, drywall acoustic room dividers, and decorative cornices.',
    fullOverview: 'Creative suspended ceiling and interior partitioning craftsmanship. Creating architectural drop ceilings with hidden ambient strip lighting, geometric tray profiles, acoustic drywall dividing walls, and water-resistant gypsum board for bathrooms and kitchens.',
    iconName: 'Building',
    subServices: [
      'Modern Flat & Multi-Level Drop POP Ceilings',
      'Ambient LED Strip Light Hidden Cove Troughs',
      'Gypsum Drywall Acoustic Room Partitioning',
      'Moisture-Resistant Suspended Ceilings for Bathrooms & Kitchens',
      'Ornate Fiber-Reinforced Decorative Cornices & Centerpieces',
    ],
    keyQuestionsToAsk: [
      'Do you use galvanized metal channels/studs for framing or wooden battens that attract termites?',
      'What ratio of POP plaster to fiberglass hemp is used for reinforcement?',
      'Do you coordinate with electricians to run conduit wiring before ceiling closure?',
    ],
    costFactors: [
      'Ceiling design complexity (Simple flat ceiling vs intricate tiered curves and coves)',
      'Height of the building requiring high scaffolding',
      'Inclusion of recessed spotlight holes and access maintenance traps',
    ],
    comparisonGuide: [
      'Ensure suspension wires are secured with concrete expansion anchors rather than steel nails.',
      'Check that joints are taped with mesh tape and plastered smooth to prevent hairline cracks.',
    ],
    typicalProjectScope: [
      'Laser level perimeter height marking',
      'Suspension anchor installation and galvanized grid framework',
      'POP board casting or gypsum board screwing',
      'Joint taping, skim coat plastering, and spotlight hole cutting',
    ],
    seoKeywords: ['pop ceiling designs nigeria', 'pop contractor in lagos', 'drywall partition price', 'gypsum ceiling installer'],
    featuredImage: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
  },

  // 13. Power & Generators
  {
    id: 'diesel-generators',
    name: 'Diesel Generator Overhauls, Servicing & ATS Panels',
    slug: 'diesel-generators',
    category: 'Power & Generators',
    categorySlug: 'power-generators',
    shortDescription: 'Industrial diesel generator preventative maintenance, engine top/major overhauls, automatic transfer switches, and soundproof canopies.',
    fullOverview: 'Heavy-duty power generation engineering for commercial estates, banks, telecommunications masts, factories, and residential buildings. Specializing in Perkins, Cummins, Caterpillar, Lister Petter, and FG Wilson generators from 15kVA to 2000kVA.',
    iconName: 'Cpu',
    subServices: [
      'Scheduled Monthly Preventative Maintenance Contracts',
      'Complete Engine Top & Major Overhauls (Pistons, Rings, Bearings)',
      'Automatic Transfer Switch (ATS) Fabrication & Relay Calibration',
      'Turbocharger, Fuel Injection Pump & Injector Nozzle Servicing',
      'Soundproof Enclosure Sound Attenuation & Vibration Dampening',
    ],
    keyQuestionsToAsk: [
      'Do you supply 100% genuine OEM replacement filters, belts, and engine oil?',
      'Do you conduct electrical load bank testing to certify output under 80%-100% load?',
      'What emergency response turnaround time is guaranteed in your maintenance contract?',
    ],
    costFactors: [
      'Generator capacity rating (e.g. 20kVA, 60kVA, 150kVA, 500kVA+)',
      'Scope of service (Routine oil/filter service vs full engine overhaul)',
      'Brand and model parts availability in country',
    ],
    comparisonGuide: [
      'Beware of technicians using recycled or substandard mineral oil instead of certified 15W-40 CI-4 diesel oil.',
      'Verify that the automatic changeover panel includes phase failure and under/over voltage protection relays.',
    ],
    typicalProjectScope: [
      'Fluid analysis and electrical diagnostic scan',
      'Filter replacements (oil, primary fuel, water separator, air cleaner)',
      'Valve clearance adjustment and belt tensioning',
      'Battery conductance test, alternator charging verification, and load run-up',
    ],
    seoKeywords: ['diesel generator servicing lagos', 'perkins generator overhaul', 'ats changeover switch nigeria', 'generator technician near me'],
    featuredImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
  },

  // 14. Flooring & Paving
  {
    id: 'tiling-paving',
    name: 'Floor Tiling, Granite/Marble & Interlocking Paving',
    slug: 'tiling-paving',
    category: 'Flooring & Paving',
    categorySlug: 'flooring-paving',
    shortDescription: 'Precision porcelain and vitrified floor tiling, natural Italian marble screeding, bathroom mosaics, and exterior interlocking stones.',
    fullOverview: 'Master masonry and floor finishing contractors. Specializing in zero-lippage vitrified tiles, large-format 1200x600 porcelain slabs, bookmatched marble for luxury staircases, and heavy-duty 60mm/80mm interlocking stones for estate driveways and parking lots.',
    iconName: 'Compass',
    subServices: [
      'Large Format Vitrified & Porcelain Floor Tiling (Zero Lippage)',
      'Natural Granite & Italian Carrara Marble Fabrication',
      'Full Bathroom Floor & Wall Tiling with Mitered 45° Corner Joints',
      'Heavy-Duty Interlocking Stone Paving for Driveways & Compounds',
      'Self-Levelling Compound Floor Screeding & Crack Repair',
    ],
    keyQuestionsToAsk: [
      'Do you use tile levelling clips and wedges to eliminate lippage on large tiles?',
      'What brand of high-polymer flexible tile adhesive do you use?',
      'How do you grade the sub-base and sand bed before laying interlocking stones to prevent sinking?',
    ],
    costFactors: [
      'Tile format size (larger slabs require dual adhesive buttering and multiple installers)',
      'Floor substrate flatness requiring self-levelling underlayment',
      'Tile pattern (straight, diagonal, herringbone, or staggered bond)',
    ],
    comparisonGuide: [
      'Never allow installers to use pure cement on vitrified tiles; polymer tile adhesive is mandatory for bonding.',
      'Check that perimeter movement expansion joints are left near walls to prevent tile buckling in hot weather.',
    ],
    typicalProjectScope: [
      'Sub-floor screed inspection and moisture testing',
      'Dry layout planning to minimize awkward sliver cuts at entryways',
      'Notched trowel adhesive spreading and vibration compaction',
      'Grouting with mildew-resistant waterproof grout and expansion joint filling',
    ],
    seoKeywords: ['tiler near me', 'cost of interlocking stones per square meter', 'granite floor installation', 'vitrified tiles installer'],
    featuredImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
  },

  // 15. Roofing & Structural
  {
    id: 'roofing-trusses',
    name: 'Stone-Coated Roofing, Aluminium Trusses & Guttering',
    slug: 'roofing-trusses',
    category: 'Roofing & Structural',
    categorySlug: 'roofing-structural',
    shortDescription: 'Gerard stone-coated roofing tiles, 0.55mm aluminium step-tiles, light-gauge steel trusses, leak repairs, and concealed rain gutters.',
    fullOverview: 'Complete roofing engineering and waterproofing protection. Fabricating engineered steel or treated hardwood trusses, installing authentic stone-coated shingles, Roman and Milano profiles, seamless aluminium box gutters, and roof insulation blankets.',
    iconName: 'Building',
    subServices: [
      'Original Stone-Coated Metal Tile Roofing (Bond, Classic, Shingle)',
      'Long-Span Aluminium & Metcoppo Step-Tile Roofing (0.50mm - 0.70mm)',
      'Light-Gauge Steel Truss Fabrication & Engineered Erection',
      'Seamless Rainwater Box Guttering & Downspout Systems',
      'Emergency Roof Leak Diagnostics, Valley Flashing & Waterproofing',
    ],
    keyQuestionsToAsk: [
      'Are the stone-coated tiles genuine with 50-year manufacturer warranty certificates?',
      'What gauge of aluminium or zinc-alum steel are you quoting?',
      'Do you install breathable waterproof felt underlayment beneath all roofing sheets?',
    ],
    costFactors: [
      'Roof pitch steepness and total surface area',
      'Truss material (Treated hardwood timber vs Galvanized light-gauge steel)',
      'Number of roof valleys, hips, ridges, and complex architectural dormers',
    ],
    comparisonGuide: [
      'Beware of cheap imitation stone-coated tiles where stone granules wash off after one rainy season.',
      'Check that valley gutters are constructed with wide 0.7mm aluminium to prevent overflow into the ceiling.',
    ],
    typicalProjectScope: [
      'Structural truss alignment and wall plate anchoring',
      'Batten spacing calibration according to tile manufacturer specs',
      'Underlayment membrane unrolling and stapling',
      'Tile nailing with galvanized ring-shank nails and ridge cap sealing',
    ],
    seoKeywords: ['stone coated roofing tiles price nigeria', 'aluminium roofing contractor', 'roof leak repair near me', 'gerard roof distributor'],
    featuredImage: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
  },

  // 16. Architecture & Design
  {
    id: 'architectural-plans',
    name: 'Architectural 3D Drawings, Structural Plans & BOQ',
    slug: 'architectural-plans',
    category: 'Architecture & Design',
    categorySlug: 'architecture-design',
    shortDescription: 'Modern residential duplex designs, structural engineering calculations, 3D photorealistic renderings, BOQ, and building approval drawings.',
    fullOverview: 'Comprehensive architectural and engineering consultancy. Designing contemporary residential villas, commercial plazas, hotels, and industrial warehouses with complete architectural blueprints, COREN-stamped structural calculations, MEP drawings, and detailed Bills of Quantities.',
    iconName: 'Compass',
    subServices: [
      'Custom Architectural Concepts & Working Blueprint Drawings',
      'Photorealistic 3D Exterior & Interior Architectural Renderings',
      'Structural Engineering Calculations & Foundation Design Plans',
      'Mechanical, Electrical & Plumbing (MEP) Engineering Layouts',
      'Detailed Bill of Quantities (BOQ) & Material Estimates',
    ],
    keyQuestionsToAsk: [
      'Are your drawings fully compliant with state Town Planning approval requirements?',
      'Will you provide stamped drawings by ARCON and COREN registered professionals?',
      'How many revision iterations are included in your architectural agreement?',
    ],
    costFactors: [
      'Building size, number of floors, and complexity of architectural geometry',
      'Inclusion of engineering stamps (Structural, Electrical, Mechanical)',
      'Physical site inspection and soil geotechnical testing requirements',
    ],
    comparisonGuide: [
      'Never build multi-story structures without certified structural calculation sheets for columns and beams.',
      'An accurate BOQ prevents contractor fraud and project abandonment by detailing exact material requirements.',
    ],
    typicalProjectScope: [
      'Client brief, site survey, and orientation analysis',
      'Conceptual floor plans and 3D volume massing',
      'Detailed architectural working drawings and door/window schedules',
      'Structural load analysis and town planning submission package delivery',
    ],
    seoKeywords: ['architectural drawings price nigeria', 'duplex house plans with 3d rendering', 'structural engineer for building', 'boq quantity surveyor'],
    featuredImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
  },

  // 17. Boreholes & Water
  {
    id: 'borehole-drilling',
    name: 'Deep Borehole Drilling & Geophysical Surveys',
    slug: 'borehole-drilling',
    category: 'Boreholes & Water',
    categorySlug: 'boreholes-water',
    shortDescription: 'Geophysical resistivity surveys, deep rotary borehole drilling, PVC casing, submersible pumps, and industrial water treatment.',
    fullOverview: 'Professional groundwater extraction and water independence. Using modern truck-mounted hydraulic rotary drill rigs, geophysical aquifer surveys, thick-walled certified PVC casings, gravel packing, and continuous duty Italian pumps to guarantee clean potable water.',
    iconName: 'Droplets',
    subServices: [
      'Geophysical Schlumberger Resistivity Aquifer Mapping',
      'Deep Sedimentary & Hard-Rock Hydraulic Borehole Drilling',
      'Heavy-Duty PVC Well Casing, Slotted Screens & Gravel Packing',
      'Submersible Pump Sizing, Drop Cable & Automated Control Box',
      'Industrial Aeration, Iron Removal & Sand Filter Treatment Plants',
    ],
    keyQuestionsToAsk: [
      'Do you perform geophysical electrical resistivity testing prior to drilling?',
      'What depth guarantee and water yield testing are specified in your contract?',
      'What brand of submersible pump (e.g. Pedrollo, Grundfos, Leo) is installed?',
    ],
    costFactors: [
      'Geological formation (Sedimentary coastal basin vs crystalline basement hard granite)',
      'Required well depth (40 meters up to 200+ meters for pure aquifers)',
      'Submersible motor horse power (1.0HP up to 10HP+ for commercial farms/estates)',
    ],
    comparisonGuide: [
      'Beware of drillers who stop at shallow contaminated surface water to save diesel; insist on proper aquifer depth.',
      'Confirm that the well is thoroughly flushed and developed with air compressors before pump insertion.',
    ],
    typicalProjectScope: [
      'Site hydro-geological survey and drill point pinpointing',
      'Rig mobilization, rotary drilling, and sample logging',
      'Casing installation and high-grade silica gravel packing',
      'Well development, pumping test, and automated control box wiring',
    ],
    seoKeywords: ['borehole drilling company lagos', 'borehole drilling cost abuja', 'submersible pump installation', 'water treatment plant for borehole'],
    featuredImage: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&w=1200&q=80',
  },

  // 18. Automotive Care
  {
    id: 'auto-diagnostics',
    name: 'Computerized Auto Diagnostics, Car AC & Fleet Maintenance',
    slug: 'auto-diagnostics',
    category: 'Automotive Care',
    categorySlug: 'automotive-care',
    shortDescription: 'OBD-II live computerized scanning, car air conditioning compressor repair, automatic transmission flushing, and fleet maintenance.',
    fullOverview: 'Certified automotive technical care for Japanese, American, and European vehicles. Utilizing OEM diagnostic scan tools, automated refrigerant recovery and recharge stations, transmission fluid exchange machines, and suspension rebuild specialists.',
    iconName: 'Car',
    subServices: [
      'Full Vehicle Computer Diagnostics (Check Engine, ABS, Airbag, ECM)',
      'Car Air Conditioning Diagnostics, Compressor Overhaul & R134a Gas',
      'Automatic & CVT Transmission Diagnostics & Fluid Flushes',
      'Suspension Rebuilding, Shock Absorbers & Wheel Alignment',
      'Corporate Fleet Scheduled Servicing & Preventative Upkeep',
    ],
    keyQuestionsToAsk: [
      'Do you use bidirectional OEM scan tools or cheap hand scanners?',
      'Do you vacuum the car AC system and check for leaks before injecting refrigerant?',
      'Do you provide an itemized diagnostic report before proceeding with repairs?',
    ],
    costFactors: [
      'Vehicle make, model, and year (European luxury vehicles require specialized tools)',
      'Complexity of electronic wiring harness faults vs mechanical bolt-on replacements',
      'Parts sourcing (OEM genuine vs high-grade aftermarket)',
    ],
    comparisonGuide: [
      'Never allow technicians to clear diagnostic codes without recording the freeze frame data first.',
      'Ensure proper PAG oil viscosity is added during AC compressor replacements to avoid immediate lockup.',
    ],
    typicalProjectScope: [
      'Electronic diagnostic scan and trouble code analysis',
      'Visual inspection and physical component testing',
      'Component repair or precision replacement',
      'Road testing, system adaptation, and final scan clear',
    ],
    seoKeywords: ['car mechanic near me', 'car ac repair lagos', 'auto diagnostics service', 'fleet maintenance company'],
    featuredImage: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80',
  },

  // 19. Events & Media
  {
    id: 'events-media',
    name: 'Corporate Event Catering, Canopy & 4K Media',
    slug: 'events-media',
    category: 'Events & Media',
    categorySlug: 'events-media',
    shortDescription: 'Gourmet corporate catering, buffet services, luxury marquee canopies, live sound reinforcement, and 4K cinema video coverage.',
    fullOverview: 'Turnkey event planning and production management. Delivering unforgettable corporate galas, conferences, weddings, and product launches with gourmet international and African menus, air-conditioned transparent marquees, line-array audio systems, and broadcast-grade media.',
    iconName: 'Camera',
    subServices: [
      'Corporate Buffet & Plated Dining Catering Services',
      'Luxury Transparent & Marquee Tent Canopy Fabrication',
      'High-Output Line-Array Sound Systems & Stage Lighting',
      '4K Drone Videography, Multi-Camera Live Switching & Photography',
      'Stage Fabrication, LED Video Walls & Event Branding',
    ],
    keyQuestionsToAsk: [
      'Can you arrange a food tasting session for our event planning committee?',
      'Do you provide food safety certifications and trained uniformed banquet servers?',
      'What backup audio and power systems do you maintain on-site during the event?',
    ],
    costFactors: [
      'Guest headcount and menu courses (Starters, Main dishes, Desserts, Mocktails)',
      'Tent specifications (Air-conditioned enclosed marquee vs open canopy)',
      'Media production scope (Single camera vs 4K cinema multi-cam with drone)',
    ],
    comparisonGuide: [
      'Check references and video clips from recent corporate events of similar scale.',
      'Ensure the sound engineer does a site acoustics check before setting up speaker angles.',
    ],
    typicalProjectScope: [
      'Event coordination walkthrough and timeline schedule',
      'Tent erection, staging, lighting, and audio setup',
      'Food preparation in certified commissary kitchen and hot transport',
      'Live event execution, audio mixing, recording, and post-event cleanup',
    ],
    seoKeywords: ['corporate catering company', 'event videographer near me', 'marquee tent rental lagos', 'stage sound system rental'],
    featuredImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
  },

  // 20. Legal & Corporate
  {
    id: 'corporate-cac',
    name: 'CAC Corporate Registration, Tax & Legal Drafting',
    slug: 'corporate-cac',
    category: 'Legal & Corporate',
    categorySlug: 'legal-corporate',
    shortDescription: 'CAC company incorporation, annual returns, FIRS tax clearance certificates (TCC), commercial contract drafting, and trademarks.',
    fullOverview: 'Accredited corporate legal and secretarial practice. Assisting entrepreneurs, SMEs, and foreign corporations with Corporate Affairs Commission (CAC) registrations, share capital increases, Trademark registration, commercial leases, and regulatory compliance.',
    iconName: 'FileText',
    subServices: [
      'CAC Limited Liability (LTD) & Business Name Incorporation',
      'Annual Returns Filing, Status Reports & Share Capital Upgrades',
      'Federal Inland Revenue Service (FIRS) Tax Clearance Certificates',
      'Commercial Contracts, Service Level Agreements (SLA) & NDAs',
      'Trademark, Patent & Copyright Intellectual Property Filing',
    ],
    keyQuestionsToAsk: [
      'Are you an accredited CAC agent or licensed Nigerian legal practitioner?',
      'Does your quotation include all statutory government stamp duties and filing fees?',
      'How quickly do you deliver the certified true copy (CTC) certificate and status report?',
    ],
    costFactors: [
      'Company share capital size (statutory stamp duties scale with authorized shares)',
      'Type of entity (Business Name, Private LTD, Public PLC, or NGO/Incorporated Trustees)',
      'Complexity of custom shareholder agreements vs standard memorandum articles',
    ],
    comparisonGuide: [
      'Ensure all incorporation documents are registered on the official CAC post-incorporation portal.',
      'Look for secretarial firms that handle post-incorporation compliance like SCUML and Tax IDs.',
    ],
    typicalProjectScope: [
      'Name availability search and reservation on CAC portal',
      'Drafting of objects, director appointments, and shareholder allocations',
      'Payment of official stamp duties and registration fees',
      'Issuance of official digital certificate, Tax ID (TIN), and company status report',
    ],
    seoKeywords: ['cac registration agent', 'how to register a company in nigeria', 'tax clearance certificate firs', 'commercial lawyer lagos'],
    featuredImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
  },

  // 21. Moving & Logistics
  {
    id: 'moving-logistics',
    name: 'Household Relocation, Haulage & Freight Logistics',
    slug: 'moving-logistics',
    category: 'Moving & Logistics',
    categorySlug: 'moving-logistics',
    shortDescription: 'Professional home moving, office relocation, bubble-wrapping, furniture dismantling, interstate trucking, and cargo haulage.',
    fullOverview: 'Stress-free residential and corporate moving services across Nigeria. Providing heavy box trucks, specialized furniture blankets, bubble-wrap packing materials, skilled loaders, furniture assembly technicians, and goods-in-transit insurance.',
    iconName: 'Truck',
    subServices: [
      'Full-Service Household Relocation with Packing & Unpacking',
      'Corporate Office Relocation & IT Equipment Transport',
      'Professional Furniture Dismantling & Reassembly',
      'Interstate Haulage & Covered Truck Freight Logistics',
      'Short & Long-Term Secure Warehouse Storage Facilities',
    ],
    keyQuestionsToAsk: [
      'Do you provide Goods in Transit (GIT) insurance coverage for high-value items?',
      'Are boxes, bubble wrap, stretch film, and packing tape included in your quotation?',
      'Do your movers have proper tools to dismantle and reassemble king beds and wardrobes?',
    ],
    costFactors: [
      'Volume and weight of items requiring appropriate truck capacity (3-ton, 5-ton, 10-ton)',
      'Distance between origin and destination addresses (local vs interstate)',
      'Access factors (high-floor stairs without elevator, narrow estate gates)',
    ],
    comparisonGuide: [
      'Always insist on closed box trucks to protect furniture from rain, dust, and transit theft.',
      'Verify that fragile electronics and glass tables are individually padded and crate-protected.',
    ],
    typicalProjectScope: [
      'Pre-move inventory survey and packing material allocation',
      'Furniture wrapping, delicate box labelling, and truck loading',
      'Transport with live GPS tracking',
      'Offloading, room-by-room item placement, and furniture reassembly',
    ],
    seoKeywords: ['movers in lagos', 'house relocation service abuja', 'interstate haulage nigeria', 'office moving company'],
    featuredImage: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=1200&q=80',
  },

  // 22. Smart Automation
  {
    id: 'smart-automation',
    name: 'Smart Home Automation & Biometric Access',
    slug: 'smart-automation',
    category: 'Smart Automation',
    categorySlug: 'smart-automation',
    shortDescription: 'Automated electric sliding gates, smart video doorbells, smart lighting switches, motorized curtain tracks, and mobile app controls.',
    fullOverview: 'Next-generation home and commercial automation. Integrating automated sliding and swing gate motors, Tuya/Zigbee smart switches, smartphone intercoms, motorized curtains, and voice-controlled lighting systems that work effortlessly even during power changes.',
    iconName: 'Zap',
    subServices: [
      'Automated Electric Sliding & Swing Gate Motors with Remotes',
      'Smart Wi-Fi & Zigbee Touch Wall Switches & Scene Automation',
      'Video Doorbell Intercoms with Remote Smartphone Unlocking',
      'Motorized Curtain & Window Blind Track Automation',
      'Integrated Multi-Room Audio & Architectural In-Ceiling Speakers',
    ],
    keyQuestionsToAsk: [
      'Can the gate motor be operated manually with a physical override key during power outages?',
      'Do the smart switches work locally without continuous internet connection?',
      'Are the gate sensors equipped with safety infrared beams to prevent closing on cars or children?',
    ],
    costFactors: [
      'Gate weight and length determining motor power (e.g. 800kg vs 1500kg motor)',
      'Number of smart switch gangs and dimmer controls',
      'Integration protocol (Zigbee with local hub vs individual Wi-Fi chips)',
    ],
    comparisonGuide: [
      'Ensure gate motors have battery backup systems included in the base package.',
      'Check that external intercom doorbells are IP65 weather-sealed against heavy tropical downpours.',
    ],
    typicalProjectScope: [
      'Site motor gear-rack and electrical wiring assessment',
      'Gate rack welding, motor mounting, and safety photo-sensor alignment',
      'Smart switch swap-in and neutral wire check in switch boxes',
      'Mobile app pairing, scene programming, and client walk-through',
    ],
    seoKeywords: ['automatic gate motor installation', 'smart home automation nigeria', 'video doorbell installer', 'motorized curtains lagos'],
    featuredImage: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80',
  },

  // 23. Pest Control
  {
    id: 'pest-control',
    name: 'Industrial Pest Control & Fumigation',
    slug: 'pest-control',
    category: 'Pest Control',
    categorySlug: 'pest-control',
    shortDescription: 'Safe eco-friendly fumigation, termite baiting systems, bedbug thermal extermination, and commercial rodent control contracts.',
    fullOverview: 'Certified environmental health and vector management. Eradicating stubborn termites, bedbugs, cockroaches, mosquitoes, and rodents from homes, schools, hotels, restaurants, and food storage warehouses with odorless, government-approved formulations.',
    iconName: 'Sparkles',
    subServices: [
      'Complete Household Odorless Fumigation & Insect Extermination',
      'Subterranean Termite Soil Drilling & Anti-Termite Pre-Treatment',
      'Specialized Bedbug Eradication & Mattress Sanitization',
      'Commercial Rodent Proofing & Tamper-Resistant Bait Stations',
      'Hospitality & Restaurant HACCP-Compliant Pest Management',
    ],
    keyQuestionsToAsk: [
      'Are the fumigation chemicals certified by NAFDAC and safe for human re-entry after 2-4 hours?',
      'Do you offer a re-infestation warranty period (e.g. 3 to 6 months)?',
      'Do your technicians wear full personal protective equipment (PPE)?',
    ],
    costFactors: [
      'Property size (number of rooms or facility square meters)',
      'Target pest species (Termite soil barriers require heavy drilling and chemical injection)',
      'Frequency (Single treatment vs quarterly preventive maintenance contracts)',
    ],
    comparisonGuide: [
      'Avoid uncertified vendors who spray dangerous agricultural pesticides inside living quarters.',
      'Check that the team provides clear pre-fumigation preparation guidelines (covering food/dishes).',
    ],
    typicalProjectScope: [
      'Infestation inspection and entry-point assessment',
      'Protective masking and client safety briefing',
      'Ultra-Low Volume (ULV) cold fogging and residual surface spraying',
      'Safety aeration check and post-treatment prevention checklist handover',
    ],
    seoKeywords: ['fumigation services near me', 'termite treatment price nigeria', 'bedbug pest control lagos', 'commercial fumigation company'],
    featuredImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
  },

  // 24. Waterproofing
  {
    id: 'waterproofing',
    name: 'Basement & Roof Membrane Waterproofing',
    slug: 'waterproofing',
    category: 'Waterproofing',
    categorySlug: 'waterproofing',
    shortDescription: 'Torch-on bituminous membranes, liquid polyurethane coatings, basement negative-side waterproofing, and rising damp treatment.',
    fullOverview: 'Specialized structural moisture barrier engineering. Protecting roofs, gutters, underground basements, swimming pools, and concrete water retaining tanks from water ingress, salt efflorescence, and rising damp using imported 4mm mineral membranes and elastomeric polyurethanes.',
    iconName: 'Shield',
    subServices: [
      'Torch-On 4mm Bituminous Mineral Roofing Membrane Installation',
      'Liquid Polyurethane Seamless Waterproofing for Balconies & Decks',
      'Basement Negative-Side Crystalline Waterproofing & Epoxy Grouting',
      'Chemical DPC Injection for Rising Damp on Ground Floor Walls',
      'Concrete Swimming Pool & Underground Water Tank Sealing',
    ],
    keyQuestionsToAsk: [
      'Do you apply primer on the concrete slab before torching the membrane?',
      'How do you treat corners and parapet wall turn-ups to prevent perimeter leaks?',
      'Do you conduct a 24-hour flood test before finishing over the waterproofing?',
    ],
    costFactors: [
      'Total surface area and degree of existing surface concrete spalling',
      'Material specification (Torch-on APP/SBS membrane vs liquid polyurethane)',
      'Accessibility and safety requirements for steep roofs or underground pits',
    ],
    comparisonGuide: [
      'Never accept basic cement wash as waterproofing; elastomeric membranes that expand and contract are vital.',
      'Insist on a 5-10 year written warranty backed by flood test evidence.',
    ],
    typicalProjectScope: [
      'Concrete surface preparation, chipping loose mortar, and crack patching',
      'Bituminous solvent primer application',
      'Torch-on membrane installation with 100mm seam overlaps',
      '24-hour water ponding flood test and protective screed laying',
    ],
    seoKeywords: ['waterproofing contractor lagos', 'roof leak waterproofing price', 'rising damp treatment abuja', 'torch on membrane installer'],
    featuredImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
  },
];

export const SERVICE_CATEGORIES_CATALOG: { name: string; slug: string; description: string }[] = [
  { name: 'All Services', slug: 'all', description: 'Browse all verified trades, technical contracting, and commercial services.' },
  { name: 'Solar & Power', slug: 'solar-power', description: 'Clean solar hybrid systems, generators, and battery energy storage.' },
  { name: 'Electrical', slug: 'electrical', description: 'Certified wiring, DB boards, conduit installations, and lightning earthing.' },
  { name: 'Plumbing', slug: 'plumbing', description: 'Boreholes, water treatment plants, pressure pumps, and sanitary fixtures.' },
  { name: 'Security', slug: 'security', description: 'CCTV surveillance cameras, access control, electric fences, and alarms.' },
  { name: 'Cleaning', slug: 'cleaning', description: 'Post-construction cleaning, residential deep scrubbing, and fumigation.' },
  { name: 'Construction', slug: 'construction', description: 'General building contractors, structural renovations, tiling, and roofing.' },
  { name: 'HVAC & Cooling', slug: 'hvac-cooling', description: 'Inverter air conditioners, commercial chillers, and cold room construction.' },
  { name: 'Technology & IT', slug: 'technology-it', description: 'Enterprise networking, Starlink installation, server setups, and software.' },
  { name: 'Painting & Screeding', slug: 'painting-screeding', description: 'Acrylic wall screeding, textcoat painting, stucco, and epoxy flooring.' },
  { name: 'Carpentry & Woodwork', slug: 'carpentry-woodwork', description: 'Custom kitchen cabinets, walk-in wardrobes, doors, and architectural woodwork.' },
  { name: 'Aluminium & Glazing', slug: 'aluminium-glazing', description: 'Casement windows, glass office partitions, shower enclosures, and curtain walls.' },
  { name: 'Ceilings & Drywall', slug: 'ceilings-drywall', description: 'POP false ceilings, hidden LED troughs, acoustic drywalls, and cornices.' },
  { name: 'Power & Generators', slug: 'power-generators', description: 'Diesel generator maintenance, engine overhauls, and ATS automatic switches.' },
  { name: 'Flooring & Paving', slug: 'flooring-paving', description: 'Vitrified tiles, Italian marble, granite slabs, and interlocking stone paving.' },
  { name: 'Roofing & Structural', slug: 'roofing-structural', description: 'Stone-coated Gerard tiles, aluminium trusses, gutters, and leak waterproofing.' },
  { name: 'Architecture & Design', slug: 'architecture-design', description: 'Architectural blueprints, 3D renderings, structural calculations, and BOQ.' },
  { name: 'Boreholes & Water', slug: 'boreholes-water', description: 'Geophysical aquifer mapping, deep drilling, casing, and water treatment plants.' },
  { name: 'Automotive Care', slug: 'automotive-care', description: 'Computerized diagnostics, car AC repair, transmission flush, and fleet care.' },
  { name: 'Events & Media', slug: 'events-media', description: 'Corporate catering, transparent marquee tents, line-array audio, and 4K media.' },
  { name: 'Legal & Corporate', slug: 'legal-corporate', description: 'CAC incorporation, annual returns, FIRS tax certificates, and legal contracts.' },
  { name: 'Moving & Logistics', slug: 'moving-logistics', description: 'Household packing, office relocation, interstate freight haulage, and storage.' },
  { name: 'Smart Automation', slug: 'smart-automation', description: 'Electric sliding gate motors, smart switches, video doorbells, and intercoms.' },
  { name: 'Pest Control', slug: 'pest-control', description: 'Odorless fumigation, subterranean termite baiting, and bedbug extermination.' },
  { name: 'Waterproofing', slug: 'waterproofing', description: 'Torch-on bituminous membrane, liquid polyurethane, and basement damp treatment.' },
];

export const LOCAL_STORAGE_DYNAMIC_SERVICES_KEY = 'matthorg_dynamic_services';

/**
 * Retrieve dynamically auto-created services from persistent storage.
 */
export function getStoredDynamicServices(): ServiceTaxonomyItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DYNAMIC_SERVICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse dynamic services from localStorage:', err);
    return [];
  }
}

/**
 * Persist dynamic services into storage.
 */
export function saveStoredDynamicServices(services: ServiceTaxonomyItem[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_DYNAMIC_SERVICES_KEY, JSON.stringify(services));
  } catch (err) {
    console.warn('Failed to save dynamic services to localStorage:', err);
  }
}

/**
 * Helper to slugify arbitrary service names into clean URL tokens.
 */
export function slugifyServiceName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Infer category, icon, and high-res photography based on keywords.
 */
export function inferServiceAttributes(serviceName: string, categoryOrIndustry?: string) {
  const text = `${serviceName} ${categoryOrIndustry || ''}`.toLowerCase();

  let category = 'Specialized Contracting';
  let categorySlug = 'specialized-contracting';
  let iconName = 'Briefcase';
  let featuredImage = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80';

  if (text.includes('solar') || text.includes('inverter') || text.includes('battery') || text.includes('energy') || text.includes('photovoltaic')) {
    category = 'Solar & Power';
    categorySlug = 'solar-power';
    iconName = 'Zap';
    featuredImage = 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('electric') || text.includes('wiring') || text.includes('conduit') || text.includes('lighting') || text.includes('power panel')) {
    category = 'Electrical';
    categorySlug = 'electrical';
    iconName = 'Bolt';
    featuredImage = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('plumb') || text.includes('pipe') || text.includes('borehole') || text.includes('water') || text.includes('drainage') || text.includes('pump') || text.includes('sewage')) {
    category = 'Plumbing & Water';
    categorySlug = 'plumbing';
    iconName = 'Wrench';
    featuredImage = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('cool') || text.includes('ac ') || text.includes('air condition') || text.includes('hvac') || text.includes('chiller') || text.includes('cold room') || text.includes('refrigerat')) {
    category = 'HVAC & Cooling';
    categorySlug = 'hvac-cooling';
    iconName = 'Wind';
    featuredImage = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('security') || text.includes('cctv') || text.includes('camera') || text.includes('surveillance') || text.includes('fence') || text.includes('alarm')) {
    category = 'Security & CCTV';
    categorySlug = 'security';
    iconName = 'Shield';
    featuredImage = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('clean') || text.includes('janitorial') || text.includes('hygiene') || text.includes('wash') || text.includes('scrub')) {
    category = 'Cleaning & Hygiene';
    categorySlug = 'cleaning';
    iconName = 'Sparkles';
    featuredImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('build') || text.includes('construct') || text.includes('civil') || text.includes('masonry') || text.includes('renovat') || text.includes('concrete')) {
    category = 'Construction & Civil Works';
    categorySlug = 'construction';
    iconName = 'Building';
    featuredImage = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('paint') || text.includes('screed') || text.includes('stucco') || text.includes('coat')) {
    category = 'Painting & Screeding';
    categorySlug = 'painting-screeding';
    iconName = 'Paintbrush';
    featuredImage = 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('carpenter') || text.includes('wood') || text.includes('cabinet') || text.includes('wardrobe') || text.includes('furniture')) {
    category = 'Carpentry & Woodwork';
    categorySlug = 'carpentry-woodwork';
    iconName = 'Hammer';
    featuredImage = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('alum') || text.includes('glass') || text.includes('glaz') || text.includes('window') || text.includes('partition')) {
    category = 'Aluminium & Glazing';
    categorySlug = 'aluminium-glazing';
    iconName = 'Layers';
    featuredImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('roof') || text.includes('truss') || text.includes('gutter') || text.includes('leak')) {
    category = 'Roofing & Structural';
    categorySlug = 'roofing-structural';
    iconName = 'Building';
    featuredImage = 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('tile') || text.includes('paving') || text.includes('interlock') || text.includes('marble') || text.includes('granite') || text.includes('floor')) {
    category = 'Flooring & Paving';
    categorySlug = 'flooring-paving';
    iconName = 'Compass';
    featuredImage = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('car') || text.includes('auto') || text.includes('mechanic') || text.includes('vehicle') || text.includes('engine') || text.includes('diagnost')) {
    category = 'Automotive Care';
    categorySlug = 'automotive-care';
    iconName = 'Car';
    featuredImage = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('it') || text.includes('network') || text.includes('starlink') || text.includes('wifi') || text.includes('server') || text.includes('software') || text.includes('app') || text.includes('web')) {
    category = 'Technology & IT';
    categorySlug = 'technology-it';
    iconName = 'Monitor';
    featuredImage = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('event') || text.includes('cater') || text.includes('media') || text.includes('video') || text.includes('photo') || text.includes('sound') || text.includes('marquee')) {
    category = 'Events & Media';
    categorySlug = 'events-media';
    iconName = 'Camera';
    featuredImage = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('cac') || text.includes('legal') || text.includes('law') || text.includes('tax') || text.includes('incorporat')) {
    category = 'Legal & Corporate';
    categorySlug = 'legal-corporate';
    iconName = 'FileText';
    featuredImage = 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('moving') || text.includes('logistics') || text.includes('haulage') || text.includes('relocat') || text.includes('freight')) {
    category = 'Moving & Logistics';
    categorySlug = 'moving-logistics';
    iconName = 'Truck';
    featuredImage = 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('pest') || text.includes('fumigat') || text.includes('termite')) {
    category = 'Pest Control';
    categorySlug = 'pest-control';
    iconName = 'Shield';
    featuredImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80';
  } else if (text.includes('waterproof') || text.includes('membrane') || text.includes('damp')) {
    category = 'Waterproofing';
    categorySlug = 'waterproofing';
    iconName = 'Droplets';
    featuredImage = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80';
  } else if (categoryOrIndustry && categoryOrIndustry.trim()) {
    category = categoryOrIndustry.split(',')[0].split('&')[0].trim();
    categorySlug = slugifyServiceName(category);
  }

  return { category, categorySlug, iconName, featuredImage };
}

/**
 * Return all services in the application, merging the static base taxonomy
 * with any dynamically created services registered by businesses.
 */
export function getAllServices(): ServiceTaxonomyItem[] {
  const list: ServiceTaxonomyItem[] = [...BASE_SERVICE_TAXONOMY];
  const dynamic = getStoredDynamicServices();

  dynamic.forEach((d) => {
    if (!list.some((s) => s.slug === d.slug || s.name.toLowerCase() === d.name.toLowerCase())) {
      list.push(d);
    }
  });

  return list;
}

/**
 * Live reference to all services. Maintained dynamically.
 */
export const SERVICE_TAXONOMY: ServiceTaxonomyItem[] = getAllServices();

/**
 * Automatically creates a new service in the MatthOrg Services Directory
 * when a business signs up with a new service or adds one in settings.
 */
export function autoCreateServiceFromBusiness(
  rawServiceName: string,
  categoryOrIndustry?: string,
  business?: any
): ServiceTaxonomyItem | null {
  if (!rawServiceName || typeof rawServiceName !== 'string') return null;
  const cleanName = rawServiceName.trim();
  if (cleanName.length < 3) return null;

  // Ignore trivial generic words
  if (['n/a', 'none', 'services', 'general', 'all', 'other', 'specialization'].includes(cleanName.toLowerCase())) {
    return null;
  }

  const allCurrent = getAllServices();
  const targetSlug = slugifyServiceName(cleanName);

  // Check if this service already exists in base or dynamic taxonomy
  const existing = allCurrent.find(
    (s) =>
      s.slug === targetSlug ||
      s.name.toLowerCase() === cleanName.toLowerCase() ||
      s.id.toLowerCase() === targetSlug
  );

  if (existing) {
    return existing;
  }

  const { category, categorySlug, iconName, featuredImage } = inferServiceAttributes(cleanName, categoryOrIndustry);

  const subServices = [
    `Turnkey ${cleanName} for Residential & Commercial Properties`,
    `Diagnostic Site Audit & Engineering Sizing for ${cleanName}`,
    `Certified Installation, Repair & Preventive Maintenance`,
    `Component Upgrades, System Safety Inspection & Testing`,
    `Emergency Troubleshooting & Maintenance Agreements`,
  ];

  const keyQuestionsToAsk = [
    `What specific certifications, warranties, and track records do you offer for ${cleanName}?`,
    `Does your written proposal include an itemized breakdown of materials, certified labor, and transport?`,
    `What quality standards and safety protocols do you follow during execution?`,
    `Can you provide verifiable recent project photos or client references within my locality?`,
  ];

  const costFactors = [
    `Scope of work, project dimensions, and technical complexity`,
    `Grade and manufacturer specifications of materials required`,
    `Site accessibility, structural preparation, and specialized tooling needs`,
    `Expedited timeline or emergency mobilization requirements`,
  ];

  const comparisonGuide = [
    `Always require an itemized quotation separating equipment costs from labor before mobilization.`,
    `Verify the contractor is a registered business profile on MatthOrg with verified contact credentials.`,
  ];

  const typicalProjectScope = [
    `Initial client consultation, technical requirement gathering, and site audit`,
    `Itemized proposal, milestone billing schedule, and contract sign-off`,
    `Certified execution according to industry engineering codes`,
    `Handover testing, client inspection, and documentation delivery`,
  ];

  const seoKeywords = [
    `${cleanName.toLowerCase()} nigeria`,
    `hire ${cleanName.toLowerCase()}`,
    `${cleanName.toLowerCase()} company`,
    `cost of ${cleanName.toLowerCase()}`,
    `${cleanName.toLowerCase()} near me`,
  ];

  const newService: ServiceTaxonomyItem = {
    id: `dyn_${targetSlug}_${Date.now().toString(36)}`,
    name: cleanName,
    slug: targetSlug,
    category,
    categorySlug,
    shortDescription: `Professional ${cleanName} services delivered by verified contractors across Nigeria with transparent quotes and milestone guarantees.`,
    fullOverview: `Comprehensive ${cleanName} solutions for residential, corporate, and industrial projects. Covers diagnostic audits, premium material procurement, certified installation, and after-sales service warranties.`,
    iconName,
    subServices,
    keyQuestionsToAsk,
    costFactors,
    comparisonGuide,
    typicalProjectScope,
    seoKeywords,
    featuredImage,
  };

  // Persist to localStorage
  try {
    const stored = getStoredDynamicServices();
    if (!stored.some((s) => s.slug === newService.slug || s.name.toLowerCase() === newService.name.toLowerCase())) {
      stored.unshift(newService);
      saveStoredDynamicServices(stored);
    }
  } catch (err) {
    console.warn('Error saving dynamic service:', err);
  }

  // Update in-memory SERVICE_TAXONOMY array
  if (!SERVICE_TAXONOMY.some((s) => s.slug === newService.slug)) {
    SERVICE_TAXONOMY.unshift(newService);
  }

  // Broadcast event across windows and components
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('matthorg_services_updated', {
          detail: { newService, businessName: business?.business_name },
        })
      );
    } catch {
      // ignore
    }
  }

  return newService;
}

/**
 * Scan a business profile (from registration form or settings edit form)
 * and auto-create any new services that are not yet in the services directory.
 */
export function autoCreateServicesFromBusinessProfile(business: any): ServiceTaxonomyItem[] {
  if (!business) return [];

  const created: ServiceTaxonomyItem[] = [];
  const candidateNames = new Set<string>();

  // 1. Check categories_offered array
  if (Array.isArray(business.categories_offered)) {
    business.categories_offered.forEach((c: any) => {
      if (typeof c === 'string' && c.trim()) {
        candidateNames.add(c.trim());
      }
    });
  }

  // 2. Check specialization string (may contain comma-separated services)
  if (business.specialization && typeof business.specialization === 'string') {
    const parts = business.specialization
      .split(/[,;\n+&]/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length >= 3 && !['and', 'with', 'for', 'ltd'].includes(s.toLowerCase()));

    parts.forEach((p: string) => candidateNames.add(p));
  }

  // 3. Process candidate names
  candidateNames.forEach((name) => {
    const res = autoCreateServiceFromBusiness(name, business.industry, business);
    if (res) {
      created.push(res);
    }
  });

  return created;
}

/**
 * Get the full service categories catalog including any dynamic categories.
 */
export function getServiceCategoriesCatalog(): { name: string; slug: string; description: string }[] {
  const catalog = [...SERVICE_CATEGORIES_CATALOG];
  const all = getAllServices();

  all.forEach((s) => {
    if (!catalog.some((c) => c.slug === s.categorySlug || c.name.toLowerCase() === s.category.toLowerCase())) {
      catalog.push({
        name: s.category,
        slug: s.categorySlug,
        description: `Verified professionals in ${s.category} across Nigeria.`,
      });
    }
  });

  return catalog;
}

export function getServiceBySlug(slug: string): ServiceTaxonomyItem | undefined {
  if (!slug) return undefined;
  const clean = slug.toLowerCase().trim();
  if (clean === 'all') return undefined;
  const all = getAllServices();
  return all.find(
    (s) =>
      s.slug === clean ||
      s.id === clean ||
      s.name.toLowerCase() === clean ||
      s.name.toLowerCase().includes(clean)
  );
}
