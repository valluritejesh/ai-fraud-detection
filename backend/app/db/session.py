import logging
from typing import AsyncGenerator, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from app.core.config import settings

logger = logging.getLogger("db.session")

def get_normalized_database_url(url: str) -> str:
    """Normalize database URL for async drivers (e.g. asyncpg for PostgreSQL)."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

db_url = get_normalized_database_url(settings.DATABASE_URL)

engine_kwargs: Dict[str, Any] = {
    "echo": False,
}

if "sqlite" in db_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production Cloud Database (Azure PostgreSQL / Azure SQL)
    engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_pre_ping": True,
        "pool_recycle": 1800,
    })

engine = create_async_engine(db_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
