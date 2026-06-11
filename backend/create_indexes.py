"""
Database index creation script for performance optimization.

Usage:
    python create_indexes.py
"""

from sqlalchemy import text

from app.core.database import engine


def create_indexes():
    """Create idempotent PostgreSQL indexes for common public queries."""
    print("Creating PostgreSQL database indexes for performance optimization...")

    indexes = [
        ("idx_jobs_spa_id", "jobs", "spa_id"),
        ("idx_jobs_city_id", "jobs", "city_id"),
        ("idx_jobs_state_id", "jobs", "state_id"),
        ("idx_jobs_country_id", "jobs", "country_id"),
        ("idx_jobs_area_id", "jobs", "area_id"),
        ("idx_jobs_is_active", "jobs", "is_active"),
        ("idx_jobs_is_featured", "jobs", "is_featured"),
        ("idx_jobs_created_at", "jobs", "created_at"),
        ("idx_jobs_view_count", "jobs", "view_count"),
        ("idx_jobs_slug", "jobs", "slug"),
        ("idx_jobs_job_type_id", "jobs", "job_type_id"),
        ("idx_jobs_job_category_id", "jobs", "job_category_id"),
        ("idx_spas_city_id", "spas", "city_id"),
        ("idx_spas_state_id", "spas", "state_id"),
        ("idx_spas_country_id", "spas", "country_id"),
        ("idx_spas_area_id", "spas", "area_id"),
        ("idx_spas_is_active", "spas", "is_active"),
        ("idx_spas_is_verified", "spas", "is_verified"),
        ("idx_spas_rating", "spas", "rating"),
        ("idx_spas_slug", "spas", "slug"),
        ("idx_spas_created_by", "spas", "created_by"),
        ("idx_users_email", "users", "email"),
        ("idx_users_role", "users", "role"),
        ("idx_users_managed_spa_id", "users", "managed_spa_id"),
        ("idx_applications_job_id", "job_applications", "job_id"),
        ("idx_applications_user_id", "job_applications", "user_id"),
        ("idx_applications_created_at", "job_applications", "created_at"),
        ("idx_messages_job_id", "messages", "job_id"),
        ("idx_messages_spa_id", "messages", "spa_id"),
        ("idx_messages_created_at", "messages", "created_at"),
        ("idx_analytics_event_type", "analytics_events", "event_type"),
        ("idx_analytics_job_id", "analytics_events", "job_id"),
        ("idx_analytics_created_at", "analytics_events", "created_at"),
        ("idx_cities_state_id", "cities", "state_id"),
        ("idx_areas_city_id", "areas", "city_id"),
        ("idx_states_country_id", "states", "country_id"),
    ]

    composite_indexes = [
        ("idx_jobs_active_created_at", "jobs", "is_active, created_at DESC"),
        ("idx_jobs_active_city_category", "jobs", "is_active, city_id, job_category_id"),
        ("idx_jobs_active_area_category", "jobs", "is_active, area_id, job_category_id"),
        ("idx_jobs_active_slug", "jobs", "is_active, slug"),
        ("idx_jobs_active_category_created", "jobs", "is_active, job_category_id, created_at DESC"),
        ("idx_spas_active_city_area", "spas", "is_active, city_id, area_id"),
        ("idx_spas_active_slug", "spas", "is_active, slug"),
    ]

    with engine.connect() as conn:
        for index_name, table_name, column_name in indexes:
            create_index(conn, index_name, table_name, column_name)

        for index_name, table_name, columns in composite_indexes:
            create_index(conn, index_name, table_name, columns)

    print("\nIndex creation completed.")
    print("\nNote: For optimal performance with 1000+ users:")
    print("  1. Enable Redis caching")
    print("  2. Configure connection pooling")
    print("  3. Use a load balancer for multiple servers")
    print("  4. Consider PostGIS for advanced geo queries")


def create_index(conn, index_name: str, table_name: str, columns: str):
    check_sql = text("""
        SELECT 1 FROM pg_indexes
        WHERE indexname = :index_name
    """)
    result = conn.execute(check_sql, {"index_name": index_name})
    if result.fetchone():
        print(f"  Index {index_name} already exists")
        return

    create_sql = text(f"""
        CREATE INDEX IF NOT EXISTS {index_name}
        ON {table_name} ({columns})
    """)
    conn.execute(create_sql)
    conn.commit()
    print(f"  Created index {index_name} on {table_name} ({columns})")


if __name__ == "__main__":
    create_indexes()
