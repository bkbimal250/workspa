import { Metadata } from 'next'
import { Job } from '@/lib/job'
import { Spa } from '@/lib/spa'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in'
const apiUrl = process.env.NEXT_PUBLIC_API_URL

export function generateJobMetadata(job: Job, spa?: Spa | null): Metadata {
  const locationParts = []
  if (job.area?.name) locationParts.push(job.area.name)
  if (job.city?.name) locationParts.push(job.city.name)
  if (job.state?.name) locationParts.push(job.state.name)
  const location = locationParts.join(', ') || 'India'

  const title = `${job.title} at ${spa?.name || 'SPA'} - ${location} | Work Spa Portal`

  const salaryText = job.salary_min && job.salary_max
    ? `Salary: ₹${(job.salary_min / 1000).toFixed(0)}k - ₹${(job.salary_max / 1000).toFixed(0)}k PA. `
    : job.salary_min
      ? `Salary: ₹${(job.salary_min / 1000).toFixed(0)}k+ PA. `
      : ''

  const baseDescription = `Apply for ${job.title} position at ${spa?.name || 'SPA'} in ${location}. ${salaryText}View job details, requirements, and apply directly.`
  const description = job.description
    ? `${job.description.substring(0, 120).trim()}... Apply for ${job.title} in ${location}. ${salaryText}View full details and apply now.`
    : baseDescription

  const jobUrl = `${siteUrl}/jobs/${job.slug}`
  const ogImage = spa?.logo_image
    ? `${apiUrl}/${spa.logo_image}`
    : `${siteUrl}/og-image.jpg`

  return {
    title,
    description,
    keywords: [
      job.title,
      `${job.title} jobs`,
      `${job.title} ${location}`,
      spa?.name || 'SPA',
      'Work Spa',
      'spa therapist jobs',
      location,
      job.job_type?.name || '',
      job.job_category?.name || '',
    ].filter(Boolean),
    openGraph: {
      type: 'article',
      url: jobUrl,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${job.title} at ${spa?.name || 'SPA'}` }],
      siteName: 'Workspa - Work Spa Portal',
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    alternates: { canonical: jobUrl },
  }
}

export function generateSearchMetadata(slug: string, jobCount: number): Metadata {
  // Extract category and location from slug: [category]-jobs-in-[location]
  const match = slug.match(/(.+)-jobs-in-(.+)/)
  if (!match) return { title: 'Work Spa Jobs | Workspa.in' }

  const categoryName = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const locationName = match[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const title = `${categoryName} Jobs in ${locationName} - Find ${jobCount > 0 ? jobCount : ''} Jobs | Workspa.in`
  const description = `Find the latest ${categoryName} jobs in ${locationName} on Workspa.in. ${jobCount > 0 ? `We have ${jobCount} active openings.` : 'Browse therapist, receptionist, and spa manager positions.'} Apply directly to spas without login.`
  const pageUrl = `${siteUrl}/jobs/${slug}`

  return {
    title,
    description,
    keywords: [`${categoryName} jobs ${locationName}`, `${categoryName} jobs in ${locationName}`, locationName, categoryName],
    openGraph: { title, description, url: pageUrl, siteName: 'Workspa.in', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: pageUrl },
  }
}
