"""
Example usage of the authentication and authorization module.

Demonstrates:
- User authentication
- Role-based access control
- Privilege escalation prevention
"""

from auth import (
    AuthenticatedUser,
    Authenticator,
    Authorizer,
    Credentials,
    PasswordAuthenticator,
    Permission,
    Role,
    RoleBasedAuthorizer,
    SecurityContext,
    Username,
    UserId,
    prevent_privilege_escalation,
    DefaultRoleHierarchy,
)


class InMemoryUserRepository:
    """Simple in-memory user repository for demonstration."""
    
    def __init__(self) -> None:
        # Define permissions
        read_permission = Permission("read")
        write_permission = Permission("write")
        admin_permission = Permission("admin")
        
        # Define roles
        user_role = Role("user", frozenset([read_permission]))
        admin_role = Role("admin", frozenset([read_permission, write_permission, admin_permission]))
        
        # Store users
        self._users = {
            "alice": (UserId("user-1"), Username("alice"), frozenset([user_role])),
            "admin": (UserId("user-2"), Username("admin"), frozenset([admin_role])),
        }
    
    def find_user_by_credentials(self, credentials: Credentials) -> tuple[UserId, Username, frozenset[Role]] | None:
        """Find user by credentials."""
        if credentials.username in self._users and credentials.password == "password":
            return self._users[credentials.username]
        return None


def main() -> None:
    """Demonstrate authentication and authorization."""
    
    # Setup
    repository = InMemoryUserRepository()
    authenticator: Authenticator = PasswordAuthenticator(repository)
    authorizer: Authorizer = RoleBasedAuthorizer()
    role_hierarchy = DefaultRoleHierarchy()
    
    # Authenticate user
    credentials = Credentials(Username("alice"), "password")
    result = authenticator.authenticate(credentials)
    
    if not result.is_authenticated() or result.authenticated is None:
        print("Authentication failed")
        return
    
    user: AuthenticatedUser = result.authenticated
    print(f"Authenticated user: {user.username}")
    
    # Check permissions
    read_permission = Permission("read")
    write_permission = Permission("write")
    
    can_read = authorizer.has_permission(user, read_permission)
    can_write = authorizer.has_permission(user, write_permission)
    
    print(f"Can read: {can_read}")
    print(f"Can write: {can_write}")
    
    # Check privilege escalation prevention
    admin_role = Role("admin", frozenset([Permission("admin")]))
    context = SecurityContext(actor=user)
    
    can_grant_admin = prevent_privilege_escalation(context, admin_role, role_hierarchy)
    print(f"Can grant admin role: {can_grant_admin}")  # Should be False


if __name__ == "__main__":
    main()
