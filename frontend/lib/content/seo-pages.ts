export const roleLandingPages = [
  {
    slug: 'spa-therapist',
    title: 'Spa Therapist Jobs',
    description: 'Browse verified spa therapist jobs in Mumbai, Navi Mumbai, Thane, and nearby areas.',
    query: 'Spa Therapist',
    duties: ['Body therapy and massage services', 'Customer consultation and room preparation', 'Hygiene, punctuality, and treatment documentation'],
    skills: ['Massage therapy knowledge', 'Customer handling', 'Flexible shift availability'],
  },
  {
    slug: 'spa-manager',
    title: 'Spa Manager Jobs',
    description: 'Find spa manager openings for wellness centers, luxury spas, and salon-spa businesses.',
    query: 'Spa Manager',
    duties: ['Team scheduling and daily operations', 'Revenue tracking and customer experience', 'Vendor, inventory, and service quality checks'],
    skills: ['Spa operations', 'Team leadership', 'Sales and customer retention'],
  },
  {
    slug: 'receptionist',
    title: 'Spa Receptionist Jobs',
    description: 'Apply for front desk and receptionist jobs at spas and wellness centers.',
    query: 'Receptionist',
    duties: ['Guest handling and appointment booking', 'Call, WhatsApp, and billing coordination', 'Front desk reporting and follow-up'],
    skills: ['Communication', 'Basic computer skills', 'Customer service'],
  },
  {
    slug: 'beautician',
    title: 'Beautician Jobs',
    description: 'Find beautician and beauty therapist jobs at verified spas and wellness centers.',
    query: 'Beautician',
    duties: ['Beauty and grooming services', 'Client consultation and product guidance', 'Treatment room hygiene and stock care'],
    skills: ['Beauty therapy', 'Product knowledge', 'Client consultation'],
  },
  {
    slug: 'housekeeping',
    title: 'Spa Housekeeping Jobs',
    description: 'Browse housekeeping and attendant jobs for spas and wellness centers.',
    query: 'Housekeeping',
    duties: ['Room cleaning and linen management', 'Spa hygiene and guest support', 'Daily supplies and facility upkeep'],
    skills: ['Cleanliness', 'Reliability', 'Shift discipline'],
  },
];

export const locationLandingPages = [
  { href: '/spa-jobs-in-mumbai', label: 'Spa Jobs in Mumbai' },
  { href: '/spa-jobs-in-navi-mumbai', label: 'Spa Jobs in Navi Mumbai' },
  { href: '/spa-jobs-in-thane', label: 'Spa Jobs in Thane' },
  { href: '/spa-jobs-near-me', label: 'Spa Jobs Near Me' },
  { href: '/spa-centers-in-mumbai', label: 'Spa Centers in Mumbai' },
];

export function getRoleLandingPage(slug: string) {
  return roleLandingPages.find((page) => page.slug === slug);
}
