"""
Core types for authentication and authorization.

All types are designed to be immutable and explicit about security properties.
"""

from dataclasses import dataclass
from typing import FrozenSet, NewType

# Type aliases for security-critical identifiers
UserId = NewType("UserId", str)
Username = NewType("Username", str)


@dataclass(frozen=True)
class Credentials:
    """
    User credentials for authentication.
    
    Contract:
    - Immutable once created
    - Contains username and password (or token)
    - Does not expose password in string representation
    """
    username: Username
    password: str  # In production, this would be a hashed password or token
    
    def __repr__(self) -> str:
        """Explicit contract: never expose password in representation."""
        return f"Credentials(username={self.username!r}, password='***')"


@dataclass(frozen=True)
class Role:
    """
    A role that can be assigned to users.
    
    Contract:
    - Immutable once created
    - Has a unique name
    - Contains a set of permissions
    - Roles can be hierarchical (parent role implies child permissions)
    """
    name: str
    permissions: FrozenSet["Permission"]
    parent_role: "Role | None" = None
    
    def has_permission(self, permission: "Permission") -> bool:
        """
        Check if this role has a specific permission.
        
        Contract:
        - Returns True if permission is directly in this role
        - Returns True if permission is in any parent role (hierarchical check)
        - Returns False otherwise
        """
        if permission in self.permissions:
            return True
        if self.parent_role is not None:
            return self.parent_role.has_permission(permission)
        return False


@dataclass(frozen=True)
class Permission:
    """
    A permission that can be granted to roles.
    
    Contract:
    - Immutable once created
    - Has a unique name
    - Represents a specific action or resource access
    """
    name: str
    
    def __hash__(self) -> int:
        return hash(self.name)
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Permission):
            return False
        return self.name == other.name
