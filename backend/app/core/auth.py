import datetime
import logging
from typing import Optional, List, Dict, Any

import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status, Request, WebSocket
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger("auth")

security_scheme = HTTPBearer(auto_error=False)

REQUIRED_ENTRA_SCOPE = "access_as_user"


class InvestigatorUser(BaseModel):
    """Authenticated user / investigator model."""
    id: str = Field(default="inv-dev-01")
    name: str = Field(default="Senior Fraud Investigator")
    email: str = Field(default="investigator@fraudguard.local")
    role: str = Field(default="INVESTIGATOR")
    scopes: List[str] = Field(default_factory=list)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[datetime.timedelta] = None,
) -> str:
    """Create a locally signed JWT for development/testing only."""
    to_encode = data.copy()
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + (
        expires_delta
        or datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({
        "iat": now,
        "exp": expire,
    })

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def _entra_jwks_url() -> str:
    """Microsoft Entra ID OpenID Connect JWKS endpoint."""
    return (
        f"https://login.microsoftonline.com/"
        f"{settings.ENTRA_TENANT_ID}/discovery/v2.0/keys"
    )


def decode_local_token(token: str) -> Dict[str, Any]:
    """Decode a locally generated development JWT."""
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
        options={
            "verify_signature": True,
            "verify_exp": True,
            "verify_aud": False,
            "verify_iss": False,
        },
    )


def decode_entra_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a Microsoft Entra ID access token.

    Validation:
    - Microsoft signing key
    - RS256 signature
    - expiration
    - audience
    - issuer
    - required API scope
    """

    if not settings.ENTRA_TENANT_ID:
        raise ValueError("ENTRA_TENANT_ID is not configured")

    if not settings.ENTRA_AUDIENCE:
        raise ValueError("ENTRA_AUDIENCE is not configured")

    if not settings.ENTRA_ISSUER:
        raise ValueError("ENTRA_ISSUER is not configured")

    jwks_client = PyJWKClient(_entra_jwks_url())

    signing_key = jwks_client.get_signing_key_from_jwt(token)

    payload = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=settings.ENTRA_AUDIENCE,
        issuer=settings.ENTRA_ISSUER,
        options={
            "verify_signature": True,
            "verify_exp": True,
            "verify_aud": True,
            "verify_iss": True,
        },
    )

    # Enforce that this token was actually granted access to
    # the FraudGuard API through our defined delegated scope.
    scope_claim = payload.get("scp", "")
    scopes = scope_claim.split() if scope_claim else []

    if REQUIRED_ENTRA_SCOPE not in scopes:
        raise PermissionError(
            f"Required API scope '{REQUIRED_ENTRA_SCOPE}' is missing"
        )

    return payload


def decode_token(token: str) -> Dict[str, Any]:
    """Decode according to the currently configured authentication mode."""

    if settings.AUTH_ENABLED and not settings.DEV_AUTH_BYPASS:
        return decode_entra_token(token)

    return decode_local_token(token)


def payload_to_investigator(
    payload: Dict[str, Any],
) -> InvestigatorUser:
    """Convert a validated JWT payload into an investigator identity."""

    user_id = (
        payload.get("oid")
        or payload.get("sub")
        or payload.get("uid")
    )

    if not user_id:
        raise ValueError("Token does not contain a valid user identifier")

    name = (
        payload.get("name")
        or payload.get("preferred_username")
        or "Authenticated Investigator"
    )

    email = (
        payload.get("preferred_username")
        or payload.get("email")
        or payload.get("upn")
        or "investigator@fraudguard.cloud"
    )

    roles = payload.get("roles") or []
    role = payload.get("role")

    if not role and roles:
        role = roles[0]

    # Do NOT grant an application role automatically.
    # Entra delegated access uses scopes; application roles can
    # be configured separately when required.
    if not role:
        role = "AUTHENTICATED_USER"

    scope_claim = payload.get("scp", "")
    scopes = scope_claim.split() if scope_claim else []

    # Local development tokens may explicitly provide scopes.
    if not scopes and payload.get("scopes"):
        scopes = payload["scopes"]

    return InvestigatorUser(
        id=str(user_id),
        name=name,
        email=email,
        role=role,
        scopes=scopes,
    )


async def get_current_investigator(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        security_scheme
    ),
) -> InvestigatorUser:
    """
    Authenticate an investigator.

    Production/staging:
        Microsoft Entra ID is mandatory.

    Development:
        X-Dev-User / X-Investigator-Id bypass remains available when
        DEV_AUTH_BYPASS=true.
    """

    token = credentials.credentials if credentials else None

    dev_user_header = (
        request.headers.get("X-Dev-User")
        or request.headers.get("X-Investigator-Id")
    )

    # ---------------------------------------------------------
    # Authenticated token path
    # ---------------------------------------------------------
    if token:
        try:
            payload = decode_token(token)
            return payload_to_investigator(payload)

        except jwt.ExpiredSignatureError:
            if settings.AUTH_ENABLED and not settings.DEV_AUTH_BYPASS:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication token has expired",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            logger.warning(
                "Expired token provided during development; "
                "using development bypass."
            )

        except (jwt.InvalidTokenError, PermissionError, ValueError) as exc:
            if settings.AUTH_ENABLED and not settings.DEV_AUTH_BYPASS:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            logger.warning(
                "Token validation failed during development: %s",
                exc,
            )

        except Exception:
            if settings.AUTH_ENABLED and not settings.DEV_AUTH_BYPASS:
                logger.exception("Authentication validation failed.")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication token validation failed",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            logger.exception(
                "Unexpected authentication error during development."
            )

    # ---------------------------------------------------------
    # Production/staging: authentication is mandatory
    # ---------------------------------------------------------
    if settings.AUTH_ENABLED and not settings.DEV_AUTH_BYPASS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ---------------------------------------------------------
    # Development bypass
    # ---------------------------------------------------------
    investigator_name = dev_user_header or "SIU Senior Investigator"
    investigator_id = (
        f"inv-{investigator_name.lower().replace(' ', '-')}"
    )

    return InvestigatorUser(
        id=investigator_id,
        name=investigator_name,
        email="investigator@fraudguard.local",
        role="INVESTIGATOR",
        scopes=[
            "read",
            "write",
            "investigate",
            "override",
            "decide",
        ],
    )


def require_role(allowed_roles: List[str]):
    """Route dependency factory enforcing investigator roles."""

    async def role_checker(
        user: InvestigatorUser = Depends(get_current_investigator),
    ) -> InvestigatorUser:

        if not settings.AUTH_ENABLED and settings.DEV_AUTH_BYPASS:
            return user

        if (
            user.role not in allowed_roles
            and user.role != "ADMIN"
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"User role '{user.role}' is not authorized "
                    f"for this operation. Allowed: {allowed_roles}"
                ),
            )

        return user

    return role_checker


async def authenticate_websocket(
    websocket: WebSocket,
    token: Optional[str] = None,
) -> Optional[InvestigatorUser]:
    """Validate WebSocket authentication during handshake."""

    if not token:
        token = websocket.query_params.get("token")

    # Development bypass
    if not token and (
        not settings.AUTH_ENABLED or settings.DEV_AUTH_BYPASS
    ):
        return InvestigatorUser()

    if not token:
        await websocket.close(code=1008)
        return None

    try:
        payload = decode_token(token)
        return payload_to_investigator(payload)

    except Exception as exc:
        logger.warning("WebSocket authentication failed: %s", exc)

        if settings.AUTH_ENABLED and not settings.DEV_AUTH_BYPASS:
            await websocket.close(code=1008)
            return None

        return InvestigatorUser()