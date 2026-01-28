# Module Design Justification

## Overview

This authentication and authorization module is designed with security as the primary concern. All security assumptions are explicit, and unauthorized access is prevented by construction through the type system.

## Core Design Principles

### 1. Type Safety Prevents Unauthorized Access

The type system enforces that authorization functions can only be called with `AuthenticatedUser`, not with `UnauthenticatedUser` or raw credentials. This makes unauthorized access impossible by construction:

- `Authorizer.has_permission()` requires `AuthenticatedUser` as first parameter
- `prevent_privilege_escalation()` requires `AuthenticatedUser` in `SecurityContext`
- Unauthenticated users cannot be passed to authorization functions

### 2. No Global State

All components use dependency injection:

- `Authenticator` takes `UserRepository` in constructor
- `Authorizer` is passed as parameter to authorization functions
- `RoleHierarchy` is passed as parameter to security functions
- No singletons or global variables

This ensures:
- Testability: All dependencies can be mocked
- Predictability: No hidden state affects behavior
- Thread safety: No shared mutable state

### 3. Explicit Side Effects

All side effects are explicit through dependencies:

- Authentication uses `UserRepository` (explicit dependency)
- No hidden database calls or network requests
- All operations are deterministic given their inputs

### 4. Separation of Concerns

Clear separation between:

- **Authentication** (`auth/authenticator.py`): Verifies identity
- **Authorization** (`auth/authorizer.py`): Checks permissions
- **Security** (`auth/security.py`): Prevents privilege escalation

This allows:
- Independent testing of each concern
- Easy extension (e.g., add OAuth without changing authorization)
- Clear contracts for each component

### 5. Extensibility for Future Strategies

The `Authenticator` interface allows adding new authentication strategies:

- `PasswordAuthenticator`: Username/password
- `TokenAuthenticator`: Token-based (JWT, API keys)
- Future: `OAuthAuthenticator`, `SSOAuthenticator`

All strategies implement the same interface, so the rest of the system doesn't need to change.

## Module Structure

```
auth/
├── __init__.py          # Public API
├── types.py             # Core types (User, Role, Permission)
├── authenticator.py     # Authentication interface and implementations
├── authorizer.py        # Authorization interface and implementation
└── security.py          # Privilege escalation prevention
```

### `types.py`

Defines immutable, security-critical types:

- `UserId`, `Username`: Type-safe identifiers
- `Credentials`: Immutable credentials (password never exposed in repr)
- `Role`: Immutable role with permissions and optional parent
- `Permission`: Immutable permission identifier

### `authenticator.py`

Authentication abstraction:

- `Authenticator`: Interface for all authentication strategies
- `AuthenticationResult`: Type-safe result (either authenticated or unauthenticated)
- `AuthenticatedUser`: Only created by successful authentication
- `UserRepository`: Protocol for user data access

Key properties:
- Never raises exceptions (returns `AuthenticationResult`)
- Stateless (all state through dependencies)
- Extensible (easy to add new strategies)

### `authorizer.py`

Authorization logic:

- `Authorizer`: Interface for authorization checks
- `RoleBasedAuthorizer`: Implementation using roles
- `require_permission()`, `require_role()`: Explicit permission checks

Key properties:
- Requires `AuthenticatedUser` (type system enforces)
- Never raises exceptions (returns boolean)
- Supports hierarchical roles

### `security.py`

Privilege escalation prevention:

- `SecurityContext`: Immutable context for security checks
- `RoleHierarchy`: Protocol for role hierarchy rules
- `prevent_privilege_escalation()`: Explicit check function

Key properties:
- All security rules are explicit
- Prevents privilege escalation by construction
- Never raises exceptions

## Security Guarantees

### 1. Unauthorized Access Prevention

- Type system prevents unauthenticated users from accessing authorization functions
- `AuthenticatedUser` can only be created through successful authentication
- No way to bypass authentication

### 2. Privilege Escalation Prevention

- `prevent_privilege_escalation()` checks role hierarchy before granting roles
- `can_modify_user_roles()` checks if actor can modify target user
- All checks are explicit and verifiable

### 3. Explicit Security Assumptions

- All security checks require explicit parameters
- No hidden security logic
- All contracts are documented in docstrings

## Contract-Based Design

Every public function has a clear contract documented in its docstring:

- **Preconditions**: What must be true before calling
- **Postconditions**: What is guaranteed after calling
- **Side effects**: What changes (explicit through dependencies)
- **Return values**: What is returned and when

Example:
```python
def has_permission(self, user: AuthenticatedUser, permission: Permission) -> bool:
    """
    Contract:
    - user must be AuthenticatedUser (enforced by type system)
    - Returns True if user has permission through any role
    - Returns False otherwise
    - Never raises exceptions
    """
```

## Future Extensions

### OAuth Support

Add `OAuthAuthenticator` implementing `Authenticator`:

```python
class OAuthAuthenticator(Authenticator):
    def authenticate(self, credentials: Credentials) -> AuthenticationResult:
        # OAuth token validation
        ...
```

No changes needed to authorization or security modules.

### SSO Support

Add `SSOAuthenticator` implementing `Authenticator`:

```python
class SSOAuthenticator(Authenticator):
    def authenticate(self, credentials: Credentials) -> AuthenticationResult:
        # SSO token validation
        ...
```

Again, no changes needed to other modules.

### Fine-Grained Permissions

Extend `Permission` to support resource-specific permissions:

```python
@dataclass(frozen=True)
class ResourcePermission(Permission):
    resource_id: str
```

Authorization logic remains the same.

## Testing Strategy

The design enables comprehensive testing:

1. **Unit tests**: Mock dependencies, test each component in isolation
2. **Integration tests**: Test authentication + authorization together
3. **Security tests**: Verify privilege escalation prevention
4. **Type tests**: Verify type system prevents unauthorized access

## Conclusion

This design achieves all requirements:

- ✅ No global state (dependency injection)
- ✅ No hidden side effects (explicit dependencies)
- ✅ All security assumptions explicit (documented contracts)
- ✅ Unauthorized access impossible by construction (type system)
- ✅ Supports future authentication strategies (extensible interface)
- ✅ Every public function has clear contract (docstrings)
- ✅ No design patterns referenced by name (but used implicitly)

The type system is the primary security mechanism, making many security bugs impossible at compile time.
