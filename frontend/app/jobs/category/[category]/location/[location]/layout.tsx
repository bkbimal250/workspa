import type { Metadata } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';

interface CategoryLocationLayoutProps {
  children: React.ReactNode;
  params: { category: string; location: string };
}

export async function generateMetadata({
  params,
}: {
  params: { category: string; location: string };
}): Promise<Metadata> {
  try {
    const categorySlug = params.category;
    const locationSlug = params.location;

    // Format category name (fallback)
    let categoryName = categorySlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // 1. Find actual category name for better count fetching
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
          categoryName = actualCategoryName;
        }
      }
    } catch (e) { }

    // Format location name (capitalize each word)
    const locationName = locationSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Fetch job count for this category and location
    let jobCount = 0;
    try {
      // First try to find city by slug to get city_id
      const citiesResponse = await fetch(`${apiUrl}/api/locations/cities?limit=1000`, {
        cache: 'no-store',
      });

      let cityId: number | undefined;
      if (citiesResponse.ok) {
        const cities = await citiesResponse.json();
        const city = cities.find((c: any) => c.slug === locationSlug);
        if (city) {
          cityId = city.id;
        }
      }

      // Build query params
      const params_query: any = {
        job_category: actualCategoryName, // Use actual name
      };

      if (cityId) {
        params_query.city_id = cityId;
      }

      // Fetch job count
      const countResponse = await fetch(`${apiUrl}/api/jobs/count?${new URLSearchParams(params_query as any).toString()}`, {
        cache: 'no-store',
      });

      if (countResponse.ok) {
        const data = await countResponse.json();
        jobCount = data.count || 0;
      }
    } catch (error) {
      console.error('Error fetching job count:', error);
    }

    const jobCountText = jobCount > 0 ? `${jobCount.toLocaleString()} ` : '';
    const baseTitle = `${categoryName} Jobs in ${locationName}`;
    const fullTitle = jobCount > 0
      ? `${baseTitle} - ${jobCountText}${categoryName} Job Vacancies in ${locationName} | Workspa.in`
      : `${baseTitle} | Workspa.in`;

    const title = fullTitle;
    const description = `Find ${jobCountText}${categoryName.toLowerCase()} jobs in ${locationName}. Browse therapist, receptionist, and spa manager positions. Apply directly to spas without login.`;

    const pageUrl = `${siteUrl}/jobs/category/${categorySlug}/location/${locationSlug}`;

    return {
      title,
      description,
      keywords: [
        `${categoryName} jobs`,
        `${categoryName} jobs in ${locationName}`,
        `${categoryName} job vacancies in ${locationName}`,
        `Work Spa ${locationName}`,
        `${categoryName.toLowerCase()} jobs near me`,
        `jobs in ${locationName}`,
        locationName,
        categoryName,
      ],
      openGraph: {
        type: 'website',
        url: pageUrl,
        title,
        description,
        siteName: 'Workspa.in',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: pageUrl,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    const categoryName = params.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const locationName = params.location.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return {
      title: `${categoryName} Jobs in ${locationName} | Workspa.in`,
      description: `Find ${categoryName.toLowerCase()} jobs in ${locationName}. Browse and apply to spa job vacancies.`,
    };
  }
}

export default function CategoryLocationLayout({
  children,
}: CategoryLocationLayoutProps) {
  return <>{children}</>;
}
