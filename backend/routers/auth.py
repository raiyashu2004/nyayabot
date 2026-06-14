"""Auth router — registration and login."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from utils.auth import hash_password, verify_password, create_access_token
import uuid

router = APIRouter()

# In-memory store for demo — replace with DB in production
_users: dict = {}


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    bar_number: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest):
    if req.email in _users:
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    _users[req.email] = {
        "id": user_id,
        "name": req.name,
        "email": req.email,
        "password_hash": hash_password(req.password),
        "bar_number": req.bar_number,
    }
    token = create_access_token(user_id, req.email)
    return TokenResponse(
        access_token=token,
        user={"id": user_id, "name": req.name, "email": req.email},
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    user = _users.get(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token(user["id"], req.email)
    return TokenResponse(
        access_token=token,
        user={"id": user["id"], "name": user["name"], "email": req.email},
    )
