import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Apollo Clinic Basaveshwar Nagar Platform"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/apollo_clinic"
    )
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "apollo-secret-key-production-change-me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Clinic Branch Meta
    BRANCH_NAME: str = "Apollo Clinic - Basaveshwar Nagar, Bengaluru"
    CLINIC_COORDINATES_LAT: float = 12.9984645
    CLINIC_COORDINATES_LNG: float = 77.5422482
    MAPS_URL: str = "https://maps.app.goo.gl/HcpzfH1EoQcpGXR97"
    HELPLINE_PHONE: str = "1860-500-7788"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "*"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
