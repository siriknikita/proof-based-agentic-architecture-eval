# Authentication and Authorization Module

A type-safe authentication and authorization module for backend systems that prevents unauthorized access by construction.

## Features

- **Type-safe authentication**: Unauthorized access is impossible by construction through the type system
- **Role-based access control**: Flexible role and permission system with hierarchical support
- **Privilege escalation prevention**: Explicit checks prevent users from gaining unauthorized privileges
- **Extensible authentication**: Easy to add new authentication strategies (OAuth, SSO, etc.)
- **No global state**: All dependencies are injected explicitly
- **Explicit contracts**: Every public function has a clear, documented contract

## Installation

This module uses Python 3.10+ with type hints. Install dependencies with:

```bash
uv pip install -e .
```

## Quick Start

```python
from auth import (
    Authenticator,
    PasswordAuthenticator,
    RoleBasedAuthorizer,
    Credentials,
    Username,
    Permission,
)

# Setup (dependency injection - no global state)
repository = YourUserRepository()
authenticator: Authenticator = PasswordAuthenticator(repository)
authorizer = RoleBasedAuthorizer()

# Authenticate
credentials = Credentials(Username("alice"), "password")
result = authenticator.authenticate(credentials)

if result.is_authenticated() and result.authenticated:
    user = result.authenticated
    
    # Check permissions
    can_read = authorizer.has_permission(user, Permission("read"))
    print(f"Can read: {can_read}")
```

See `examples/simple_auth.py` for a complete example.

## Architecture

See `DESIGN.md` for detailed design justification and architecture documentation.

## Module Structure

- `auth/types.py`: Core types (User, Role, Permission)
- `auth/authenticator.py`: Authentication interface and implementations
- `auth/authorizer.py`: Authorization and role-based access control
- `auth/security.py`: Privilege escalation prevention

## Security Guarantees

1. **Unauthorized access prevention**: Type system prevents unauthenticated users from accessing authorization functions
2. **Privilege escalation prevention**: Explicit checks verify role hierarchy before granting permissions
3. **Explicit security assumptions**: All security logic is documented and verifiable

## Extending the Module

### Adding a New Authentication Strategy

Implement the `Authenticator` interface:

```python
class OAuthAuthenticator(Authenticator):
    def authenticate(self, credentials: Credentials) -> AuthenticationResult:
        # Your OAuth validation logic
        ...
```

No changes needed to authorization or security modules.

## Requirements Met

- ✅ Authenticate users
- ✅ Enforce role-based access
- ✅ Prevent privilege escalation
- ✅ Support future authentication strategies
- ✅ No global state
- ✅ No hidden side effects
- ✅ All security assumptions explicit
- ✅ Unauthorized access impossible by construction
- ✅ Every public function has clear contract
