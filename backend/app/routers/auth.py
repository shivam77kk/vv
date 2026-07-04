"""Auth router — register, login, demo-login, refresh, logout."""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Response, Request, status
from bson import ObjectId

from app.db.client import get_collection
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_current_user,
)
from app.core.config import settings
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_response(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone", ""),
    }


def _set_refresh_cookie(response: Response, token: str):
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/auth",
    )


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, response: Response):
    users = await get_collection("users")
    existing = await users.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    now = datetime.now(timezone.utc)
    user_doc = {
        "name": req.name,
        "email": req.email,
        "phone": req.phone,
        "password_hash": hash_password(req.password),
        "created_at": now,
        "updated_at": now,
    }
    result = await users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token_data = {"sub": str(result.inserted_id), "email": req.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    _set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        user=_user_response(user_doc),
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, response: Response):
    users = await get_collection("users")
    user = await users.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token_data = {"sub": str(user["_id"]), "email": user["email"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    _set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        user=_user_response(user),
    )


@router.post("/demo-login", response_model=TokenResponse)
async def demo_login(response: Response):
    users = await get_collection("users")
    user = await users.find_one({"email": settings.DEMO_USER_EMAIL})
    if not user:
        raise HTTPException(status_code=404, detail="Demo account not found. Run seed.py first.")

    if not verify_password(settings.DEMO_USER_PASSWORD, user["password_hash"]):
        raise HTTPException(status_code=500, detail="Demo account password mismatch")

    token_data = {"sub": str(user["_id"]), "email": user["email"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    _set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        user=_user_response(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_refresh_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    users = await get_collection("users")
    user = await users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    token_data = {"sub": str(user["_id"]), "email": user["email"]}
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)
    _set_refresh_cookie(response, new_refresh)

    return TokenResponse(
        access_token=new_access,
        user=_user_response(user),
    )


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="refresh_token",
        path="/api/auth",
    )
    return {"message": "Logged out"}


@router.get("/me")
async def get_me(request: Request):
    from fastapi import Depends
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    from app.core.security import decode_access_token
    token = auth_header[7:]
    payload = decode_access_token(token)
    user_id = payload.get("sub")

    users = await get_collection("users")
    user = await users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return _user_response(user)
