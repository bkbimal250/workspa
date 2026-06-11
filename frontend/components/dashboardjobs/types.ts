import { Area, City, Country, State } from '@/lib/location';
import { JobCategory, JobType } from '@/lib/job';
import { Spa } from '@/lib/spa';

export type JobCreateStep = 1 | 2 | 3;

export type JobFormData = {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  job_timing: string;
  key_skills: string;
  job_opening_count: string;
  Industry_type: string;
  Employee_type: string;
  required_gender: string;
  job_type_id: string;
  job_category_id: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  experience_years_min: string;
  experience_years_max: string;
  spa_id: string;
  country_id: string;
  state_id: string;
  city_id: string;
  area_id: string;
  postalCode: string;
  hr_contact_name: string;
  hr_contact_email: string;
  hr_contact_phone: string;
  is_active: boolean;
  is_featured: boolean;
  expires_at: string;
  meta_title: string;
  meta_description: string;
};

export type JobFormErrors = Record<string, string>;

export type JobFieldChangeHandler = (name: keyof JobFormData, value: JobFormData[keyof JobFormData]) => void;

export type JobLookupData = {
  spas: Spa[];
  jobTypes: JobType[];
  jobCategories: JobCategory[];
  countries: Country[];
  states: State[];
  cities: City[];
  areas: Area[];
};
