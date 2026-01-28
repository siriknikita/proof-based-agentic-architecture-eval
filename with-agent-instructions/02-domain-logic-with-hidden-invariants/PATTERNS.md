# Design Patterns Used in This Project

This document identifies and explains all design patterns used in the authentication and authorization module.

## 1. Strategy Pattern

**Location**: `auth_module.py` (lines 57-71), `strategies.py` (entire file)

**Description**: Defines a family of algorithms (authentication strategies), encapsulates each one, and makes them interchangeable.

**Implementation**:

- `AuthenticationStrategy` protocol defines the interface
- Concrete strategies: `PasswordStrategy`, `TokenStrategy`, `OAuthStrategy`
- The `authenticate` function accepts any strategy that implements the protocol

**Example**:

```python
class AuthenticationStrategy(Protocol[Credential]):
    def verify(self, credential: Credential, user_id: UserId) -> bool: ...

# Different strategies can be used interchangeably
password_strategy = PasswordStrategy(password_store)
token_strategy = TokenStrategy(token_store)
oauth_strategy = OAuthStrategy(oauth_store)
```

**Benefits**:

- Enables extensibility without modifying core code
- Allows runtime selection of authentication method
- Follows Open/Closed Principle

---

## 2. Value Object Pattern

**Location**: `auth_module.py` (lines 24-53)

**Description**: Immutable objects that represent a descriptive aspect of the domain with no conceptual identity.

**Implementation**:

- All result and configuration types are frozen dataclasses:
  - `AuthenticationResult`
  - `AuthorizationResult`
  - `RoleHierarchy`
  - `AccessControlPolicy`
  - `AuthModule`

**Example**:

```python
@dataclass(frozen=True)
class AuthenticationResult:
    success: bool
    user_id: Optional[UserId]
    error: Optional[str]
```

**Benefits**:

- Prevents accidental mutation
- Ensures thread safety
- Makes objects safe to share
- Enables value equality semantics

---

## 3. Protocol/Interface Pattern

**Location**: `auth_module.py` (lines 57-71)

**Description**: Defines a contract that classes must follow, enabling polymorphism without inheritance.

**Implementation**:

- Uses Python's `Protocol` type for structural subtyping
- `AuthenticationStrategy` protocol defines the required interface
- Any class with a matching `verify` method satisfies the protocol

**Example**:

```python
class AuthenticationStrategy(Protocol[Credential]):
    def verify(self, credential: Credential, user_id: UserId) -> bool: ...

# Any class implementing verify() satisfies the protocol
class PasswordStrategy:
    def verify(self, credential: str, user_id: UserId) -> bool:
        # Implementation
```

**Benefits**:

- Enables duck typing with type safety
- No need for explicit inheritance
- Supports multiple implementations
- Maintains loose coupling

---

## 4. Dependency Injection Pattern

**Location**: Throughout `auth_module.py`

**Description**: Objects receive their dependencies from external sources rather than creating them internally.

**Implementation**:

- Strategies are passed as parameters to `authenticate` function
- Configuration (hierarchy, policy) is passed to functions or injected into `AuthModule`
- No hard-coded dependencies

**Example**:

```python
def authenticate(
    credential: Credential,
    user_id: UserId,
    strategy: AuthenticationStrategy[Credential],  # Injected dependency
) -> AuthenticationResult:
    # Uses injected strategy
    is_valid = strategy.verify(credential, user_id)
    # ...
```

**Benefits**:

- Enables testability (easy to mock dependencies)
- Reduces coupling
- Increases flexibility
- Makes dependencies explicit

---

## 5. Result Object Pattern (Monad-like)

**Location**: `auth_module.py` (lines 24-38)

**Description**: Returns a result object containing both success/failure status and data/error information, instead of throwing exceptions.

**Implementation**:

- `AuthenticationResult` and `AuthorizationResult` encapsulate both success and error cases
- No exceptions thrown for business logic errors
- Explicit error representation

**Example**:

```python
@dataclass(frozen=True)
class AuthenticationResult:
    success: bool
    user_id: Optional[UserId]
    error: Optional[str]

# Usage
result = authenticate(credential, user_id, strategy)
if result.success:
    # Handle success
else:
    # Handle error using result.error
```

**Benefits**:

- Makes error handling explicit
- Prevents silent failures
- Enables functional error handling
- Clear contract for callers

---

## 6. Facade Pattern

**Location**: `auth_module.py` (lines 189-253)

**Description**: Provides a simplified interface to a complex subsystem.

**Implementation**:

- `AuthModule` class provides a unified interface to:
  - Authentication operations
  - Authorization operations
  - Privilege escalation checks
- Hides the complexity of underlying functions and configuration

**Example**:

```python
module = AuthModule(hierarchy=hierarchy, policy=policy)
# Simple interface hides complexity
result = module.authenticate_user(credential, user_id, strategy)
result = module.authorize_action(user_id, role, resource, action)
```

**Benefits**:

- Simplifies client code
- Provides a single entry point
- Encapsulates subsystem complexity
- Makes the API more intuitive

---

## 7. Composition Pattern

**Location**: `auth_module.py` (lines 189-253)

**Description**: Objects are composed of other objects to achieve functionality, rather than using inheritance.

**Implementation**:

- `AuthModule` composes `RoleHierarchy` and `AccessControlPolicy`
- Functions compose other functions (e.g., `authorize` uses `resolve_role_permissions`)
- No inheritance hierarchy for behavior

**Example**:

```python
@dataclass(frozen=True)
class AuthModule:
    hierarchy: RoleHierarchy      # Composed
    policy: AccessControlPolicy   # Composed

    def authorize_action(self, ...):
        # Composes resolve_role_permissions and authorize functions
        return authorize(user_id, role, resource, action, self.hierarchy, self.policy)
```

**Benefits**:

- More flexible than inheritance
- Follows "favor composition over inheritance"
- Enables runtime configuration
- Easier to test individual components

---

## 8. Functional Programming Patterns

**Location**: Throughout `auth_module.py`

**Description**: Patterns from functional programming including pure functions, immutability, and higher-order functions.

**Implementation**:

- **Pure Functions**: All core functions (`authenticate`, `authorize`, `resolve_role_permissions`) are pure
  - No side effects
  - Deterministic outputs
  - Referentially transparent
- **Immutability**: All data structures are immutable (frozen dataclasses)
- **Function Composition**: Functions are composed together (e.g., `authorize` composes `resolve_role_permissions`)

**Example**:

```python
# Pure function - same inputs always produce same outputs
def authorize(
    user_id: UserId,
    role: Role,
    resource: Resource,
    action: Action,
    hierarchy: RoleHierarchy,
    policy: AccessControlPolicy,
) -> AuthorizationResult:
    # No side effects, deterministic
    role_permissions = resolve_role_permissions(role, hierarchy, policy)
    # ...
```

**Benefits**:

- Easier to reason about
- Thread-safe by default
- Highly testable
- Enables parallelization
- Prevents bugs from hidden state

---

## 9. Recursive Pattern

**Location**: `auth_module.py` (lines 101-122)

**Description**: A function calls itself to solve a problem by breaking it into smaller subproblems.

**Implementation**:

- `resolve_role_permissions` recursively resolves inherited permissions
- Traverses the role hierarchy tree structure

**Example**:

```python
def resolve_role_permissions(
    role: Role, hierarchy: RoleHierarchy, policy: AccessControlPolicy
) -> Set[Permission]:
    direct_permissions = policy.role_permissions.get(role, set())
    inherited_roles = hierarchy.inheritance_map.get(role, set())
    inherited_permissions = set()
    for inherited_role in inherited_roles:
        # Recursive call
        inherited_permissions.update(
            resolve_role_permissions(inherited_role, hierarchy, policy)
        )
    return direct_permissions | inherited_permissions
```

**Benefits**:

- Natural fit for tree/hierarchy structures
- Clean, readable code
- Handles arbitrary depth
- Matches the problem domain structure

---

## 10. Type Alias Pattern

**Location**: `auth_module.py` (lines 14-20)

**Description**: Creating semantic type aliases to improve code readability and type safety.

**Implementation**:

- Type aliases for domain concepts: `UserId`, `Role`, `Resource`, `Action`, `Permission`
- Makes function signatures more readable and self-documenting

**Example**:

```python
UserId = str
Role = str
Resource = str
Action = str
Permission = Tuple[Resource, Action]

# More readable than using str directly
def authorize(user_id: UserId, role: Role, ...) -> AuthorizationResult:
    # ...
```

**Benefits**:

- Improves code readability
- Makes intent clear
- Enables future type refinement
- Self-documenting code

---

## 11. Generic Type Pattern

**Location**: `auth_module.py` (lines 20, 57-71)

**Description**: Using type variables to create reusable, type-safe abstractions.

**Implementation**:

- `Credential = TypeVar('Credential')` allows different credential types
- `AuthenticationStrategy(Protocol[Credential])` is generic over credential type

**Example**:

```python
Credential = TypeVar('Credential')

class AuthenticationStrategy(Protocol[Credential]):
    def verify(self, credential: Credential, user_id: UserId) -> bool: ...

# Can work with str, bytes, custom credential types, etc.
```

**Benefits**:

- Type safety with flexibility
- Reusable across different types
- Prevents type errors
- Maintains type information through transformations

---

## 12. Module Pattern

**Location**: `auth_module.py` (entire file), `strategies.py` (entire file)

**Description**: Organizing related functionality into modules with clear boundaries and interfaces.

**Implementation**:

- `auth_module.py`: Core authentication/authorization logic
- `strategies.py`: Strategy implementations
- Clear separation of concerns
- Public interfaces vs. internal implementation

**Benefits**:

- Clear module boundaries
- Separation of concerns
- Easier to maintain
- Enables modular testing

---

## Pattern Relationships

These patterns work together:

1. **Strategy + Protocol**: Strategy pattern implemented using Protocol for type safety
2. **Value Object + Immutability**: Value objects are immutable, enabling functional patterns
3. **Dependency Injection + Strategy**: Strategies are injected, enabling flexibility
4. **Facade + Composition**: Facade composes multiple components
5. **Result Object + Functional**: Result objects enable functional error handling
6. **Recursive + Functional**: Recursive functions are pure, maintaining functional properties

## Summary

The codebase uses **12 distinct design patterns** that work together to create a:

- **Extensible** system (Strategy, Protocol)
- **Safe** system (Value Object, Immutability, Type Safety)
- **Testable** system (Dependency Injection, Pure Functions)
- **Maintainable** system (Module, Facade, Composition)
- **Correct** system (Functional Patterns, Result Objects)

All patterns emerge naturally from the requirements and invariants, following the proof-oriented design methodology.
