export type Industry = 'Breeder' | 'Restaurant' | 'Law Firm' | 'Mechanic' | 'Radio Station';

export const INDUSTRY_CONFIG = {
  'Breeder': {
      label: 'Dog Breeder',
          modules: ['animals', 'litters', 'medical', 'inventory', 'staff', 'financials'],
              primaryColor: '#4f46e5', // Indigo
                },
                  'Restaurant': {
                      label: 'Restaurant',
                          modules: ['pos', 'kitchen', 'menu', 'inventory', 'staff', 'financials'],
                              primaryColor: '#dc2626', // Red
                                },
                                  // Add others as you sign them...
                                  };
                                  