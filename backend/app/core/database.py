from typing import AsyncGenerator
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# PostgreSQL is the target production database. SQLite remains as a permissive local fallback
# when DATABASE_URL is not configured, which keeps the project runnable in development.
connect_args = {}
if "sqlite" in settings.effective_database_url:
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    settings.effective_database_url,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def ensure_sqlite_schema_compatibility() -> None:
    """Upgrade older local SQLite databases with newer auth/security columns."""
    if "sqlite" not in settings.effective_database_url:
        return

    async with engine.connect() as conn:
        table_exists = await conn.run_sync(lambda sync_conn: inspect(sync_conn).has_table("users"))
        if not table_exists:
            return

        existing_columns = await conn.run_sync(
            lambda sync_conn: {column["name"] for column in inspect(sync_conn).get_columns("users")}
        )

        column_defs = [
            ("two_factor_enabled", "BOOLEAN", "0"),
            ("login_alerts_enabled", "BOOLEAN", "1"),
            (
                "notification_preferences",
                "TEXT",
                "'{\"request_updates\": true, \"messages\": true, \"session_updates\": true, \"reviews\": true, \"platform_updates\": true}'",
            ),
        ]

        for column_name, column_type, default_value in column_defs:
            if column_name in existing_columns:
                continue
            sql = f"ALTER TABLE users ADD COLUMN {column_name} {column_type} DEFAULT {default_value}"
            await conn.execute(text(sql))

        await conn.commit()


async def init_db():
    """Create tables on startup if they do not exist, then upgrade legacy SQLite schemas."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await ensure_sqlite_schema_compatibility()
