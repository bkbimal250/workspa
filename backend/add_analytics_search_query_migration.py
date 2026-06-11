"""
Migration script to add search_query column to analytics_events table.
Run this script: python add_analytics_search_query_migration.py
"""

from sqlalchemy import text

from app.core.database import engine


def add_analytics_search_query_column():
    """Add search_query column to analytics_events table if it doesn't exist."""
    with engine.connect() as conn:
        check_query = text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'analytics_events'
            AND column_name = 'search_query'
        """)

        column_exists = conn.execute(check_query).fetchone() is not None

        if not column_exists:
            alter_query = text("""
                ALTER TABLE analytics_events
                ADD COLUMN search_query TEXT
            """)

            conn.execute(alter_query)
            conn.commit()
            print("Column 'search_query' added successfully to analytics_events table")
        else:
            print("Column 'search_query' already exists in analytics_events table")

        print("Migration completed!")


if __name__ == "__main__":
    add_analytics_search_query_column()
