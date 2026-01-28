"""
Authentication and Authorization Module

This module provides type-safe authentication and authorization for backend systems.
All security assumptions are explicit, and unauthorized access is prevented by construction
through the type system.

Public API:
- Authenticator: Interface for authenticating users
- Authorizer: Interface for checking permissions
- AuthenticatedUser: Type representing a successfully authenticated user
- UnauthenticatedUser: Type representing an unauthenticated user
"""

from auth.authenticator import (
    Authenticator,
    AuthenticationResult,
    AuthenticatedUser,
    PasswordAuthenticator,
    TokenAuthenticator,
    UnauthenticatedUser,
)
from auth.authorizer import Authorizer, Permission, Role, RoleBasedAuthorizer
from auth.security import (
    DefaultRoleHierarchy,
    SecurityContext,
    prevent_privilege_escalation,
)
from auth.types import Credentials, UserId, Username

__all__ = [
    "Authenticator",
    "AuthenticationResult",
    "AuthenticatedUser",
    "UnauthenticatedUser",
    "PasswordAuthenticator",
    "TokenAuthenticator",
    "Authorizer",
    "RoleBasedAuthorizer",
    "Permission",
    "Role",
    "SecurityContext",
    "DefaultRoleHierarchy",
    "prevent_privilege_escalation",
    "UserId",
    "Username",
    "Credentials",
]
