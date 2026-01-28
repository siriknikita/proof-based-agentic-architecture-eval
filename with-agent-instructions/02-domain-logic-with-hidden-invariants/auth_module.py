"""
Authentication and Authorization Module

This module provides authentication and authorization functionality with:
- User authentication via pluggable strategies
- Role-based access control
- Privilege escalation prevention
- No global state or hidden side effects
"""

from typing import Protocol, TypeVar, Optional, Set, Dict, Tuple
from dataclasses import dataclass

# Type definitions
UserId = str
Role = str
Resource = str
Action = str
Permission = Tuple[Resource, Action]
Credential = TypeVar("Credential")


# Result types
@dataclass(frozen=True)
class AuthenticationResult:
    """Result of an authentication attempt."""

    success: bool
    user_id: Optional[UserId]
    error: Optional[str]


@dataclass(frozen=True)
class AuthorizationResult:
    """Result of an authorization check."""

    allowed: bool
    reason: Optional[str]


# Configuration types
@dataclass(frozen=True)
class RoleHierarchy:
    """Immutable role hierarchy defining inheritance relationships."""

    inheritance_map: Dict[Role, Set[Role]]


@dataclass(frozen=True)
class AccessControlPolicy:
    """Immutable access control policy mapping roles to permissions."""

    role_permissions: Dict[Role, Set[Permission]]


# Strategy protocol
class AuthenticationStrategy(Protocol[Credential]):
    """Protocol for authentication strategies."""

    def verify(self, credential: Credential, user_id: UserId) -> bool:
        """
        Verify that the credential is valid for the given user.

        Args:
            credential: The credential to verify
            user_id: The user identifier

        Returns:
            True if credential is valid, False otherwise
        """
        ...


# Core authentication function
def authenticate(
    credential: Credential,
    user_id: UserId,
    strategy: AuthenticationStrategy[Credential],
) -> AuthenticationResult:
    """
    Authenticate a user using the provided credential and strategy.

    Args:
        credential: The credential to verify
        user_id: The user identifier
        strategy: The authentication strategy to use

    Returns:
        AuthenticationResult with success status and user_id or error
    """
    is_valid = strategy.verify(credential, user_id)
    if is_valid:
        return AuthenticationResult(success=True, user_id=user_id, error=None)
    else:
        return AuthenticationResult(
            success=False, user_id=None, error="Invalid credentials"
        )


# Permission resolution
def resolve_role_permissions(
    role: Role, hierarchy: RoleHierarchy, policy: AccessControlPolicy
) -> Set[Permission]:
    """
    Resolve all permissions for a role, including inherited permissions.

    Args:
        role: The role to resolve permissions for
        hierarchy: The role hierarchy
        policy: The access control policy

    Returns:
        Set of all permissions (direct and inherited) for the role
    """
    direct_permissions = policy.role_permissions.get(role, set())
    inherited_roles = hierarchy.inheritance_map.get(role, set())
    inherited_permissions = set()
    for inherited_role in inherited_roles:
        inherited_permissions.update(
            resolve_role_permissions(inherited_role, hierarchy, policy)
        )
    return direct_permissions | inherited_permissions


# Privilege escalation check
def check_privilege_escalation(
    user_id: UserId,
    requested_role: Role,
    current_roles: Set[Role],
    hierarchy: RoleHierarchy,
    policy: AccessControlPolicy,
) -> bool:
    """
    Check if granting the requested role would constitute privilege escalation.

    Args:
        user_id: The user identifier (for logging/audit purposes)
        requested_role: The role being requested
        current_roles: The user's current roles
        hierarchy: The role hierarchy
        policy: The access control policy

    Returns:
        True if granting the role would escalate privileges, False otherwise
    """
    requested_permissions = resolve_role_permissions(requested_role, hierarchy, policy)
    current_permissions = set()
    for role in current_roles:
        current_permissions.update(resolve_role_permissions(role, hierarchy, policy))
    would_escalate = not requested_permissions.issubset(current_permissions)
    return would_escalate


# Core authorization function
def authorize(
    user_id: UserId,
    role: Role,
    resource: Resource,
    action: Action,
    hierarchy: RoleHierarchy,
    policy: AccessControlPolicy,
) -> AuthorizationResult:
    """
    Authorize an action for a user with a specific role.

    Args:
        user_id: The user identifier (must be authenticated)
        role: The role to check permissions for
        resource: The resource being accessed
        action: The action being performed
        hierarchy: The role hierarchy
        policy: The access control policy

    Returns:
        AuthorizationResult indicating whether the action is allowed
    """
    required_permission = (resource, action)
    role_permissions = resolve_role_permissions(role, hierarchy, policy)
    if required_permission in role_permissions:
        return AuthorizationResult(allowed=True, reason=None)
    else:
        return AuthorizationResult(
            allowed=False,
            reason=f"Role {role} does not have permission for {action} on {resource}",
        )


# Module interface
@dataclass(frozen=True)
class AuthModule:
    """
    Main authentication and authorization module.

    This class encapsulates the configuration (hierarchy and policy) and provides
    the public interface for authentication and authorization operations.
    """

    hierarchy: RoleHierarchy
    policy: AccessControlPolicy

    def authenticate_user(
        self,
        credential: Credential,
        user_id: UserId,
        strategy: AuthenticationStrategy[Credential],
    ) -> AuthenticationResult:
        """
        Authenticate a user.

        Args:
            credential: The credential to verify
            user_id: The user identifier
            strategy: The authentication strategy to use

        Returns:
            AuthenticationResult with success status
        """
        return authenticate(credential, user_id, strategy)

    def authorize_action(
        self, user_id: UserId, role: Role, resource: Resource, action: Action
    ) -> AuthorizationResult:
        """
        Authorize an action for a user.

        Args:
            user_id: The authenticated user identifier
            role: The role to check permissions for
            resource: The resource being accessed
            action: The action being performed

        Returns:
            AuthorizationResult indicating whether the action is allowed
        """
        return authorize(user_id, role, resource, action, self.hierarchy, self.policy)

    def check_escalation(
        self, user_id: UserId, requested_role: Role, current_roles: Set[Role]
    ) -> bool:
        """
        Check if granting a role would constitute privilege escalation.

        Args:
            user_id: The user identifier
            requested_role: The role being requested
            current_roles: The user's current roles

        Returns:
            True if granting the role would escalate privileges, False otherwise
        """
        return check_privilege_escalation(
            user_id, requested_role, current_roles, self.hierarchy, self.policy
        )
