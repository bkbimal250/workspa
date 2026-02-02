import type { Metadata } from 'next';
import { generateJobMetadata, generateSearchMetadata } from './metadata';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

interface JobDetailLayoutProps {
  children: React.ReactNode;
  params: { 'job-slug': string };
}

export async function generateMetadata({
  params,
}: {
  params: { 'job-slug': string };
}): Promise<Metadata> {
  const slug = params['job-slug'];

  // Detect if this is a Category-Location search page
  if (slug.includes('-jobs-in-')) {
    try {
      const match = slug.match(/(.+)-jobs-in-(.+)/);
      if (match) {
        const categorySlug = match[1];

        // Find actual category name for better count fetching
        let actualCategoryName = categorySlug;
        try {
          const catRes = await fetch(`${apiUrl}/api/jobs/categories?limit=500`, {
            next: { revalidate: 86400 } // Cache for 24 hours
          });
          if (catRes.ok) {
            const categories = await catRes.json();
            const matchingCategory = categories.find((c: any) =>
              c.slug === categorySlug ||
              c.name.toLowerCase() === categorySlug.replace(/-/g, ' ')
            );
            if (matchingCategory) {
              actualCategoryName = matchingCategory.name;
            }
          }
        } catch (e) { }

        // Fetch job count for search metadata
        let jobCount = 0;
        try {
          const response = await fetch(`${apiUrl}/api/jobs/count?job_category=${encodeURIComponent(actualCategoryName)}`, {
            next: { revalidate: 3600 }
          });
          if (response.ok) {
            const data = await response.json();
            jobCount = data.count || 0;
          }
        } catch (e) {
          console.error('Failed to fetch job count for search metadata:', e);
        }
        return generateSearchMetadata(slug, jobCount);
      }
    } catch (e) {
      console.error('Error in search metadata generation:', e);
    }
  }

  // Otherwise, handle as Job Detail page
  try {
    const jobResponse = await fetch(`${apiUrl}/api/jobs/slug/${slug}`, {
      cache: 'no-store',
    });

    if (!jobResponse.ok) {
      return {
        title: 'Job Not Found | Workspa.in',
        description: 'The job you are looking for could not be found.',
      };
    }

    const job = await jobResponse.json();

    let spa = null;
    if (job.spa_id) {
      try {
        const spaResponse = await fetch(`${apiUrl}/api/spas/${job.spa_id}`, {
          cache: 'no-store',
        });
        if (spaResponse.ok) {
          spa = await spaResponse.json();
        }
      } catch (error) {
        console.error('Failed to fetch SPA details for metadata:', error);
      }
    }

    return generateJobMetadata(job, spa);
  } catch (error) {
    console.error('Error generating job metadata:', error);
    return {
      title: 'Work Spa Jobs | Workspa.in',
      description: 'View detailed information about this spa job opportunity.',
    };
  }
}

export default function JobDetailLayout({
  children,
}: JobDetailLayoutProps) {
  return <>{children}</>;
}
