CREATE INDEX IF NOT EXISTS idx_jobs_active_created_at
ON jobs (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_active_city_category
ON jobs (is_active, city_id, job_category_id);

CREATE INDEX IF NOT EXISTS idx_jobs_active_area_category
ON jobs (is_active, area_id, job_category_id);

CREATE INDEX IF NOT EXISTS idx_jobs_active_slug
ON jobs (is_active, slug);

CREATE INDEX IF NOT EXISTS idx_jobs_active_category_created
ON jobs (is_active, job_category_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_spas_active_city_area
ON spas (is_active, city_id, area_id);

CREATE INDEX IF NOT EXISTS idx_spas_active_slug
ON spas (is_active, slug);
