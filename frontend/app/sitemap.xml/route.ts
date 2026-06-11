import { NextResponse } from 'next/server';
import { blogPosts } from '@/lib/content/blog';
import { locationLandingPages, roleLandingPages } from '@/lib/content/seo-pages';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(path: string, lastmod: string, changefreq = 'weekly', priority = '0.7') {
  return `
  <url>
    <loc>${xmlEscape(`${SITE_URL}${path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

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
      '/sitemap',
      '/blog',
    ];

    const today = new Date().toISOString().split('T')[0];

    let staticUrls = staticPaths
      .map(path => urlEntry(path, today, 'daily', path === '' ? '1.0' : '0.8'))
      .join('');

    const contentUrls = [
      ...blogPosts.map((post) => urlEntry(`/blog/${post.slug}`, post.publishedAt, 'monthly', '0.7')),
      ...roleLandingPages.map((page) => urlEntry(`/jobs/${page.slug}`, today, 'daily', '0.8')),
      ...locationLandingPages.map((page) => urlEntry(page.href, today, 'daily', '0.8')),
    ].join('');

    // 2. Fetch Dynamic Data
    let jobUrls = '';
    let spaUrls = '';
    let locationUrls = '';
    let categoryLocationUrls = '';
    let spaJobsInUrls = '';

    try {
      const seoDataRes = API_URL
        ? await fetch(`${API_URL}/api/seo/sitemap-data`, { next: { revalidate: 3600 } })
        : null;

      if (seoDataRes?.ok) {
        const seoData = await seoDataRes.json();

        jobUrls = (seoData.jobs || []).map((job: any) =>
          urlEntry(`/jobs/${job.slug}`, new Date(job.updated_at || job.created_at || today).toISOString().split('T')[0], 'daily', '0.9')
        ).join('');

        spaUrls = (seoData.spas || []).map((spa: any) =>
          urlEntry(`/besttopspas/${spa.slug}`, new Date(spa.updated_at || spa.created_at || today).toISOString().split('T')[0], 'weekly', '0.7')
        ).join('');

        const cities = (seoData.cities || []).filter((c: any) => c.slug);
        const areas = (seoData.areas || []).filter((a: any) => a.slug);
        locationUrls = cities.flatMap((city: any) => {
          const urls = [urlEntry(`/cities/${city.slug}`, today, 'weekly', '0.7')];
          spaJobsInUrls += urlEntry(`/spa-jobs-in-${city.slug}`, today, 'daily', '0.8');
          areas
            .filter((area: any) => area.city_id === city.id)
            .forEach((area: any) => {
              urls.push(urlEntry(`/cities/${city.slug}/${area.slug}`, today, 'weekly', '0.6'));
              spaJobsInUrls += urlEntry(`/spa-jobs-in-${area.slug}-${city.slug}`, today, 'daily', '0.7');
            });
          return urls;
        }).join('');

        const categorySlugs = (seoData.categories || [])
          .map((cat: any) => cat.slug)
          .filter((slug: any) => slug && typeof slug === 'string' && !slug.match(/-[a-f0-9]{6}$/));

        categoryLocationUrls = cities.slice(0, 50).flatMap((city: any) =>
          categorySlugs.map((catSlug: string) =>
            urlEntry(`/jobs/${catSlug}-jobs-in-${city.slug}`, today, 'daily', '0.8')
          )
        ).join('');
      }
    } catch (e) {
      console.error('Error fetching dynamic sitemap data:', e);
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${contentUrls}
${jobUrls}
${spaUrls}
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
