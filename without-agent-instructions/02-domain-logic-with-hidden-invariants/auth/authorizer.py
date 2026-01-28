"""
Authorization module.

Enforces role-based access control and prevents unauthorized access.
All authorization checks are explicit and type-safe.
"""

from dataclasses import dataclass
from typing import Protocol

from auth.authenticator import AuthenticatedUser
from auth.types import Permission, Role


class Authorizer(Protocol):
    """
    Interface for authorization checks.
    
    Contract:
    - All implementations must be stateless (no instance state)
    - All authorization decisions are explicit
    - Returns boolean (never raises exceptions)
    - Requires AuthenticatedUser (cannot authorize unauthenticated users)
    """
    
    def has_permission(self, user: AuthenticatedUser, permission: Permission) -> bool:
        """
        Check if authenticated user has a specific permission.
        
        Contract:
        - user must be AuthenticatedUser (type system enforces this)
        - Returns True if user has permission through any role
        - Returns False otherwise
        - Never raises exceptions
        """
        ...
    
    def has_role(self, user: AuthenticatedUser, role_name: str) -> bool:
        """
        Check if authenticated user has a specific role.
        
        Contract:
        - user must be AuthenticatedUser (type system enforces this)
        - Returns True if user has role with matching name
        - Returns False otherwise
        - Never raises exceptions
        """
        ...


@dataclass(frozen=True)
class RoleBasedAuthorizer:
    """
    Role-based authorization implementation.
    
    Contract:
    - Immutable once created
    - Checks permissions through user roles
    - Supports hierarchical roles (parent roles imply child permissions)
    - All checks are explicit and deterministic
    """
    
    def has_permission(self, user: AuthenticatedUser, permission: Permission) -> bool:
        """
        Check if user has permission through any of their roles.
        
        Contract:
        - user must be AuthenticatedUser (enforced by type system)
        - Checks all user roles for permission
        - Supports hierarchical role checking
        - Returns True if any role has permission
        - Returns False otherwise
        - Never raises exceptions
        """
        for role in user.roles:
            if role.has_permission(permission):
                return True
        return False
    
    def has_role(self, user: AuthenticatedUser, role_name: str) -> bool:
        """
        Check if user has a specific role.
        
        Contract:
        - user must be AuthenticatedUser (enforced by type system)
        - Returns True if user has role with matching name
        - Returns False otherwise
        - Never raises exceptions
        """
        return user.has_role(role_name)


def require_permission(
    user: AuthenticatedUser,
    permission: Permission,
    authorizer: Authorizer
) -> bool:
    """
    Explicit permission check function.
    
    Contract:
    - user must be AuthenticatedUser (enforced by type system)
    - Returns True if user has permission
    - Returns False otherwise
    - Never raises exceptions
    - All security assumptions are explicit through parameters
    """
    return authorizer.has_permission(user, permission)


def require_role(
    user: AuthenticatedUser,
    role_name: str,
    authorizer: Authorizer
) -> bool:
    """
    Explicit role check function.
    
    Contract:
    - user must be AuthenticatedUser (enforced by type system)
    - Returns True if user has role
    - Returns False otherwise
    - Never raises exceptions
    - All security assumptions are explicit through parameters
    """
    return authorizer.has_role(user, role_name)
