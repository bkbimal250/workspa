ALTER TABLE analytics_events
ADD COLUMN IF NOT EXISTS search_query TEXT;
