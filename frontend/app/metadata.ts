import type { Metadata } from 'next';
import { defaultMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...defaultMetadata,
  title: 'Work Spa Near Me - Find Work Spa in Your City | Work Spa Portal',
  description: 'Find the best Work Spa near you. Apply directly to spas without login. Browse thousands of Work Spa by location, salary, and experience. Search for therapist, receptionist, and spa manager positions.',
  openGraph: {
    ...defaultMetadata.openGraph,
    title: 'Work Spa Near Me - Find Work Spa in Your City',
    description: 'Find the best Work Spa near you. Apply directly to spas without login. Browse thousands of Work Spa by location, salary, and experience.',
  },
};

