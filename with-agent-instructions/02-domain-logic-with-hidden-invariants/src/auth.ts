// Executable Pseudo-Code Skeleton (EPS)
// This defines the entire structure without business logic

// ============================================================================
// Type Definitions (from Phase 3)
// ============================================================================

type UserId = string & { readonly __brand: 'UserId' };
type Role = string & { readonly __brand: 'Role' };
type Permission = string & { readonly __brand: 'Permission' };
type AuthToken = string & { readonly __brand: 'AuthToken' };

// Helper functions to create branded types (type-safe constructors)
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

type Credential = unknown;

type User = {
  readonly id: UserId;
  readonly roles: readonly Role[];
};

type RolePermissions = {
  readonly role: Role;
  readonly permissions: readonly Permission[];
};

// ============================================================================
// Result Types
// ============================================================================

type AuthResult =
  | { readonly kind: 'success'; readonly userId: UserId; readonly token: AuthToken }
  | { readonly kind: 'failure'; readonly reason: string };

type AuthzResult =
  | { readonly kind: 'allowed' }
  | { readonly kind: 'denied'; readonly reason: string };

// ============================================================================
// Repository Abstractions (from Phase 3)
// ============================================================================

type UserRepository = (userId: UserId) => User | null;
type RoleRepository = (role: Role) => RolePermissions | null;
type AuthStrategy = (credential: Credential) => AuthResult;
type TokenValidator = (token: AuthToken) => UserId | null;

// ============================================================================
// Core Operations (Structural Derivation)
// ============================================================================

function authenticate(
  credential: Credential,
  strategy: AuthStrategy,
  userRepository: UserRepository
): AuthResult {
  const authResult = strategy(credential);
  if (authResult.kind === 'failure') {
    return authResult;
  }
  const user = userRepository(authResult.userId);
  if (user === null) {
    return { kind: 'failure', reason: 'User not found' };
  }
  return authResult;
}

function authorize(
  userId: UserId,
  requiredPermission: Permission,
  userRepository: UserRepository,
  roleRepository: RoleRepository
): AuthzResult {
  const user = userRepository(userId);
  if (user === null) {
    return { kind: 'denied', reason: 'User not found' };
  }
  if (user.roles.length === 0) {
    return { kind: 'denied', reason: 'User has no roles' };
  }
  const userPermissions = collectUserPermissions(user.roles, roleRepository);
  const hasPermission = checkPermission(userPermissions, requiredPermission);
  if (hasPermission) {
    return { kind: 'allowed' };
  }
  return { kind: 'denied', reason: 'Insufficient permissions' };
}

function checkAccess(
  token: AuthToken,
  requiredPermission: Permission,
  tokenValidator: TokenValidator,
  userRepository: UserRepository,
  roleRepository: RoleRepository
): AuthzResult {
  const userId = tokenValidator(token);
  if (userId === null) {
    return { kind: 'denied', reason: 'Invalid token' };
  }
  return authorize(userId, requiredPermission, userRepository, roleRepository);
}

// ============================================================================
// Helper Functions (Structural Requirements)
// ============================================================================

function collectUserPermissions(
  roles: readonly Role[],
  roleRepository: RoleRepository
): readonly Permission[] {
  const allPermissions: Permission[] = [];
  for (const role of roles) {
    const rolePermissions = roleRepository(role);
    if (rolePermissions !== null) {
      allPermissions.push(...rolePermissions.permissions);
    }
  }
  return allPermissions;
}

function checkPermission(
  userPermissions: readonly Permission[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

// ============================================================================
// Exports
// ============================================================================

export type {
  UserId,
  Role,
  Permission,
  AuthToken,
  Credential,
  User,
  RolePermissions,
  AuthResult,
  AuthzResult,
  UserRepository,
  RoleRepository,
  AuthStrategy,
  TokenValidator,
};

export {
  createUserId,
  createRole,
  createPermission,
  createAuthToken,
  authenticate,
  authorize,
  checkAccess,
};
