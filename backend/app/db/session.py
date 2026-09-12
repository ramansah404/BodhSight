from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Do not crash if DATABASE_URL is None initially. It allows starting in dev mode without DB.
if settings.DATABASE_URL:
    engine = create_engine(
        settings.DATABASE_URL, 
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    engine = None
    SessionLocal = None

Base = declarative_base()

def get_db():
    if not SessionLocal:
        raise RuntimeError("Database is not configured. Set DATABASE_URL.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
