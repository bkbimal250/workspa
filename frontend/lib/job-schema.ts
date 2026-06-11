const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

export function normalizeEmploymentType(type?: string): string {
  const normalized = type?.toUpperCase().trim() || 'FULL_TIME';
  const validTypes = [
    'FULL_TIME',
    'PART_TIME',
    'CONTRACTOR',
    'TEMPORARY',
    'INTERN',
    'VOLUNTEER',
    'PER_DIEM',
    'OTHER',
  ];
  const typeMap: Record<string, string> = {
    'FULL TIME': 'FULL_TIME',
    'PART TIME': 'PART_TIME',
    FULLTIME: 'FULL_TIME',
    PARTTIME: 'PART_TIME',
    'FULL-TIME': 'FULL_TIME',
    'PART-TIME': 'PART_TIME',
  };
  const mapped = typeMap[normalized] || normalized;
  return validTypes.includes(mapped) ? mapped : 'FULL_TIME';
}

export function stripHtml(value?: string) {
  return (value || '').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

export function getJobLocation(job: any) {
  return [job.area?.name, job.city?.name, job.state?.name].filter(Boolean).join(', ') || 'India';
}

export function getJobLogoUrl(job: any) {
  const logo = job.spa?.logo_image;
  if (!logo) return undefined;
  if (logo.startsWith('http')) return logo;
  return `${apiUrl}${logo.startsWith('/') ? logo : `/${logo}`}`;
}

export function generateJobPostingSchema(job: any) {
  const jobUrl = `${siteUrl}/jobs/${job.slug}`;
  const logoUrl = getJobLogoUrl(job);
  const description = stripHtml(job.description || job.meta_description);
  const validThrough = job.expires_at
    ? new Date(job.expires_at).toISOString()
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    '@id': jobUrl,
    title: job.title,
    description,
    identifier: {
      '@type': 'PropertyValue',
      name: job.spa?.name || 'Workspa',
      value: String(job.id),
    },
    datePosted: new Date(job.created_at).toISOString(),
    validThrough,
    employmentType: normalizeEmploymentType(job.Employee_type || job.job_type?.name),
    industry: job.Industry_type || 'Beauty and Spa',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.spa?.name || 'Workspa',
      ...(logoUrl && { logo: logoUrl }),
      ...(job.spa?.slug && { sameAs: `${siteUrl}/besttopspas/${job.spa.slug}` }),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(job.spa?.address && { streetAddress: job.spa.address }),
        addressLocality: job.city?.name || '',
        addressRegion: job.state?.name || '',
        postalCode: job.postalCode || job.spa?.postalCode || '',
        addressCountry: job.country?.name || 'IN',
      },
      ...(job.latitude && job.longitude && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: Number(job.latitude),
          longitude: Number(job.longitude),
        },
      }),
    },
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'India',
    },
    directApply: true,
    url: jobUrl,
    ...(job.salary_min && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: job.salary_currency || 'INR',
        value: {
          '@type': 'QuantitativeValue',
          minValue: Number(job.salary_min),
          ...(job.salary_max && { maxValue: Number(job.salary_max) }),
          unitText: 'MONTH',
        },
      },
    }),
    ...(job.experience_years_min !== undefined && job.experience_years_min !== null && {
      experienceRequirements: {
        '@type': 'OccupationalExperienceRequirements',
        monthsOfExperience: Number(job.experience_years_min) * 12,
      },
    }),
    ...(job.key_skills && {
      skills: job.key_skills.split(',').map((skill: string) => skill.trim()).filter(Boolean),
    }),
    ...(job.responsibilities && { responsibilities: stripHtml(job.responsibilities) }),
    ...(job.required_gender && { occupationalCategory: job.required_gender }),
  };
}

export function generateJobBreadcrumbSchema(job: any) {
  const jobUrl = `${siteUrl}/jobs/${job.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Jobs', item: `${siteUrl}/jobs` },
      { '@type': 'ListItem', position: 3, name: job.title, item: jobUrl },
    ],
  };
}

export function generateJobFaqSchema(job: any) {
  const location = getJobLocation(job);
  const employment = normalizeEmploymentType(job.Employee_type || job.job_type?.name).replace(/_/g, ' ').toLowerCase();
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How do I apply for ${job.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Open the ${job.title} listing on Workspa and use the apply, call, or WhatsApp option shown on the job page.`,
        },
      },
      {
        '@type': 'Question',
        name: `Where is this ${job.title} job located?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `This job is located in ${location}.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is this job full-time or part-time?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `This listing is marked as a ${employment} role.`,
        },
      },
    ],
  };
}
