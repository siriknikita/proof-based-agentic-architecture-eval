# Authentication and Authorization Module

A proof-oriented implementation of a user authentication and authorization module for backend systems.

## Features

- ✅ User authentication with pluggable strategies
- ✅ Role-based access control (RBAC)
- ✅ Privilege escalation prevention by construction
- ✅ Support for multiple authentication strategies (OAuth, SSO, password, etc.)
- ✅ No global state
- ✅ No hidden side effects
- ✅ Explicit security assumptions
- ✅ Unauthorized access prevention by construction

## Structure

```
src/
  auth.ts          # Core module implementation
DESIGN.md          # Complete design documentation (8 phases)
JUSTIFICATION.md   # Structural justification
PATTERNS.md        # Design patterns used in the implementation
TASK.md            # Original requirements
AGENTS.md          # Proof-oriented workflow rules
```

## Quick Start

```typescript
import {
  authenticate,
  authorize,
  checkAccess,
  createUserId,
  createRole,
  createPermission,
  createAuthToken,
  type AuthStrategy,
  type UserRepository,
  type RoleRepository,
  type TokenValidator,
} from "./src/auth.js";

// Define your repositories
const userRepository: UserRepository = (userId) => {
  // Your implementation
  return { id: userId, roles: [createRole("user")] };
};

const roleRepository: RoleRepository = (role) => {
  // Your implementation
  return { role, permissions: [createPermission("read")] };
};

// Define authentication strategy
const passwordStrategy: AuthStrategy = (credential) => {
  // Your implementation
  return {
    kind: "success",
    userId: createUserId("user1"),
    token: createAuthToken("token123"),
  };
};

// Authenticate
const authResult = authenticate(credential, passwordStrategy, userRepository);

// Authorize
if (authResult.kind === "success") {
  const authzResult = authorize(
    authResult.userId,
    createPermission("read"),
    userRepository,
    roleRepository,
  );
}

// Check access with token
const accessResult = checkAccess(
  createAuthToken("token123"),
  createPermission("read"),
  (token) => createUserId("user1"), // tokenValidator
  userRepository,
  roleRepository,
);
```

## Design Philosophy

This module follows a **proof-oriented programming discipline**:

1. **Problem Restatement**: Precise, implementation-independent requirements
2. **Assumptions Declaration**: All assumptions explicitly stated
3. **Definitions**: All entities defined before use
4. **Invariants Specification**: Global truths that must always hold
5. **Structural Derivation**: Executable pseudo-code skeleton (EPS)
6. **Structural Verification**: Verification against invariants
7. **Incremental Implementation**: One unit at a time
8. **Final Verification**: Complete invariant and assumption verification

See `DESIGN.md` for the complete design documentation.

## Security Guarantees

### By Construction

- **Unauthorized Access Prevention**: Type system requires authentication before authorization
- **Privilege Escalation Prevention**: No operation can increase user permissions
- **Explicit Security**: All security assumptions documented and explicit

### Invariants

17 invariants are enforced, including:

- Authentication precedes authorization
- No privilege escalation
- Immutable user roles
- Deterministic operations
- Explicit error handling
- Type safety

See `DESIGN.md` Phase 4 for complete invariant specification.

## Type Safety

The module uses branded types to prevent type confusion:

- `UserId`: Branded string for user identifiers
- `Role`: Branded string for role names
- `Permission`: Branded string for permission names
- `AuthToken`: Branded string for authentication tokens

This prevents accidental misuse (e.g., using a role where a user ID is expected).

## Extensibility

The module supports extension without modification:

- **New Authentication Strategies**: Implement `AuthStrategy` function
- **New Storage Backends**: Implement `UserRepository` and `RoleRepository` functions
- **Role Hierarchies**: Implement in `RoleRepository`
- **Token Types**: Extend `TokenValidator` function

## Development

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Build
npm run build
```

## Documentation

- `DESIGN.md`: Complete 8-phase design documentation
- `JUSTIFICATION.md`: Structural decisions and their justifications
- `PATTERNS.md`: All design patterns used in the implementation (10 patterns)
- `TASK.md`: Original requirements
- `AGENTS.md`: Proof-oriented workflow rules

## License

This is an experimental implementation following proof-oriented programming principles.
