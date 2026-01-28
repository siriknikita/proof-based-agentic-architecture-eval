# Design Patterns Used in the Authentication Module

This document catalogs all design patterns that are present in the authentication and authorization module implementation. These patterns emerged naturally from the requirements and invariants, rather than being applied by name during design.

## 1. Strategy Pattern

**Purpose**: Define a family of algorithms, encapsulate each one, and make them interchangeable.

**Manifestation**: The `AuthStrategy` type allows different authentication methods to be plugged in without modifying the core authentication logic.

**Location**: `src/auth.ts`

```typescript
type AuthStrategy = (credential: Credential) => AuthResult;

function authenticate(
  credential: Credential,
  strategy: AuthStrategy, // ← Strategy pattern
  userRepository: UserRepository,
): AuthResult {
  const authResult = strategy(credential);
  // ... rest of logic
}
```

**Benefits**:

- Supports multiple authentication methods (password, OAuth, SSO, etc.)
- Core authentication logic is independent of specific strategies
- Easy to add new authentication methods without modifying existing code

**Example Usage**:

```typescript
// Password-based strategy
const passwordStrategy: AuthStrategy = (credential) => {
  // Password validation logic
};

// OAuth strategy
const oauthStrategy: AuthStrategy = (credential) => {
  // OAuth validation logic
};

// Both can be used with the same authenticate function
authenticate(credential, passwordStrategy, userRepository);
authenticate(credential, oauthStrategy, userRepository);
```

---

## 2. Repository Pattern

**Purpose**: Abstract the data access layer, providing a more object-oriented view of the persistence layer.

**Manifestation**: `UserRepository` and `RoleRepository` abstract data access operations.

**Location**: `src/auth.ts`

```typescript
type UserRepository = (userId: UserId) => User | null;
type RoleRepository = (role: Role) => RolePermissions | null;
```

**Benefits**:

- Decouples business logic from data storage
- Makes testing easier (can use mock repositories)
- Allows switching storage backends without changing business logic
- Pure function interface ensures no hidden side effects

**Example Usage**:

```typescript
// In-memory repository
const inMemoryUserRepo: UserRepository = (userId) => {
  return users.get(userId) || null;
};

// Database repository
const dbUserRepo: UserRepository = (userId) => {
  return db.query("SELECT * FROM users WHERE id = ?", [userId]);
};

// Both work with the same authorize function
authorize(userId, permission, inMemoryUserRepo, roleRepo);
authorize(userId, permission, dbUserRepo, roleRepo);
```

---

## 3. Result/Either Pattern (Functional Error Handling)

**Purpose**: Explicitly represent success or failure without throwing exceptions.

**Manifestation**: `AuthResult` and `AuthzResult` discriminated unions.

**Location**: `src/auth.ts`

```typescript
type AuthResult =
  | {
      readonly kind: "success";
      readonly userId: UserId;
      readonly token: AuthToken;
    }
  | { readonly kind: "failure"; readonly reason: string };

type AuthzResult =
  | { readonly kind: "allowed" }
  | { readonly kind: "denied"; readonly reason: string };
```

**Benefits**:

- Forces explicit error handling (callers must check the result)
- Type-safe error handling (TypeScript exhaustiveness checking)
- No hidden exceptions that could bypass security checks
- Errors are part of the function contract

**Example Usage**:

```typescript
const result = authenticate(credential, strategy, userRepo);
if (result.kind === "success") {
  // TypeScript knows result.userId and result.token exist here
  console.log(`User ${result.userId} authenticated`);
} else {
  // TypeScript knows result.reason exists here
  console.error(`Authentication failed: ${result.reason}`);
}
```

---

## 4. Dependency Injection

**Purpose**: Invert the control of dependencies, passing them as parameters rather than creating them internally.

**Manifestation**: All dependencies (repositories, strategies, validators) are passed as function parameters.

**Location**: `src/auth.ts` (all functions)

```typescript
function authenticate(
  credential: Credential,
  strategy: AuthStrategy, // ← Injected dependency
  userRepository: UserRepository, // ← Injected dependency
): AuthResult {
  /* ... */
}

function authorize(
  userId: UserId,
  requiredPermission: Permission,
  userRepository: UserRepository, // ← Injected dependency
  roleRepository: RoleRepository, // ← Injected dependency
): AuthzResult {
  /* ... */
}
```

**Benefits**:

- No global state (all dependencies explicit)
- Easy to test (can inject mocks)
- Flexible (can swap implementations)
- Clear dependencies (visible in function signatures)

**Example Usage**:

```typescript
// Production dependencies
authenticate(cred, prodStrategy, prodUserRepo);

// Test dependencies
authenticate(cred, mockStrategy, mockUserRepo);
```

---

## 5. Factory Pattern

**Purpose**: Provide an interface for creating objects without specifying their exact classes.

**Manifestation**: `createUserId`, `createRole`, `createPermission`, `createAuthToken` functions.

**Location**: `src/auth.ts`

```typescript
function createUserId(id: string): UserId {
  return id as UserId;
}

function createRole(role: string): Role {
  return role as Role;
}

function createPermission(permission: string): Permission {
  return permission as Permission;
}

function createAuthToken(token: string): AuthToken {
  return token as AuthToken;
}
```

**Benefits**:

- Centralized creation logic for branded types
- Type-safe construction
- Single point of change if creation logic needs to evolve
- Prevents direct type casting (encourages use of factory functions)

**Example Usage**:

```typescript
// Type-safe creation
const userId = createUserId("user123");
const role = createRole("admin");
const permission = createPermission("read:users");

// TypeScript prevents mixing types
const wrong: UserId = role; // Type error!
```

---

## 6. Value Object Pattern (Immutable)

**Purpose**: Represent immutable values that are defined by their attributes rather than identity.

**Manifestation**: All data types use `readonly` properties.

**Location**: `src/auth.ts`

```typescript
type User = {
  readonly id: UserId;
  readonly roles: readonly Role[];
};

type RolePermissions = {
  readonly role: Role;
  readonly permissions: readonly Permission[];
};
```

**Benefits**:

- Prevents accidental mutations
- Thread-safe (can be shared without synchronization)
- Clear intent: data is immutable
- Prevents privilege escalation through mutation

**Example Usage**:

```typescript
const user: User = { id: userId, roles: [role1, role2] };
// user.roles.push(role3); // TypeScript error: readonly property
// Must create new object to modify
const updatedUser: User = { ...user, roles: [...user.roles, role3] };
```

---

## 7. Branded Types / Newtype Pattern

**Purpose**: Create distinct types from existing types to prevent type confusion.

**Manifestation**: Branded types for `UserId`, `Role`, `Permission`, `AuthToken`.

**Location**: `src/auth.ts`

```typescript
type UserId = string & { readonly __brand: "UserId" };
type Role = string & { readonly __brand: "Role" };
type Permission = string & { readonly __brand: "Permission" };
type AuthToken = string & { readonly __brand: "AuthToken" };
```

**Benefits**:

- Type safety: prevents using a `Role` where a `UserId` is expected
- Compile-time error detection
- Self-documenting code (types express intent)
- Prevents security vulnerabilities from type confusion

**Example Usage**:

```typescript
const userId: UserId = createUserId('user1');
const role: Role = createRole('admin');

// TypeScript prevents this:
function authorize(userId: UserId, ...) { /* ... */ }
authorize(role, ...); // Type error: Role is not UserId
```

---

## 8. Composition Pattern

**Purpose**: Compose complex operations from simpler ones.

**Manifestation**: `checkAccess` composes `tokenValidator` and `authorize`.

**Location**: `src/auth.ts`

```typescript
function checkAccess(
  token: AuthToken,
  requiredPermission: Permission,
  tokenValidator: TokenValidator,
  userRepository: UserRepository,
  roleRepository: RoleRepository,
): AuthzResult {
  const userId = tokenValidator(token); // Step 1: Validate token
  if (userId === null) {
    return { kind: "denied", reason: "Invalid token" };
  }
  return authorize(userId, requiredPermission, userRepository, roleRepository); // Step 2: Authorize
}
```

**Benefits**:

- Reuses existing functions (`authorize`)
- Clear separation of concerns (token validation vs. authorization)
- Easy to understand (sequential composition)
- Maintains single responsibility

**Example Usage**:

```typescript
// checkAccess internally composes:
// 1. Token validation (authentication)
// 2. Authorization (permission check)
const result = checkAccess(token, permission, validator, userRepo, roleRepo);
```

---

## 9. Pure Function Pattern

**Purpose**: Functions that have no side effects and always return the same output for the same input.

**Manifestation**: All functions in the module are pure.

**Location**: `src/auth.ts` (all functions)

```typescript
// Pure function: no side effects, deterministic
function authorize(
  userId: UserId,
  requiredPermission: Permission,
  userRepository: UserRepository,
  roleRepository: RoleRepository,
): AuthzResult {
  // Only reads from parameters, no mutations, no I/O
  const user = userRepository(userId);
  // ... deterministic logic
}
```

**Benefits**:

- Predictable behavior
- Easy to test (no setup/teardown needed)
- Thread-safe
- Referentially transparent
- No hidden dependencies

**Example Usage**:

```typescript
// Same inputs always produce same output
const result1 = authorize(userId, perm, repo1, roleRepo);
const result2 = authorize(userId, perm, repo1, roleRepo);
// result1 === result2 (deterministic)
```

---

## 10. Separation of Concerns

**Purpose**: Separate different aspects of the system into distinct modules.

**Manifestation**: Clear separation between authentication and authorization.

**Location**: `src/auth.ts`

```typescript
// Authentication: "Who are you?"
function authenticate(...): AuthResult { /* ... */ }

// Authorization: "What can you do?"
function authorize(...): AuthzResult { /* ... */ }

// Composed: "Can you access this resource?"
function checkAccess(...): AuthzResult { /* ... */ }
```

**Benefits**:

- Each function has a single, clear responsibility
- Authentication logic independent of authorization logic
- Easy to test each concern separately
- Changes to one concern don't affect the other

---

## Pattern Relationships

The patterns work together to create a cohesive, secure system:

```
┌─────────────────────────────────────────────────────────┐
│                    Branded Types                        │
│              (Type Safety Foundation)                   │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│   Strategy   │  │  Repository   │  │   Factory   │
│   Pattern    │  │   Pattern     │  │   Pattern   │
└───────┬──────┘  └───────┬───────┘  └───────┬──────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│   Result     │  │  Dependency   │  │ Composition │
│   Pattern    │  │   Injection   │  │   Pattern   │
└──────────────┘  └───────────────┘  └─────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│ Value Object │  │ Pure Function │  │ Separation  │
│   Pattern    │  │    Pattern    │  │ of Concerns │
└──────────────┘  └───────────────┘  └─────────────┘
```

## Summary

| Pattern                | Purpose                   | Key Benefit                       |
| ---------------------- | ------------------------- | --------------------------------- |
| Strategy               | Pluggable algorithms      | Extensible authentication methods |
| Repository             | Data access abstraction   | Testable, swappable storage       |
| Result/Either          | Explicit error handling   | Type-safe, no hidden exceptions   |
| Dependency Injection   | Invert control            | No global state, testable         |
| Factory                | Type-safe construction    | Prevents type confusion           |
| Value Object           | Immutable data            | Prevents mutations, thread-safe   |
| Branded Types          | Type safety               | Prevents type confusion errors    |
| Composition            | Build complex from simple | Reusable, clear flow              |
| Pure Function          | No side effects           | Predictable, testable             |
| Separation of Concerns | Single responsibility     | Maintainable, clear boundaries    |

All patterns emerged naturally from the requirements and invariants, creating a system that is:

- **Secure by construction** (branded types, immutable data)
- **Testable** (dependency injection, pure functions)
- **Extensible** (strategy pattern, repository pattern)
- **Maintainable** (separation of concerns, composition)
- **Type-safe** (branded types, result types)
