from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str = ""
    database_url: str = "postgresql://juris@127.0.0.1:5432/juris"
    jwt_secret: str = "juris-secret-key-123"
    indiankanoon_api_key: str = ""

    model_config = {"extra": "ignore", "env_file": ".env"}

settings = Settings()
