# Justification of Structure

## Overview

This document justifies the structural decisions made in the authentication and authorization module. Each decision is derived from the requirements and invariants, not from arbitrary design choices.

## Core Structural Decisions

### 1. Branded Types for Security

**Decision**: Use branded types (`UserId`, `Role`, `Permission`, `AuthToken`) instead of plain strings.

**Justification**:

- **Invariant I11 (Type Safety)**: The type system must prevent mixing different identity types
- **Requirement**: "Unauthorized access must be impossible by construction"
- **Consequence**: TypeScript will reject code that attempts to use a `Role` where a `UserId` is expected, or vice versa. This prevents accidental privilege escalation through type confusion.

**Example of Protection**:

```typescript
// This is impossible:
const userId: UserId = someRole; // Type error!
```

### 2. Pure Functions with Explicit Dependencies

**Decision**: All functions are pure (no side effects) and all dependencies are explicit parameters.

**Justification**:

- **Requirement**: "No global state" and "No hidden side effects"
- **Invariant I7 (No Global State)**: All state must be explicit
- **Invariant I8 (Explicit Dependencies)**: No hidden dependencies
- **Consequence**:
  - Functions are testable in isolation
  - Dependencies are visible in function signatures
  - No hidden state can cause security vulnerabilities
  - Functions are deterministic and predictable

**Example**:

```typescript
// Dependencies are explicit:
function authorize(
  userId: UserId,
  requiredPermission: Permission,
  userRepository: UserRepository, // Explicit
  roleRepository: RoleRepository, // Explicit
): AuthzResult;
```

### 3. Separation of Authentication and Authorization

**Decision**: `authenticate` and `authorize` are separate functions, and `checkAccess` composes them.

**Justification**:

- **Invariant I1 (Authentication Precedes Authorization)**: Authorization requires authentication
- **Requirement**: "Support future authentication strategies"
- **Invariant I15 (Authentication Strategy Independence)**: Authorization logic must be independent of authentication method
- **Consequence**:
  - Different authentication strategies (password, OAuth, SSO) can be plugged in without changing authorization logic
  - The structure enforces that authentication happens before authorization
  - Clear separation of concerns

**Structure**:

```
authenticate(credential, strategy) → AuthResult
authorize(userId, permission, ...) → AuthzResult
checkAccess(token, permission, ...) → AuthzResult
  └─> tokenValidator(token) → userId
  └─> authorize(userId, permission, ...)
```

### 4. Result Types Instead of Exceptions

**Decision**: Use `AuthResult` and `AuthzResult` discriminated unions instead of throwing exceptions.

**Justification**:

- **Invariant I9 (Total Functions)**: All functions must handle all cases
- **Invariant I17 (Error Propagation)**: Errors must be explicit
- **Requirement**: "All security assumptions must be explicit"
- **Consequence**:
  - All error cases are visible in the type system
  - Callers must explicitly handle failures
  - No silent failures that could lead to security vulnerabilities
  - Errors are part of the function contract

**Example**:

```typescript
// Caller must handle both cases:
const result = authorize(userId, permission, ...);
if (result.kind === 'denied') {
  // Explicit error handling
}
```

### 5. Repository Abstractions

**Decision**: Use function types (`UserRepository`, `RoleRepository`) instead of classes or interfaces with methods.

**Justification**:

- **Invariant I16 (Repository Purity)**: Repositories are pure functions
- **Requirement**: "No hidden side effects"
- **Consequence**:
  - Repositories are simple functions, easy to test and mock
  - No hidden state in repository objects
  - Clear contract: input → output
  - Supports dependency injection naturally

**Structure**:

```typescript
type UserRepository = (userId: UserId) => User | null;
// Simple, pure, testable
```

### 6. Permission Collection Strategy

**Decision**: `collectUserPermissions` aggregates permissions from all user roles by querying the role repository.

**Justification**:

- **Requirement**: "Enforce role-based access"
- **Invariant I2 (No Privilege Escalation)**: Permissions come only from assigned roles
- **Consequence**:
  - Permissions are computed from roles, not stored
  - No way to add permissions without adding roles
  - Role changes automatically affect permissions
  - Supports role hierarchies (if implemented in `RoleRepository`)

**Flow**:

```
User.roles → [Role]
  └─> roleRepository(role) → RolePermissions
  └─> collect all permissions
  └─> checkPermission(userPermissions, required)
```

### 7. Immutable Data Structures

**Decision**: All types use `readonly` properties.

**Justification**:

- **Invariant I3 (Immutable User Roles)**: Roles cannot be modified
- **Invariant I2 (No Privilege Escalation)**: No operation can increase permissions
- **Consequence**:
  - Type system prevents accidental mutations
  - Clear intent: data is immutable
  - Prevents privilege escalation through mutation
  - Supports functional programming patterns

### 8. No Privilege Escalation by Construction

**Decision**: No function accepts a `User` and returns a modified `User` with different permissions.

**Justification**:

- **Requirement**: "Prevent privilege escalation"
- **Invariant I2 (No Privilege Escalation)**: Must be enforced by construction
- **Consequence**:
  - The structure makes privilege escalation impossible
  - No operation exists that could increase permissions
  - Permissions are computed, not modified
  - Type system enforces this constraint

## Architectural Patterns (Emergent, Not Named)

The structure naturally exhibits several patterns, but these are **consequences**, not goals:

1. **Strategy Pattern** (emergent): `AuthStrategy` allows plugging in different authentication methods
2. **Repository Pattern** (emergent): `UserRepository` and `RoleRepository` abstract data access
3. **Result/Either Pattern** (emergent): `AuthResult` and `AuthzResult` represent success/failure explicitly
4. **Dependency Injection** (emergent): All dependencies are passed as parameters

These patterns emerged from the requirements and invariants, not from applying pattern names.

> **Note**: For a complete catalog of all design patterns present in the implementation (10 patterns total), see `PATTERNS.md`.

## Security Guarantees

### By Construction

1. **Unauthorized Access Prevention**:
   - Type system requires `UserId` for authorization
   - `UserId` can only come from authentication
   - No way to bypass authentication

2. **Privilege Escalation Prevention**:
   - No mutation operations on user permissions
   - Permissions computed from roles only
   - Immutable data structures

3. **Explicit Security**:
   - All security assumptions documented
   - All error cases explicit
   - No hidden security vulnerabilities

## Extensibility

The structure supports extension without modification:

1. **New Authentication Strategies**: Implement `AuthStrategy` function
2. **New Storage Backends**: Implement `UserRepository` and `RoleRepository` functions
3. **Role Hierarchies**: Implement in `RoleRepository` (returns inherited permissions)
4. **Token Types**: Extend `TokenValidator` to support different token formats

All extensions maintain the invariants and security guarantees.

## Conclusion

Every structural decision is justified by:

1. A specific requirement or invariant
2. A security guarantee
3. A consequence that emerges naturally

The structure is not arbitrary—it is a logical derivation from the requirements and invariants. The implementation is proof that the structure is correct.
