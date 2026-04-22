"""
Configuration management for the application.
"""
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
import os

class Settings(BaseSettings):
    # App Settings
    project_name: str = "Emotion-Aware Intelligent Tutoring System"
    version: str = "1.0.0"
    debug: bool = True
    secret_key: str
    database_url: str
    
    # Emotion Detection
    emotion_confidence_threshold: float = 0.7
    emotion_capture_interval: int = 3
    
    # RL Agent Settings
    learning_rate: float = 0.1
    discount_factor: float = 0.95
    exploration_rate: float = 0.2
    exploration_decay: float = 0.995
    min_exploration_rate: float = 0.01
    q_table_path: str = "./data/rl_model/q_table.npy"
    
    # WebSocket
    ws_heartbeat_interval: int = 30
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

# Create global settings object
settings = Settings()

# ========== FIX: Override database URL for Render free tier ==========
if os.environ.get('RENDER'):
    # Use /tmp directory which is writable on Render free tier
    settings.database_url = "sqlite:////tmp/its.db"
    print(f"✅ Render mode: Using database at {settings.database_url}")
elif settings.database_url.startswith('sqlite:///./'):
    # Local development - ensure directory exists
    db_path = settings.database_url.replace('sqlite:///', '')
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    print(f"✅ Local mode: Using database at {settings.database_url}")

# For debugging - print loaded settings (remove in production)
if settings.debug:
    print(f"✅ Configuration loaded: {settings.project_name} v{settings.version}")
    print(f"📁 Database: {settings.database_url}")
