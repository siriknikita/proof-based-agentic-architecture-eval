# Authentication and Authorization Module

A proof-oriented implementation of a user authentication and authorization module for a backend system, following strict mathematical derivation principles.

## Overview

This module provides:

- **Authentication**: User identity verification via pluggable strategies
- **Authorization**: Role-based access control with permission inheritance
- **Privilege Escalation Prevention**: Explicit checks to prevent unauthorized privilege gains
- **Extensibility**: Support for future authentication strategies (OAuth, SSO, etc.)

## Key Features

- ✅ No global state
- ✅ No hidden side effects
- ✅ Explicit security assumptions
- ✅ Unauthorized access impossible by construction
- ✅ Clear function contracts
- ✅ Immutable configuration
- ✅ Pure, deterministic functions

## Files

- `auth_module.py`: Core authentication and authorization module
- `strategies.py`: Example authentication strategy implementations
- `test_auth_module.py`: Comprehensive test suite
- `DESIGN.md`: Complete design documentation following proof-oriented workflow
- `JUSTIFICATION.md`: Structural decisions and their rationale

## Usage Example

```python
from auth_module import AuthModule, RoleHierarchy, AccessControlPolicy
from strategies import PasswordStrategy

# Define role hierarchy
hierarchy = RoleHierarchy(inheritance_map={
    "admin": {"user", "moderator"},
    "moderator": {"user"}
})

# Define access control policy
policy = AccessControlPolicy(role_permissions={
    "user": {("posts", "read")},
    "moderator": {("posts", "read"), ("posts", "moderate")},
    "admin": {("posts", "read"), ("posts", "moderate"), ("posts", "delete")}
})

# Create module instance
module = AuthModule(hierarchy=hierarchy, policy=policy)

# Authenticate user
password_store = {"user1": "password123"}
strategy = PasswordStrategy(password_store)
auth_result = module.authenticate_user("password123", "user1", strategy)

if auth_result.success:
    # Authorize action
    authz_result = module.authorize_action("user1", "admin", "posts", "delete")
    if authz_result.allowed:
        print("Action authorized")
    else:
        print(f"Action denied: {authz_result.reason}")
```

## Running Tests

```bash
python3 test_auth_module.py
```

All tests should pass, verifying:

- Authentication success and failure
- Authorization allowed and denied
- Role inheritance
- Privilege escalation prevention
- Strategy extensibility
- No global state
- Deterministic authorization

## Design Methodology

This implementation follows a strict 8-phase proof-oriented workflow:

1. **Problem Restatement**: Precise, implementation-independent problem definition
2. **Assumptions Declaration**: All assumptions explicitly stated
3. **Definitions**: All entities defined before use
4. **Invariants Specification**: Global truths that must always hold
5. **Structural Derivation**: Executable pseudo-code skeleton (EPS)
6. **Structural Verification**: Verification of structure before implementation
7. **Incremental Implementation**: One unit at a time, following EPS exactly
8. **Final Verification**: Verification of all invariants and requirements

See `DESIGN.md` for complete documentation of each phase.

## Security Guarantees

The module structure ensures:

- Unauthorized access is impossible by construction (type system enforcement)
- Policies and hierarchies are immutable at runtime
- Privilege escalation is explicitly detected and prevented
- All security assumptions are documented and explicit

## Extensibility

New authentication strategies can be added by implementing the `AuthenticationStrategy` protocol:

```python
class MyCustomStrategy:
    def verify(self, credential: str, user_id: str) -> bool:
        # Custom verification logic
        return True
```

No changes to the core module are required.

## License

This is an experimental implementation for evaluation purposes.
