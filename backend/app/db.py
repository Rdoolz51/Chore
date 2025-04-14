from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

print("USING DB FILE:", os.path.abspath("./chores.db"))
DATABASE_URL = "sqlite:///./chores.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
