import datetime
import logging
from typing import Optional, List, Dict, Any
from fastapi import Depends, HTTPException, status, Request, WebSocket
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import jwt

from app.core.config import settings

logger = logging.getLogger("auth")

security_scheme = HTTPBearer(auto_error=False)

class InvestigatorUser(BaseModel):
    """Authenticated user / investigator model."""
    id: str = Field(default="inv-dev-01")
    name: str = Field(default="Senior Fraud Investigator")
    email: str = Field(default="investigator@fraudguard.local")
    role: str = Field(default="INVESTIGATOR")
    scopes: List[str] = Field(default_factory=lambda: ["read", "write", "investigate", "override", "decide"])


def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Creates a signed JWT token."""
    to_encode = data.copy()
    now = datetime.datetime.utcnow()
    expire = now + (expires_delta or datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"iat": now, "exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token."""
    options = {"verify_exp": True}
    if not settings.ENTRA_AUDIENCE:
        options["verify_aud"] = False
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
        options=options,
        audience=settings.ENTRA_AUDIENCE if settings.ENTRA_AUDIENCE else None
    )


async def get_current_investigator(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> InvestigatorUser:
    """
    FastAPI dependency for authenticating investigators.
    Supports JWT Bearer tokens and seamless development mode bypass.
    """
    # 1. Check if token was provided in header
    token = credentials.credentials if credentials else None

    # Support X-Dev-User or X-Investigator-Id headers in dev bypass mode
    dev_user_header = request.headers.get("X-Dev-User") or request.headers.get("X-Investigator-Id")

    if token:
        try:
            payload = decode_token(token)
            user_id = payload.get("sub") or payload.get("oid") or payload.get("uid") or "inv-jwt"
            name = payload.get("name") or payload.get("preferred_username") or "Authenticated Investigator"
            email = payload.get("email") or payload.get("upn") or "investigator@fraudguard.cloud"
            role = payload.get("role") or (payload.get("roles", ["INVESTIGATOR"])[0] if payload.get("roles") else "INVESTIGATOR")
            scopes = payload.get("scopes") or payload.get("scp", "").split() or ["read", "write", "investigate", "override", "decide"]

            return InvestigatorUser(
                id=user_id,
                name=name,
                email=email,
                role=role,
                scopes=scopes
            )
        except jwt.ExpiredSignatureError:
            if settings.AUTH_ENABLED and not settings.DEV_AUTH_BYPASS:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication token has expired",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            logger.warning("Expired token provided, falling back to dev investigator bypass.")
        except jwt.PyJWTError as e:
            if settings.AUTH_ENABLED and not settings.DEV_AUTH_BYPASS:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid authentication token: {str(e)}",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            logger.warning(f"Invalid token provided ({e}), falling back to dev investigator bypass.")

    # 2. If token is missing, enforce auth or allow dev bypass
    if settings.AUTH_ENABLED and not settings.DEV_AUTH_BYPASS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 3. Development Mode / Bypass active
    investigator_name = dev_user_header or "SIU Senior Investigator"
    investigator_id = f"inv-{investigator_name.lower().replace(' ', '-')}"
    return InvestigatorUser(
        id=investigator_id,
        name=investigator_name,
        email="investigator@fraudguard.local",
        role="INVESTIGATOR",
        scopes=["read", "write", "investigate", "override", "decide"]
    )


def require_role(allowed_roles: List[str]):
    """Route dependency factory enforcing specific investigator roles."""
    async def role_checker(user: InvestigatorUser = Depends(get_current_investigator)) -> InvestigatorUser:
        if not settings.AUTH_ENABLED and settings.DEV_AUTH_BYPASS:
            return user
        if user.role not in allowed_roles and "ADMIN" not in user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{user.role}' is not authorized for this operation. Allowed: {allowed_roles}"
            )
        return user
    return role_checker


async def authenticate_websocket(
    websocket: WebSocket,
    token: Optional[str] = None
) -> Optional[InvestigatorUser]:
    """Validates WebSocket authentication during connection handshake."""
    if not token:
        # Check query parameters
        token = websocket.query_params.get("token")

    if not token and not settings.AUTH_ENABLED:
        return InvestigatorUser()

    if not token and settings.DEV_AUTH_BYPASS:
        return InvestigatorUser()

    if not token:
        await websocket.close(code=1008)  # Policy violation
        return None

    try:
        payload = decode_token(token)
        return InvestigatorUser(
            id=payload.get("sub", "inv-ws"),
            name=payload.get("name", "WebSocket Investigator"),
            email=payload.get("email", "ws@fraudguard.local"),
            role=payload.get("role", "INVESTIGATOR")
        )
    except Exception as e:
        logger.warning(f"WebSocket auth failed: {e}")
        if settings.AUTH_ENABLED and not settings.DEV_AUTH_BYPASS:
            await websocket.close(code=1008)
            return None
        return InvestigatorUser()
