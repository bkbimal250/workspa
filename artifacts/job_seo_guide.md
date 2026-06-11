# Comprehensive SEO Guide for Job Postings (Google Rich Results)

To get jobs featured in the specialized "Google for Jobs" widget on Google Search (which dramatically increases visibility and click-through rates), you must implement **Structured Data** using the `JobPosting` schema from schema.org.

Here is the complete structure and improvement plan for your SPA Jobs portal.

## 1. The Ideal JSON-LD `JobPosting` Structure

This script block should be injected into the `<head>` of individual job detail pages (`/jobs/[slug]/page.tsx` in Next.js).

```json
{
  "@context": "https://schema.org/",
  "@type": "JobPosting",
  "title": "Spa Manager",
  "description": "<p>We are looking for an experienced Spa Manager to oversee daily operations...</p>",
  "identifier": {
    "@type": "PropertyValue",
    "name": "Workspa",
    "value": "JOB_ID_12345"
  },
  "datePosted": "2026-05-02T00:00:00Z",
  "validThrough": "2026-06-02T00:00:00Z",
  "employmentType": "FULL_TIME",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "Luxury Wellness Spa",
    "sameAs": "https://www.luxurywellnessspa.com",
    "logo": "https://www.workspa.in/uploads/luxury-spa-logo.png"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Wellness Avenue",
      "addressLocality": "Sanpada",
      "addressRegion": "Maharashtra",
      "postalCode": "400705",
      "addressCountry": "IN"
    }
  },
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "INR",
    "value": {
      "@type": "QuantitativeValue",
      "value": 45000,
      "unitText": "MONTH"
    }
  }
}
```

---

## 2. Google's Required vs. Recommended Properties

If you miss a **Required** property, the job will NOT appear in the Google Jobs widget. Missing **Recommended** properties will result in lower ranking and warnings in Google Search Console.

### 🔴 REQUIRED Properties (Must Have)
*   **`datePosted`**: When the job was originally posted (ISO 8601 format).
*   **`description`**: The full job description in HTML format (paragraphs, lists). *Do not just use a 1-sentence summary.*
*   **`hiringOrganization`**: The business offering the job. Must include the `name`.
*   **`jobLocation`**: The physical location of the job. Must include `addressLocality` (City) and `addressCountry`.
*   **`title`**: The exact job title (e.g., "Spa Therapist", not "Awesome Spa Therapist Needed NOW!!!").
*   **`validThrough`**: The expiration date of the posting. If omitted, Google assumes the job is open forever, which can cause penalties later.

### 🟡 RECOMMENDED Properties (For Better Ranking)
*   **`baseSalary`**: Exact salary or salary range. *Jobs with salaries get 30% more clicks on Google.*
*   **`employmentType`**: e.g., `FULL_TIME`, `PART_TIME`, `CONTRACTOR`.
*   **`hiringOrganization.logo`**: Adds trust and visual appeal to the Google Jobs listing.
*   **`identifier`**: A unique ID from your database, helping Google track changes to the job.
*   **`applicantLocationRequirements`**: Crucial if offering remote jobs (e.g., "Telecommute").

---

## 3. Improvements Needed for Your SPA Job Portal

Based on our recent work on the backend and frontend, here is what needs to be improved in the codebase to maximize SEO and Rich Results:

### A. Next.js App Router Metadata Implementation
In your dynamic job page (`frontend/app/jobs/[slug]/page.tsx`), you must generate the JSON-LD dynamically.

**Improvement Action:**
Use Next.js built-in metadata and standard JSON-LD injection:

```tsx
// Inside your job detail page component
import Script from 'next/script';

export default async function JobPage({ params }) {
  const job = await fetchJobDetails(params.slug);
  
  // Format the structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description, // Ensure this is HTML formatted
    datePosted: new Date(job.created_at).toISOString(),
    validThrough: new Date(new Date(job.created_at).setMonth(new Date().getMonth() + 1)).toISOString(), // Set expiry +1 month
    employmentType: job.job_type === 'full-time' ? 'FULL_TIME' : 'PART_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.spa?.name || "Workspa",
      logo: job.spa?.logo_url
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city?.name,
        addressRegion: job.state?.name,
        addressCountry: 'IN'
      }
    },
    // Optional but highly recommended: Salary
    ...(job.salary_min && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'INR',
        value: {
          '@type': 'QuantitativeValue',
          minValue: job.salary_min,
          maxValue: job.salary_max,
          unitText: 'MONTH'
        }
      }
    })
  };

  return (
    <section>
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ... rest of your UI ... */}
    </section>
  );
}
```

### B. Standardize Job Types and Salaries in the Database
For Google to parse your data, backend fields must strictly map to schema standards:
*   **Action:** Ensure your backend `job_type` maps cleanly to Google's accepted values (`FULL_TIME`, `PART_TIME`, `CONTRACTOR`, `TEMPORARY`, `INTERN`, `VOLUNTEER`, `PER_DIEM`, `OTHER`).
*   **Action:** Ensure your `salary` fields are broken down into `salary_min`, `salary_max`, and `salary_currency`. Raw strings like "15k-20k" will be rejected by Google's Rich Results validator.

### C. Create an XML Sitemap and Google Indexing API
Since job postings are highly time-sensitive:
1.  **Sitemap:** Make sure you have a dynamically generated `sitemap.xml` in Next.js that lists all active `/jobs/[slug]` URLs.
2.  **Indexing API (Crucial for Jobs):** Google specifically recommends using the [Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart) for job boards. Instead of waiting weeks for Google to crawl your sitemap, your backend (FastAPI) should send an HTTP POST request to Google the *exact second* a new job is created or deleted.

### D. Handle Expired Jobs Properly
Google severely penalizes job boards that leave expired jobs indexed.
*   **Action:** When a job is filled or deleted, do NOT return a 404 immediately. 
*   Instead, keep the page but remove the `JobPosting` schema and add a `<meta name="robots" content="noindex">` tag, displaying a message like "This job has been filled. Here are similar jobs...".

## 4. How to Test Your Implementation
Once implemented, you should test a live job URL using the [Google Rich Results Testing Tool](https://search.google.com/test/rich-results). It will instantly tell you if you are missing any required fields or if there are syntax errors in your JSON-LD.
