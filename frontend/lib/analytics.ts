import apiClient from './axios';

export interface PopularLocation {
  city: string;
  state?: string;
  country?: string;
  job_count?: number;
  event_count?: number;
}

export interface ChatbotUsageStats {
  total: number;
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

export interface TimeSeriesPoint {
  date: string;
  event_count: number;
}

export interface EventCounts {
  page_view: number;
  apply_click: number;
  cv_upload: number;
  chat_opened: number;
  job_search?: number;
  spa_booking_click?: number;
}

export interface TopJobSearch {
  search_query: string;
  count: number;
}

export interface DeviceBreakdown {
  mobile: number;
  desktop: number;
  tablet: number;
}

export interface ButtonClickTotals {
  whatsapp: number;
  call: number;
  share: number;
  apply: number;
}

export interface AnalyticsOverview {
  total_jobs: number;
  active_jobs: number;
  featured_jobs: number;
  total_applications: number;
  application_status: {
    pending: number;
    reviewed: number;
    accepted: number;
    rejected: number;
    unknown: number;
  };
  total_users: number;
  active_users: number;
  verified_users: number;
  total_spas: number;
  active_spas: number;
  verified_spas: number;
  button_clicks: ButtonClickTotals;
  total_button_clicks: number;
}

export const analyticsAPI = {
  getDashboardOverview: async (days?: number): Promise<AnalyticsOverview> => {
    const response = await apiClient.get(`/api/analytics/dashboard-overview`, {
      params: days ? { days } : {},
    });
    return response.data;
  },

  getPopularLocations: async (limit: number = 10, days?: number): Promise<PopularLocation[]> => {
    const response = await apiClient.get(`/api/analytics/popular-locations`, { 
      params: { limit, ...(days ? { days } : {}) } 
    });
    return response.data;
  },

  getChatbotUsage: async (): Promise<ChatbotUsageStats> => {
    const response = await apiClient.get(`/api/analytics/chatbot-usage`);
    return response.data;
  },

  getTimeSeries: async (days: number = 30): Promise<TimeSeriesPoint[]> => {
    const response = await apiClient.get(`/api/analytics/time-series`, { params: { days } });
    return response.data;
  },

  getEventCounts: async (days?: number): Promise<EventCounts> => {
    const response = await apiClient.get(`/api/analytics/event-counts`, { params: days ? { days } : {} });
    return response.data;
  },

  getTopJobSearches: async (limit: number = 10, days?: number): Promise<TopJobSearch[]> => {
    const response = await apiClient.get(`/api/analytics/top-job-searches`, { 
      params: { limit, ...(days ? { days } : {}) } 
    });
    return response.data;
  },

  getUniqueVisitors: async (days?: number): Promise<{ unique_visitors: number }> => {
    const response = await apiClient.get(`/api/analytics/unique-visitors`, { 
      params: days ? { days } : {} 
    });
    return response.data;
  },

  getDeviceBreakdown: async (days?: number): Promise<DeviceBreakdown> => {
    const response = await apiClient.get(`/api/analytics/device-breakdown`, { 
      params: days ? { days } : {} 
    });
    return response.data;
  },

  getBookingClicks: async (days?: number): Promise<{ booking_clicks: number }> => {
    const response = await apiClient.get(`/api/analytics/booking-clicks`, { 
      params: days ? { days } : {} 
    });
    return response.data;
  },

  trackEvent: async (
    eventType: string,
    data?: {
      job_id?: number;
      spa_id?: number;
      city?: string;
      latitude?: number;
      longitude?: number;
      search_query?: string;
    }
  ): Promise<void> => {
    try {
      await apiClient.post(`/api/analytics/track`, {
        event_type: eventType,
        ...data,
      });
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.error('Analytics tracking failed:', error);
    }
  },

  trackButtonClick: async (
    buttonType: 'whatsapp' | 'call' | 'share' | 'apply',
    jobId: number,
    data?: {
      user_id?: number;
      city?: string;
      latitude?: number;
      longitude?: number;
      share_platform?: string;  // For share button: 'facebook', 'twitter', 'linkedin', 'whatsapp', 'email', 'native'
    }
  ): Promise<void> => {
    try {
      const params: any = {
        button_type: buttonType,
        job_id: jobId,
      };
      if (data?.user_id) params.user_id = data.user_id;
      if (data?.city) params.city = data.city;
      if (data?.latitude !== undefined) params.latitude = data.latitude;
      if (data?.longitude !== undefined) params.longitude = data.longitude;
      if (data?.share_platform) params.share_platform = data.share_platform;
      
      await apiClient.post(`/api/analytics/track-button-click`, null, { params });
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.error('Button click tracking failed:', error);
    }
  },

  getButtonClicks: async (
    jobId?: number,
    buttonType?: 'whatsapp' | 'call' | 'share' | 'apply',
    days?: number
  ): Promise<any> => {
    const response = await apiClient.get(`/api/analytics/button-clicks`, {
      params: {
        ...(jobId ? { job_id: jobId } : {}),
        ...(buttonType ? { button_type: buttonType } : {}),
        ...(days ? { days } : {}),
      },
    });
    return response.data;
  },

  getButtonClicksByDay: async (
    buttonType?: 'whatsapp' | 'call' | 'share' | 'apply',
    days: number = 30
  ): Promise<any[]> => {
    const response = await apiClient.get(`/api/analytics/button-clicks-by-day`, {
      params: {
        ...(buttonType ? { button_type: buttonType } : {}),
        days,
      },
    });
    return response.data;
  },
};
