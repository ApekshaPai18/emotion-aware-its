"""
Database models using SQLAlchemy ORM.
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

from ..utils.config import settings

# ========== FIX: Create database directory if it doesn't exist ==========
def get_engine():
    """Create engine with proper directory creation for SQLite"""
    db_url = settings.database_url
    
    # For SQLite databases, ensure the directory exists
    if db_url.startswith('sqlite:///'):
        # Extract the file path
        db_path = db_url.replace('sqlite:///', '')
        
        # Get directory path
        db_dir = os.path.dirname(db_path)
        
        # Create directory if it doesn't exist
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
            print(f"✅ Database directory created/verified: {db_dir}")
        
        # Create engine with SQLite specific settings
        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )
    else:
        # For PostgreSQL or other databases
        engine = create_engine(db_url)
    
    return engine

# Create engine using the function
engine = get_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="user")  # "user" or "admin"
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sessions = relationship("LearningSession", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")

class LearningSession(Base):
    __tablename__ = "learning_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic = Column(String, default="python_basics")
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    total_attempts = Column(Integer, default=0)  # Track total attempts
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    interactions = relationship("UserInteraction", back_populates="session", cascade="all, delete-orphan")

class UserInteraction(Base):
    __tablename__ = "user_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(Integer, ForeignKey("learning_sessions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    current_lesson_id = Column(String)
    question_id = Column(String, nullable=True)
    
    is_correct = Column(Boolean, nullable=True)
    attempts = Column(Integer, default=1)  # Track attempts per question
    streak = Column(Integer, default=0)
    repetition_count = Column(Integer, default=0)
    
    detected_emotion = Column(String)
    emotion_confidence = Column(Float)
    
    rl_action = Column(String)
    rl_state = Column(JSON, default={})
    
    # Relationships
    user = relationship("User", backref="interactions")
    session = relationship("LearningSession", back_populates="interactions")

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    achievement_type = Column(String)
    achieved_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="achievements")

class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    total_score = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)
    total_sessions = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="leaderboard_entry")

class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(String, primary_key=True)
    title = Column(String)
    content = Column(Text)
    topic = Column(String)
    difficulty = Column(Integer)
    order_index = Column(Integer)

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(String, primary_key=True)
    lesson_id = Column(String, ForeignKey("lessons.id"))
    question_text = Column(String)
    options = Column(JSON)
    correct_answer = Column(String)
    hint = Column(String)
    difficulty = Column(Integer)
    topic = Column(String)
    
    # Relationship
    lesson = relationship("Lesson")

def init_db():
    """Initialize database - create tables and default data"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created/verified")
        
        # Create default admin user if not exists
        from sqlalchemy.orm import Session
        db = SessionLocal()
        
        try:
            # Create admin user
            admin = db.query(User).filter(User.username == "admin").first()
            if not admin:
                admin = User(
                    username="admin",
                    email="admin@example.com",
                    role="admin"
                )
                db.add(admin)
                db.commit()
                print("✅ Default admin user created (username: admin, email: admin@example.com)")
            
            # Create leaderboard entries for all existing users
            users = db.query(User).all()
            for user in users:
                entry = db.query(LeaderboardEntry).filter(LeaderboardEntry.user_id == user.id).first()
                if not entry:
                    entry = LeaderboardEntry(user_id=user.id)
                    db.add(entry)
            
            db.commit()
            print("✅ Leaderboard entries created for all users")
            
        except Exception as e:
            db.rollback()
            print(f"⚠️ Error creating default data: {e}")
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
