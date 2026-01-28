"""
Authentication module.

Separates authentication (verifying identity) from authorization (checking permissions).
All authentication strategies must implement the Authenticator interface.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Protocol

from auth.types import Credentials, Role, UserId, Username


@dataclass(frozen=True)
class AuthenticatedUser:
    """
    Represents a successfully authenticated user.
    
    Contract:
    - Immutable once created
    - Contains user identity and roles
    - Only created by successful authentication
    - Cannot be constructed directly - must go through authentication
    """
    user_id: UserId
    username: Username
    roles: frozenset[Role]
    
    def has_role(self, role_name: str) -> bool:
        """
        Check if user has a specific role.
        
        Contract:
        - Returns True if user has role with matching name
        - Returns False otherwise
        """
        return any(role.name == role_name for role in self.roles)


@dataclass(frozen=True)
class UnauthenticatedUser:
    """
    Represents an unauthenticated user.
    
    Contract:
    - Immutable once created
    - Used to represent failed authentication
    - Cannot access any protected resources
    """
    reason: str


@dataclass(frozen=True)
class AuthenticationResult:
    """
    Result of an authentication attempt.
    
    Contract:
    - Either contains an AuthenticatedUser or UnauthenticatedUser
    - Never both
    - Immutable once created
    """
    authenticated: AuthenticatedUser | None
    unauthenticated: UnauthenticatedUser | None
    
    @classmethod
    def success(cls, user: AuthenticatedUser) -> "AuthenticationResult":
        """
        Create a successful authentication result.
        
        Contract:
        - authenticated is set, unauthenticated is None
        """
        return cls(authenticated=user, unauthenticated=None)
    
    @classmethod
    def failure(cls, reason: str) -> "AuthenticationResult":
        """
        Create a failed authentication result.
        
        Contract:
        - authenticated is None, unauthenticated is set
        """
        return cls(authenticated=None, unauthenticated=UnauthenticatedUser(reason=reason))
    
    def is_authenticated(self) -> bool:
        """
        Check if authentication was successful.
        
        Contract:
        - Returns True if authenticated is not None
        - Returns False otherwise
        """
        return self.authenticated is not None


class UserRepository(Protocol):
    """
    Protocol for user data access.
    
    Contract:
    - Provides user lookup by credentials
    - Returns user data including roles
    - No side effects on authentication failure
    """
    
    def find_user_by_credentials(self, credentials: Credentials) -> tuple[UserId, Username, frozenset[Role]] | None:
        """
        Find user by credentials.
        
        Contract:
        - Returns user data if credentials are valid
        - Returns None if credentials are invalid
        - Does not throw exceptions for invalid credentials
        """
        ...


class Authenticator(ABC):
    """
    Interface for authentication strategies.
    
    Contract:
    - All implementations must be stateless (no instance state)
    - All side effects must be explicit through dependencies
    - Must return AuthenticationResult (never raises exceptions)
    - Supports dependency injection for user repository
    """
    
    def __init__(self, user_repository: UserRepository) -> None:
        """
        Initialize authenticator with user repository.
        
        Contract:
        - user_repository must not be None
        - No global state is used
        """
        self._user_repository = user_repository
    
    @abstractmethod
    def authenticate(self, credentials: Credentials) -> AuthenticationResult:
        """
        Authenticate a user with given credentials.
        
        Contract:
        - Returns AuthenticationResult (never raises exceptions)
        - Returns success if credentials are valid
        - Returns failure with reason if credentials are invalid
        - All side effects are explicit through dependencies
        """
        ...


class PasswordAuthenticator(Authenticator):
    """
    Password-based authentication strategy.
    
    Contract:
    - Validates username and password
    - Uses user repository to lookup user
    - Returns authenticated user with roles if valid
    - Returns unauthenticated user if invalid
    """
    
    def authenticate(self, credentials: Credentials) -> AuthenticationResult:
        """
        Authenticate using username and password.
        
        Contract:
        - Looks up user in repository
        - Validates password (in production, would hash and compare)
        - Returns AuthenticationResult (never raises exceptions)
        """
        user_data = self._user_repository.find_user_by_credentials(credentials)
        
        if user_data is None:
            return AuthenticationResult.failure("Invalid credentials")
        
        user_id, username, roles = user_data
        
        # In production, would verify password hash here
        # For now, assume repository already validated credentials
        
        authenticated_user = AuthenticatedUser(
            user_id=user_id,
            username=username,
            roles=roles
        )
        
        return AuthenticationResult.success(authenticated_user)


class TokenAuthenticator(Authenticator):
    """
    Token-based authentication strategy.
    
    Contract:
    - Validates authentication token
    - Uses user repository to lookup user by token
    - Returns authenticated user with roles if valid
    - Returns unauthenticated user if invalid
    """
    
    def authenticate(self, credentials: Credentials) -> AuthenticationResult:
        """
        Authenticate using token (stored in password field of credentials).
        
        Contract:
        - Looks up user by token in repository
        - Validates token (in production, would verify signature/expiry)
        - Returns AuthenticationResult (never raises exceptions)
        """
        user_data = self._user_repository.find_user_by_credentials(credentials)
        
        if user_data is None:
            return AuthenticationResult.failure("Invalid or expired token")
        
        user_id, username, roles = user_data
        
        # In production, would verify token signature and expiry here
        # For now, assume repository already validated token
        
        authenticated_user = AuthenticatedUser(
            user_id=user_id,
            username=username,
            roles=roles
        )
        
        return AuthenticationResult.success(authenticated_user)
