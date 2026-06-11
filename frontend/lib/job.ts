import apiClient from './axios';

export interface Job {
  id: number;
  title: string;
  slug: string;
  description: string;
  requirements?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  experience_years_min?: number;
  experience_years_max?: number;
  job_opening_count?: number;
  responsibilities?: string;
  benefits?: string;
  job_timing?: string;
  key_skills?: string;
  Industry_type?: string;
  Employee_type?: string;
  required_gender?: string;
  job_type_id?: number;
  job_category_id?: number;
  spa_id: number;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  area_id?: number;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  hr_contact_name?: string;
  hr_contact_email?: string;
  hr_contact_phone?: string;
  is_active: boolean;
  is_featured: boolean;
  view_count: number;
  apply_click_count: number;
  message_count: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  // Relationships
  spa?: { id: number; name: string; slug: string; address?: string; logo_image?: string; is_verified?: boolean };
  job_type?: { id: number; name: string; slug: string };
  job_category?: { id: number; name: string; slug: string };
  country?: { id: number; name: string };
  state?: { id: number; name: string };
  city?: { id: number; name: string };
  area?: { id: number; name: string };
  created_by_user?: {
    id: number;
    name: string;
    profile_photo?: string;
    email?: string;
  };
}

export interface JobType {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface JobCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export const jobAPI = {
  getAllJobs: async (params?: {
    country_id?: number;
    state_id?: number;
    city_id?: number;
    area_id?: number;
    spa_id?: number;
    job_type?: string;
    job_category?: string;
    is_featured?: boolean;
    q?: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    experience_years_min?: number;
    experience_years_max?: number;
    sort_by?: 'recent' | 'popular' | 'salary';
    latitude?: number;
    longitude?: number;
    radius_km?: number;
    skip?: number;
    limit?: number;
  }): Promise<Job[]> => {
    const response = await apiClient.get(`/api/jobs/`, { params });
    return response.data;
  },

  getJobById: async (id: number): Promise<Job> => {
    const response = await apiClient.get(`/api/jobs/id/${id}`);
    return response.data;
  },

  getJobBySlug: async (slug: string): Promise<Job> => {
    const response = await apiClient.get(`/api/jobs/slug/${slug}`);
    return response.data;
  },

  createJob: async (data: Partial<Job>): Promise<Job> => {
    const response = await apiClient.post(`/api/jobs/`, data);
    return response.data;
  },

  updateJob: async (id: number, data: Partial<Job>): Promise<Job> => {
    const response = await apiClient.put(`/api/jobs/${id}`, data);
    return response.data;
  },

  deleteJob: async (id: number, permanent: boolean = false): Promise<void> => {
    await apiClient.delete(`/api/jobs/${id}`, { params: { permanent } });
  },

  getPopularJobs: async (limit: number = 10): Promise<Job[]> => {
    const response = await apiClient.get(`/api/jobs/popular`, { params: { limit } });
    return response.data;
  },

  getRecentJobs: async (limit: number = 10): Promise<Job[]> => {
    const response = await apiClient.get(`/api/jobs/recent`, { params: { limit } });
    return response.data;
  },

  getRelatedJobs: async (jobId: number, limit: number = 6): Promise<Job[]> => {
    const response = await apiClient.get(`/api/jobs/related/${jobId}`, { params: { limit } });
    return response.data;
  },

  // JobType API
  getJobTypes: async (skip: number = 0, limit: number = 100): Promise<JobType[]> => {
    const response = await apiClient.get(`/api/jobs/types`, { params: { skip, limit } });
    return response.data;
  },

  createJobType: async (data: { name: string; description?: string }): Promise<JobType> => {
    const response = await apiClient.post(`/api/jobs/types`, data);
    return response.data;
  },

  updateJobType: async (id: number, data: { name?: string; description?: string }): Promise<JobType> => {
    const response = await apiClient.put(`/api/jobs/types/${id}`, data);
    return response.data;
  },

  deleteJobType: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/jobs/types/${id}`);
  },

  // JobCategory API
  getJobCategories: async (skip: number = 0, limit: number = 100): Promise<JobCategory[]> => {
    const response = await apiClient.get(`/api/jobs/categories`, { params: { skip, limit } });
    return response.data;
  },

  createJobCategory: async (data: { name: string; description?: string }): Promise<JobCategory> => {
    const response = await apiClient.post(`/api/jobs/categories`, data);
    return response.data;
  },

  updateJobCategory: async (id: number, data: { name?: string; description?: string }): Promise<JobCategory> => {
    const response = await apiClient.put(`/api/jobs/categories/${id}`, data);
    return response.data;
  },

  deleteJobCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/jobs/categories/${id}`);
  },

  // Recruiter-specific endpoints
  getMyJobs: async (params?: { skip?: number; limit?: number }): Promise<Job[]> => {
    const response = await apiClient.get('/api/jobs/recruiter/my-jobs', { params });
    return response.data;
  },

  // Job counts
  getJobCount: async (params?: {
    country_id?: number;
    state_id?: number;
    city_id?: number;
    area_id?: number;
    job_type?: string;
    job_category?: string;
    q?: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    experience_years_min?: number;
    experience_years_max?: number;
  }): Promise<{ count: number }> => {
    const response = await apiClient.get(`/api/jobs/count`, { params });
    return response.data;
  },

  getJobCountsByLocation: async (params?: {
    job_category?: string;
    job_type?: string;
  }): Promise<Array<{
    city_id: number;
    city_name: string;
    city_slug: string;
    job_count: number;
  }>> => {
    const response = await apiClient.get(`/api/jobs/counts-by-location`, { params });
    return response.data;
  },
};

