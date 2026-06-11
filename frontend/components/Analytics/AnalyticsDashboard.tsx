'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaEye,
  FaLaptop,
  FaMapMarkerAlt,
  FaMobileAlt,
  FaMousePointer,
  FaSearch,
  FaTabletAlt,
  FaUser,
  FaWhatsapp,
  FaPhone,
  FaShareAlt,
} from 'react-icons/fa';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
  analyticsAPI,
  AnalyticsOverview,
  ChatbotUsageStats,
  DeviceBreakdown,
  EventCounts,
  PopularLocation,
  TimeSeriesPoint,
  TopJobSearch,
} from '@/lib/analytics';
import AnalyticsCard from './AnalyticsCard';
import AnalyticsPanel from './AnalyticsPanel';
import ProgressList from './ProgressList';

type TimeRange = '7d' | '30d' | '90d' | 'all';

const defaultOverview: AnalyticsOverview = {
  total_jobs: 0,
  active_jobs: 0,
  featured_jobs: 0,
  total_applications: 0,
  application_status: {
    pending: 0,
    reviewed: 0,
    accepted: 0,
    rejected: 0,
    unknown: 0,
  },
  total_users: 0,
  active_users: 0,
  verified_users: 0,
  total_spas: 0,
  active_spas: 0,
  verified_spas: 0,
  button_clicks: {
    whatsapp: 0,
    call: 0,
    share: 0,
    apply: 0,
  },
  total_button_clicks: 0,
};

const defaultEventCounts: EventCounts = {
  page_view: 0,
  apply_click: 0,
  cv_upload: 0,
  chat_opened: 0,
  job_search: 0,
  spa_booking_click: 0,
};

const defaultDeviceBreakdown: DeviceBreakdown = {
  mobile: 0,
  desktop: 0,
  tablet: 0,
};

function getDays(timeRange: TimeRange) {
  if (timeRange === '7d') return 7;
  if (timeRange === '30d') return 30;
  if (timeRange === '90d') return 90;
  return undefined;
}

function getTimeSeriesDays(timeRange: TimeRange) {
  return getDays(timeRange) || 365;
}

function periodLabel(timeRange: TimeRange) {
  if (timeRange === '7d') return 'last 7 days';
  if (timeRange === '30d') return 'last 30 days';
  if (timeRange === '90d') return 'last 90 days';
  return 'last year';
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [overview, setOverview] = useState<AnalyticsOverview>(defaultOverview);
  const [eventCounts, setEventCounts] = useState<EventCounts>(defaultEventCounts);
  const [popularLocations, setPopularLocations] = useState<PopularLocation[]>([]);
  const [chatbotUsage, setChatbotUsage] = useState<ChatbotUsageStats | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [topJobSearches, setTopJobSearches] = useState<TopJobSearch[]>([]);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown>(defaultDeviceBreakdown);
  const [bookingClicks, setBookingClicks] = useState(0);

  useEffect(() => {
    if (!user) return;

    if (user.role !== 'admin' && user.role !== 'manager') {
      router.push('/dashboard');
      return;
    }

    fetchAnalytics();
  }, [user, router, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const days = getDays(timeRange);
      const [
        overviewData,
        popularLocationsData,
        chatbotUsageData,
        timeSeriesData,
        eventCountsData,
        topSearchesData,
        uniqueVisitorsData,
        deviceBreakdownData,
        bookingClicksData,
      ] = await Promise.all([
        analyticsAPI.getDashboardOverview(days).catch(() => defaultOverview),
        analyticsAPI.getPopularLocations(10, days).catch(() => []),
        analyticsAPI.getChatbotUsage().catch(() => null),
        analyticsAPI.getTimeSeries(getTimeSeriesDays(timeRange)).catch(() => []),
        analyticsAPI.getEventCounts(days).catch(() => defaultEventCounts),
        analyticsAPI.getTopJobSearches(10, days).catch(() => []),
        analyticsAPI.getUniqueVisitors(days).catch(() => ({ unique_visitors: 0 })),
        analyticsAPI.getDeviceBreakdown(days).catch(() => defaultDeviceBreakdown),
        analyticsAPI.getBookingClicks(days).catch(() => ({ booking_clicks: 0 })),
      ]);

      setOverview(overviewData || defaultOverview);
      setPopularLocations(Array.isArray(popularLocationsData) ? popularLocationsData : []);
      setChatbotUsage(chatbotUsageData);
      setTimeSeries(Array.isArray(timeSeriesData) ? timeSeriesData : []);
      setEventCounts(eventCountsData || defaultEventCounts);
      setTopJobSearches(Array.isArray(topSearchesData) ? topSearchesData : []);
      setUniqueVisitors(uniqueVisitorsData.unique_visitors || 0);
      setDeviceBreakdown(deviceBreakdownData || defaultDeviceBreakdown);
      setBookingClicks(bookingClicksData.booking_clicks || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const topSearchItems = useMemo(
    () =>
      topJobSearches.map((search) => ({
        label: `"${search.search_query}"`,
        value: search.count,
      })),
    [topJobSearches]
  );

  const locationItems = useMemo(
    () =>
      popularLocations.map((location) => ({
        label: location.city || 'Unknown',
        value: location.event_count || 0,
      })),
    [popularLocations]
  );

  const applicationStatusItems = [
    { label: 'Pending', value: overview.application_status.pending },
    { label: 'Reviewed', value: overview.application_status.reviewed },
    { label: 'Accepted', value: overview.application_status.accepted },
    { label: 'Rejected', value: overview.application_status.rejected },
  ];

  const buttonClickItems = [
    { label: 'WhatsApp clicks', value: overview.button_clicks.whatsapp, note: 'Job WhatsApp button taps' },
    { label: 'Call clicks', value: overview.button_clicks.call, note: 'Job call button taps' },
    { label: 'Share clicks', value: overview.button_clicks.share, note: 'Job share actions' },
    { label: 'Apply clicks', value: overview.button_clicks.apply, note: 'Tracked job apply actions' },
  ];

  const deviceItems = [
    { label: 'Mobile', value: deviceBreakdown.mobile, icon: <FaMobileAlt size={14} />, tone: 'bg-green-100 text-green-700' },
    { label: 'Desktop', value: deviceBreakdown.desktop, icon: <FaLaptop size={14} />, tone: 'bg-blue-100 text-blue-700' },
    { label: 'Tablet', value: deviceBreakdown.tablet, icon: <FaTabletAlt size={14} />, tone: 'bg-violet-100 text-violet-700' },
  ];

  const timeSeriesMax = Math.max(...timeSeries.map((point) => point.event_count), 1);

  if (loading && overview.total_jobs === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-light">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-brand-600">
                  <FaChartLine size={28} />
                </span>
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                System totals, visitor activity, searches, clicks, and location insights.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select
                value={timeRange}
                onChange={(event) => setTimeRange(event.target.value as TimeRange)}
                className="h-11 px-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium bg-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <Link
                href="/dashboard"
                className="h-11 px-4 inline-flex items-center justify-center text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          <AnalyticsCard title="Active Jobs" value={overview.active_jobs} subtitle={`${overview.total_jobs.toLocaleString()} total jobs`} icon={<FaBriefcase size={16} />} />
          <AnalyticsCard title="Applications" value={overview.total_applications} subtitle="Total received" icon={<FaMousePointer size={16} />} tone="green" />
          <AnalyticsCard title="Users" value={overview.total_users} subtitle={`${overview.active_users.toLocaleString()} active`} icon={<FaUser size={16} />} tone="blue" />
          <AnalyticsCard title="SPAs" value={overview.total_spas} subtitle={`${overview.verified_spas.toLocaleString()} verified`} icon={<FaBuilding size={16} />} tone="violet" />
          <AnalyticsCard title="Page Views" value={eventCounts.page_view} subtitle={`For ${periodLabel(timeRange)}`} icon={<FaEye size={16} />} tone="amber" />
          <AnalyticsCard title="Unique Visitors" value={uniqueVisitors} subtitle={`For ${periodLabel(timeRange)}`} icon={<FaUser size={16} />} tone="cyan" />
          <AnalyticsCard title="Booking Clicks" value={bookingClicks} subtitle="Appointment button clicks" icon={<FaCalendarAlt size={16} />} tone="rose" />
          <AnalyticsCard title="Job Action Clicks" value={overview.total_button_clicks} subtitle="Call, WhatsApp, share, apply" icon={<FaMousePointer size={16} />} tone="slate" />
          <AnalyticsCard title="Job Searches" value={eventCounts.job_search || 0} subtitle="Tracked search events" icon={<FaSearch size={16} />} tone="brand" />
          <AnalyticsCard title="Chat Opens" value={eventCounts.chat_opened} subtitle="Chatbot open events" icon={<FaChartLine size={16} />} tone="blue" />
          <AnalyticsCard title="Featured Jobs" value={overview.featured_jobs} subtitle="Promoted listings" icon={<FaBriefcase size={16} />} tone="amber" />
          <AnalyticsCard title="Verified Users" value={overview.verified_users} subtitle="Verified accounts" icon={<FaUser size={16} />} tone="green" />
        </div>

        {chatbotUsage && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-brand-600">
                <FaChartLine size={18} />
              </span>
              <h2 className="text-lg font-semibold text-gray-900">Chatbot Users</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
              {[
                ['Today', chatbotUsage.daily],
                ['This Week', chatbotUsage.weekly],
                ['This Month', chatbotUsage.monthly],
                ['This Year', chatbotUsage.yearly],
                ['All Time', chatbotUsage.total],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-500">{label}</p>
                  <p className="text-xl font-bold text-gray-900">{Number(value).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          <AnalyticsPanel title="Top Job Searches" icon={<FaSearch size={18} />}>
            <ProgressList items={topSearchItems} emptyTitle="No search data available" emptySubtitle="Search queries will appear here." />
          </AnalyticsPanel>

          <AnalyticsPanel title="Popular Locations" icon={<FaMapMarkerAlt size={18} />}>
            <ProgressList items={locationItems} emptyTitle="No location data available" emptySubtitle="Analytics events with city data will appear here." />
          </AnalyticsPanel>

          <AnalyticsPanel title="Job Button Clicks" icon={<FaMousePointer size={18} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
                <span className="text-green-700"><FaWhatsapp size={16} /></span>
                <div>
                  <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                  <p className="text-lg font-bold text-gray-900">{overview.button_clicks.whatsapp.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                <span className="text-blue-700"><FaPhone size={16} /></span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Call</p>
                  <p className="text-lg font-bold text-gray-900">{overview.button_clicks.call.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-violet-50 p-3">
                <span className="text-violet-700"><FaShareAlt size={16} /></span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Share</p>
                  <p className="text-lg font-bold text-gray-900">{overview.button_clicks.share.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-3">
                <span className="text-amber-700"><FaMousePointer size={16} /></span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Apply</p>
                  <p className="text-lg font-bold text-gray-900">{overview.button_clicks.apply.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <ProgressList items={buttonClickItems} emptyTitle="No button clicks yet" emptySubtitle="Job action clicks will appear here." />
          </AnalyticsPanel>

          <AnalyticsPanel title="Application Status" icon={<FaBriefcase size={18} />}>
            <ProgressList items={applicationStatusItems} emptyTitle="No applications yet" emptySubtitle="Application status totals will appear here." />
          </AnalyticsPanel>

          <AnalyticsPanel title="Device Breakdown" icon={<FaChartLine size={18} />}>
            <div className="space-y-3">
              {deviceItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${item.tone}`}>{item.icon}</div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </AnalyticsPanel>

          <AnalyticsPanel title="Event Types" icon={<FaEye size={18} />}>
            <ProgressList
              items={[
                { label: 'Page views', value: eventCounts.page_view },
                { label: 'Apply clicks', value: eventCounts.apply_click },
                { label: 'CV uploads', value: eventCounts.cv_upload },
                { label: 'Chat opened', value: eventCounts.chat_opened },
                { label: 'Job searches', value: eventCounts.job_search || 0 },
                { label: 'SPA booking clicks', value: eventCounts.spa_booking_click || 0 },
              ]}
              emptyTitle="No event data available"
              emptySubtitle="Tracked analytics events will appear here."
            />
          </AnalyticsPanel>
        </div>

        <div className="mt-6">
          <AnalyticsPanel title="Time-based Analytics" icon={<FaCalendarAlt size={18} />}>
            {timeSeries.length === 0 ? (
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-brand-700 text-sm">
                No analytics events recorded yet for the selected period.
              </div>
            ) : (
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
                <p className="text-brand-700 text-sm font-medium mb-3">
                  Daily events for {periodLabel(timeRange)}.
                </p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {timeSeries.map((point) => {
                    const percentage = Math.max((point.event_count / timeSeriesMax) * 100, 4);

                    return (
                      <div key={point.date} className="flex items-center gap-3 text-xs sm:text-sm">
                        <div className="w-24 text-gray-700 font-medium">
                          {new Date(point.date).toLocaleDateString()}
                        </div>
                        <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-brand-100">
                          <div className="h-2 bg-brand-500 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                        <div className="w-10 text-right text-gray-700 font-semibold">{point.event_count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </AnalyticsPanel>
        </div>
      </main>
    </div>
  );
}
