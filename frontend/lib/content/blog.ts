export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  readTime: string;
  relatedLinks: Array<{ label: string; href: string }>;
  sections: Array<{ heading: string; body: string }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'spa-therapist-jobs-in-mumbai',
    title: 'Spa Therapist Jobs in Mumbai: Salary, Skills, and How to Apply',
    description:
      'A practical guide for finding spa therapist jobs in Mumbai, including salary range, skills, documents, and application tips.',
    category: 'Career Guide',
    tags: ['Spa Therapist', 'Mumbai', 'Salary'],
    author: 'Workspa Editorial',
    publishedAt: '2026-01-20',
    readTime: '5 min read',
    relatedLinks: [
      { label: 'Spa therapist jobs', href: '/jobs/spa-therapist' },
      { label: 'Jobs in Mumbai', href: '/spa-jobs-in-mumbai' },
      { label: 'Apply for latest jobs', href: '/jobs' },
    ],
    sections: [
      {
        heading: 'What employers look for',
        body:
          'Most spas prefer candidates who are punctual, well-groomed, comfortable speaking with customers, and trained in common therapies such as Swedish, deep tissue, aromatherapy, and foot reflexology.',
      },
      {
        heading: 'Expected salary',
        body:
          'Entry-level spa therapist roles commonly start with a fixed monthly salary plus incentives or tips. Experienced therapists can earn more in premium locations such as Bandra, Andheri, Powai, Navi Mumbai, and Thane.',
      },
      {
        heading: 'How to apply faster',
        body:
          'Keep your phone number active, mention your experience clearly, and apply to jobs near your preferred travel route. Shortlisting is faster when the profile has location, timing, skills, and expected salary.',
      },
    ],
  },
  {
    slug: 'how-to-apply-for-spa-jobs',
    title: 'How to Apply for Spa Jobs in India',
    description:
      'Step-by-step application tips for spa therapist, receptionist, beautician, housekeeping, and spa manager jobs.',
    category: 'Application Tips',
    tags: ['Apply', 'Spa Jobs', 'India'],
    author: 'Workspa Editorial',
    publishedAt: '2026-01-22',
    readTime: '4 min read',
    relatedLinks: [
      { label: 'All spa jobs', href: '/jobs' },
      { label: 'Spa jobs near me', href: '/spa-jobs-near-me' },
      { label: 'Contact Workspa', href: '/contact' },
    ],
    sections: [
      {
        heading: 'Prepare your details',
        body:
          'Before applying, keep your name, phone number, city, experience, preferred role, expected salary, and joining availability ready.',
      },
      {
        heading: 'Choose relevant roles',
        body:
          'Apply for jobs that match your skills. Therapist, receptionist, beautician, manager, and housekeeping roles have different expectations and interview questions.',
      },
      {
        heading: 'Follow up professionally',
        body:
          'If a job has call or WhatsApp options, send a short message with your experience, location, and preferred interview time.',
      },
    ],
  },
  {
    slug: 'spa-job-salary-in-india',
    title: 'Spa Job Salary in India by Role and Experience',
    description:
      'Understand salary expectations for spa therapist, receptionist, manager, beautician, and housekeeping jobs in India.',
    category: 'Salary Guide',
    tags: ['Salary', 'India', 'Career'],
    author: 'Workspa Editorial',
    publishedAt: '2026-01-24',
    readTime: '5 min read',
    relatedLinks: [
      { label: 'Spa manager jobs', href: '/jobs/spa-manager' },
      { label: 'Receptionist jobs', href: '/jobs/receptionist' },
      { label: 'Beautician jobs', href: '/jobs/beautician' },
    ],
    sections: [
      {
        heading: 'Salary depends on role',
        body:
          'Therapists and beauticians are usually paid based on skill depth, treatment experience, and customer handling. Managers are evaluated more on team, revenue, and operations.',
      },
      {
        heading: 'Location matters',
        body:
          'Premium city areas and high-traffic spa centers often pay better because customer volume and service pricing are higher.',
      },
      {
        heading: 'Growth path',
        body:
          'Candidates can grow from therapist or receptionist roles into senior therapist, trainer, supervisor, and spa manager positions.',
      },
    ],
  },
];

export const blogTopics = [
  'Spa therapist jobs in Mumbai',
  'How to apply for spa jobs',
  'Spa job salary in India',
  'Spa receptionist job responsibilities',
  'Best cities for spa jobs',
  'Spa manager career guide',
  'Beautician jobs in wellness centers',
  'Housekeeping jobs in spas',
  'Interview questions for spa therapist jobs',
  'How to write a spa job profile',
  'Part-time spa jobs near me',
  'Female spa therapist career guide',
  'Spa jobs in Navi Mumbai',
  'Spa jobs in Thane',
  'Skills required for massage therapist jobs',
  'How spas shortlist candidates',
  'Documents needed for spa jobs',
  'Freshers guide to spa careers',
  'How to negotiate spa job salary',
  'Career growth in the wellness industry',
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
