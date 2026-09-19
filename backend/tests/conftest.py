import pytest_asyncio

from app.main import app
from app.db.session import init_db, engine


@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_test_database():
    await init_db()
    yield
    await engine.dispose()