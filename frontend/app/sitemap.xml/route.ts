import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

const SITE_URL = 'https://workspa.in';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  try {
    // 1. Define Static Pages
    const staticPaths = [
      '',
      '/jobs',
      '/spa-near-me',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
    ];

    const today = new Date().toISOString().split('T')[0];

    let staticUrls = staticPaths.map(path => `
  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${path === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('');

    // 2. Fetch Dynamic Data
    let jobUrls = '';
    let locationUrls = '';
    let categoryLocationUrls = '';
    let spaJobsInUrls = '';

    try {
      // Fetch Jobs
      const jobsRes = await fetch(`${API_URL}/api/jobs/?limit=5000`, { cache: 'no-store' });
      if (jobsRes.ok) {
        const jobs = await jobsRes.json();
        jobUrls = jobs.map((job: any) => `
  <url>
    <loc>${SITE_URL}/jobs/${job.slug}</loc>
    <lastmod>${new Date(job.updated_at || job.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`).join('');
      }

      // Fetch Cities, Areas and Categories in parallel
      const [citiesRes, areasRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/api/locations/cities?limit=1000`, { cache: 'no-store' }),
        fetch(`${API_URL}/api/locations/areas?limit=5000`, { cache: 'no-store' }),
        fetch(`${API_URL}/api/jobs/categories?limit=500`, { cache: 'no-store' })
      ]);

      if (citiesRes.ok) {
        const cities = await citiesRes.json();
        const validCities = cities.filter((c: any) => c.name);

        // Load areas if successful
        let areas: any[] = [];
        if (areasRes.ok) {
          areas = await areasRes.json();
        }

        // Helper to get slug
        const getSlug = (item: any) => item.slug || item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

        // Generate City and Area pages
        locationUrls = validCities.flatMap((city: any) => {
          const citySlug = getSlug(city);
          if (!citySlug) return [];

          const urls = [`
  <url>
    <loc>${SITE_URL}/cities/${citySlug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`];

          // Add /spa-jobs-in-city
          spaJobsInUrls += `
  <url>
    <loc>${SITE_URL}/spa-jobs-in-${citySlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

          // Add Areas for this city
          const cityAreas = areas.filter((a: any) => a.city_id === city.id);
          cityAreas.forEach((area: any) => {
            const areaSlug = getSlug(area);
            if (areaSlug) {
              // Area page: /cities/mumbai/andheri
              urls.push(`
  <url>
    <loc>${SITE_URL}/cities/${citySlug}/${areaSlug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);

              // Area jobs: /spa-jobs-in-andheri-mumbai
              spaJobsInUrls += `
  <url>
    <loc>${SITE_URL}/spa-jobs-in-${areaSlug}-${citySlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
            }
          });

          return urls;
        }).join('');

        // 3. Generate Popular Category-Location Combinations (SEO Routes)
        if (categoriesRes.ok) {
          const categories = await categoriesRes.json();
          const categorySlugs = categories
            .map((cat: any) => cat.slug)
            .filter((slug: any) =>
              slug &&
              typeof slug === 'string' &&
              !slug.match(/-[a-f0-9]{6}$/)
            );

          const popularCities = validCities.slice(0, 50); // Top 50 cities

          categoryLocationUrls = popularCities.flatMap((city: any) => {
            const citySlug = getSlug(city);
            if (!citySlug) return [];

            return categorySlugs.map((catSlug: string) => `
  <url>
    <loc>${SITE_URL}/jobs/${catSlug}-jobs-in-${citySlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
          }).join('');
        }
      }
    } catch (e) {
      console.error('Error fetching dynamic sitemap data:', e);
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${jobUrls}
${locationUrls}
${spaJobsInUrls}
${categoryLocationUrls}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('Global sitemap error:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
