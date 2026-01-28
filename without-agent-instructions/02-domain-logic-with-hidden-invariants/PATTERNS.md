# Architectural Patterns and Techniques Used

This document describes all the architectural patterns, design techniques, and structural approaches used in this authentication and authorization module. Patterns are described by their characteristics and implementation rather than formal names, to maintain focus on the design itself.

## Core Architectural Patterns

### 1. Interface-Based Abstraction

**Description**: Abstract base classes and protocols define contracts that implementations must follow.

**Implementation**:

- `Authenticator` (ABC): Defines authentication interface
- `Authorizer` (Protocol): Defines authorization interface
- `UserRepository` (Protocol): Defines data access interface
- `RoleHierarchy` (Protocol): Defines role hierarchy rules interface

**Benefits**:

- Enables multiple implementations (PasswordAuthenticator, TokenAuthenticator)
- Allows swapping implementations without changing dependent code
- Makes dependencies explicit and testable

**Location**: `auth/authenticator.py`, `auth/authorizer.py`, `auth/security.py`

### 2. Dependency Injection

**Description**: Dependencies are provided to components through constructors or function parameters, rather than being created internally or accessed globally.

**Implementation**:

- `Authenticator.__init__(user_repository: UserRepository)`: Repository injected
- `require_permission(user, permission, authorizer)`: Authorizer passed as parameter
- `prevent_privilege_escalation(context, target_role, role_hierarchy)`: Hierarchy passed as parameter

**Benefits**:

- No global state
- Easy to test (can inject mocks)
- Explicit dependencies make code predictable
- Enables different configurations for different contexts

**Location**: Throughout all modules

### 3. Result Type / Discriminated Union

**Description**: Functions return a type that represents either success or failure, with explicit handling of both cases.

**Implementation**:

- `AuthenticationResult`: Contains either `AuthenticatedUser` or `UnauthenticatedUser`, never both
- Factory methods: `AuthenticationResult.success()` and `AuthenticationResult.failure()`
- Query method: `is_authenticated()` to check result

**Benefits**:

- Forces explicit error handling
- Type-safe: compiler ensures both cases are considered
- No exceptions for expected failures
- Clear contract about possible outcomes

**Location**: `auth/authenticator.py`

### 4. Immutable Value Objects

**Description**: Data structures that cannot be modified after creation, using frozen dataclasses.

**Implementation**:

- `@dataclass(frozen=True)` on: `AuthenticatedUser`, `UnauthenticatedUser`, `Credentials`, `Role`, `Permission`, `SecurityContext`, `RoleBasedAuthorizer`, `DefaultRoleHierarchy`
- All fields are immutable once set
- No mutator methods

**Benefits**:

- Thread-safe by default
- Prevents accidental modification
- Easier to reason about (no hidden state changes)
- Can be safely shared between components

**Location**: All type definitions across modules

### 5. Type-Safe Wrappers

**Description**: NewType creates distinct types from base types to prevent mixing semantically different values.

**Implementation**:

- `UserId = NewType("UserId", str)`: Prevents mixing user IDs with other strings
- `Username = NewType("Username", str)`: Prevents mixing usernames with other strings

**Benefits**:

- Compile-time safety: type checker catches misuse
- Self-documenting: types express intent
- Prevents bugs from passing wrong string types
- Makes security-critical types explicit

**Location**: `auth/types.py`

### 6. Strategy Selection

**Description**: Multiple implementations of the same interface can be selected at runtime based on requirements.

**Implementation**:

- `PasswordAuthenticator` and `TokenAuthenticator` both implement `Authenticator`
- Client code can use either without knowing implementation details
- Easy to add new strategies (OAuth, SSO) without changing existing code

**Benefits**:

- Extensible: add new strategies without modifying existing code
- Flexible: choose strategy based on context
- Testable: can test each strategy independently
- Follows open/closed principle

**Location**: `auth/authenticator.py`

### 7. Hierarchical Composition

**Description**: Roles can have parent roles, creating a hierarchy where child roles inherit permissions from parents.

**Implementation**:

- `Role.parent_role: Role | None`: Optional parent role
- `Role.has_permission()`: Recursively checks parent roles
- Permissions cascade down the hierarchy

**Benefits**:

- Reduces duplication: define permissions once in parent
- Flexible: can model complex organizational structures
- Maintainable: changes to parent affect all children

**Location**: `auth/types.py` (Role class)

### 8. Context Object

**Description**: An immutable object that carries contextual information needed for operations.

**Implementation**:

- `SecurityContext`: Contains actor (AuthenticatedUser) and optional target_user_id
- Passed to security functions to provide necessary context
- Immutable to prevent tampering

**Benefits**:

- Groups related data together
- Makes dependencies explicit
- Prevents parameter proliferation
- Easy to extend with more context fields

**Location**: `auth/security.py`

### 9. Explicit Contract Documentation

**Description**: Every public function has a documented contract specifying preconditions, postconditions, side effects, and return values.

**Implementation**:

- All public methods have docstrings with "Contract:" sections
- Contracts specify:
  - What must be true before calling (preconditions)
  - What is guaranteed after calling (postconditions)
  - What side effects occur (explicit through dependencies)
  - What is returned and when

**Benefits**:

- Self-documenting code
- Clear expectations for callers
- Easier to verify correctness
- Helps prevent misuse

**Location**: All modules, every public function

### 10. Protocol-Based Polymorphism

**Description**: Using Python's Protocol for structural typing, allowing any type that matches the interface to be used.

**Implementation**:

- `Authorizer` (Protocol): Any type with `has_permission()` and `has_role()` methods
- `UserRepository` (Protocol): Any type with `find_user_by_credentials()` method
- `RoleHierarchy` (Protocol): Any type with `can_grant_role()` and `can_modify_user()` methods

**Benefits**:

- Duck typing with type safety
- No need to inherit from base classes
- More flexible than ABC for some use cases
- Enables testing with simple mock objects

**Location**: `auth/authenticator.py`, `auth/authorizer.py`, `auth/security.py`

### 11. Factory Methods

**Description**: Class methods that create instances with specific configurations or validations.

**Implementation**:

- `AuthenticationResult.success(user)`: Factory for successful authentication
- `AuthenticationResult.failure(reason)`: Factory for failed authentication
- Ensures valid state (never both authenticated and unauthenticated set)

**Benefits**:

- Encapsulates creation logic
- Ensures valid object state
- Provides clear, named constructors
- Prevents invalid states

**Location**: `auth/authenticator.py`

### 12. Explicit Authorization Functions

**Description**: Standalone functions that make authorization checks explicit and require all dependencies as parameters.

**Implementation**:

- `require_permission(user, permission, authorizer)`: Explicit permission check
- `require_role(user, role_name, authorizer)`: Explicit role check
- `prevent_privilege_escalation(context, target_role, role_hierarchy)`: Explicit security check

**Benefits**:

- Makes security checks visible and auditable
- All dependencies explicit (no hidden state)
- Easy to test (all inputs are parameters)
- Forces consideration of security context

**Location**: `auth/authorizer.py`, `auth/security.py`

### 13. Separation of Concerns

**Description**: Different responsibilities are handled by different modules with clear boundaries.

**Implementation**:

- `auth/authenticator.py`: Authentication (who you are)
- `auth/authorizer.py`: Authorization (what you can do)
- `auth/security.py`: Security (preventing privilege escalation)
- `auth/types.py`: Core domain types

**Benefits**:

- Each module has single responsibility
- Changes to one concern don't affect others
- Easier to understand and maintain
- Can test each concern independently

**Location**: Module structure

### 14. Fail-Safe Defaults

**Description**: Security checks default to denying access unless explicitly allowed.

**Implementation**:

- `prevent_privilege_escalation()`: Returns False (deny) if checks fail
- `can_modify_user_roles()`: Returns False (deny) if no role allows modification
- `has_permission()`: Returns False (deny) if no role has permission

**Benefits**:

- Security by default: deny unless explicitly allowed
- Prevents accidental privilege escalation
- Makes security bugs obvious (things don't work rather than silently allowing)

**Location**: `auth/authorizer.py`, `auth/security.py`

### 15. Type-Guarded Security

**Description**: The type system enforces that only authenticated users can access authorization functions.

**Implementation**:

- Authorization functions require `AuthenticatedUser` type (not `UnauthenticatedUser` or raw credentials)
- `AuthenticatedUser` can only be created through successful authentication
- Type checker prevents passing unauthenticated users to authorization functions

**Benefits**:

- Impossible to accidentally authorize unauthenticated users
- Compile-time safety: type errors catch security bugs
- Self-documenting: types express security requirements
- No runtime checks needed (enforced by type system)

**Location**: Throughout, especially `auth/authorizer.py` and `auth/security.py`

## Design Principles Applied

### Principle of Least Privilege

- Users only get permissions through explicit role assignment
- Security checks default to denying access
- Privilege escalation is explicitly prevented

### Explicit Over Implicit

- All dependencies are explicit parameters
- All security assumptions are documented
- No hidden state or side effects

### Immutability Where Possible

- All value objects are immutable
- Prevents accidental modification
- Enables safe sharing

### Fail Fast

- Type system catches errors at compile time
- Invalid states are impossible to create
- Security violations are type errors

### Composition Over Inheritance

- Uses protocols and interfaces rather than deep inheritance
- Components compose together
- Flexible and extensible

## Pattern Interactions

These patterns work together to achieve the design goals:

1. **Interface-Based Abstraction** + **Dependency Injection** = Extensible, testable components
2. **Result Type** + **Type-Safe Wrappers** = Safe error handling with compile-time guarantees
3. **Immutable Value Objects** + **Type-Guarded Security** = Security by construction
4. **Explicit Authorization Functions** + **Context Object** = Auditable security checks
5. **Separation of Concerns** + **Protocol-Based Polymorphism** = Modular, flexible architecture

## Summary

The module uses a combination of structural patterns (interfaces, dependency injection), behavioral patterns (strategy selection, explicit functions), and type system features (type safety, immutability) to create a secure, extensible, and maintainable authentication and authorization system. All patterns work together to ensure that unauthorized access is impossible by construction, all security assumptions are explicit, and the system can be extended without modification of existing code.
