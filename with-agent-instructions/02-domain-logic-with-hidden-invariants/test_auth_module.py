"""
Tests for the authentication and authorization module.

These tests verify that all invariants are maintained and the module
functions correctly according to the design specification.
"""

from auth_module import (
    AuthModule,
    RoleHierarchy,
    AccessControlPolicy,
    AuthenticationResult,
    AuthorizationResult,
)
from strategies import PasswordStrategy, TokenStrategy, OAuthStrategy


def test_authentication_success():
    """Test successful authentication."""
    password_store = {"user1": "password123"}
    strategy = PasswordStrategy(password_store)
    module = AuthModule(
        hierarchy=RoleHierarchy(inheritance_map={}),
        policy=AccessControlPolicy(role_permissions={}),
    )

    result = module.authenticate_user("password123", "user1", strategy)
    assert result.success is True
    assert result.user_id == "user1"
    assert result.error is None


def test_authentication_failure():
    """Test failed authentication."""
    password_store = {"user1": "password123"}
    strategy = PasswordStrategy(password_store)
    module = AuthModule(
        hierarchy=RoleHierarchy(inheritance_map={}),
        policy=AccessControlPolicy(role_permissions={}),
    )

    result = module.authenticate_user("wrongpassword", "user1", strategy)
    assert result.success is False
    assert result.user_id is None
    assert result.error == "Invalid credentials"


def test_authorization_allowed():
    """Test successful authorization."""
    hierarchy = RoleHierarchy(inheritance_map={})
    policy = AccessControlPolicy(
        role_permissions={
            "admin": {("users", "read"), ("users", "write")},
            "user": {("users", "read")},
        }
    )
    module = AuthModule(hierarchy=hierarchy, policy=policy)

    result = module.authorize_action("user1", "admin", "users", "read")
    assert result.allowed is True
    assert result.reason is None


def test_authorization_denied():
    """Test denied authorization."""
    hierarchy = RoleHierarchy(inheritance_map={})
    policy = AccessControlPolicy(role_permissions={"user": {("users", "read")}})
    module = AuthModule(hierarchy=hierarchy, policy=policy)

    result = module.authorize_action("user1", "user", "users", "write")
    assert result.allowed is False
    assert result.reason is not None
    assert "does not have permission" in result.reason


def test_role_inheritance():
    """Test that role inheritance works correctly."""
    hierarchy = RoleHierarchy(
        inheritance_map={"admin": {"user", "moderator"}, "moderator": {"user"}}
    )
    policy = AccessControlPolicy(
        role_permissions={
            "user": {("posts", "read")},
            "moderator": {("posts", "moderate")},
            "admin": {("posts", "delete")},
        }
    )
    module = AuthModule(hierarchy=hierarchy, policy=policy)

    # Admin should have all permissions (direct + inherited)
    result = module.authorize_action("user1", "admin", "posts", "read")
    assert result.allowed is True

    result = module.authorize_action("user1", "admin", "posts", "moderate")
    assert result.allowed is True

    result = module.authorize_action("user1", "admin", "posts", "delete")
    assert result.allowed is True


def test_privilege_escalation_prevention():
    """Test that privilege escalation is detected."""
    hierarchy = RoleHierarchy(inheritance_map={"admin": {"user"}, "user": set()})
    policy = AccessControlPolicy(
        role_permissions={
            "user": {("posts", "read")},
            "admin": {("posts", "read"), ("posts", "delete")},
        }
    )
    module = AuthModule(hierarchy=hierarchy, policy=policy)

    # User trying to get admin role should be detected as escalation
    would_escalate = module.check_escalation("user1", "admin", {"user"})
    assert would_escalate is True

    # User getting user role again should not be escalation
    would_escalate = module.check_escalation("user1", "user", {"user"})
    assert would_escalate is False


def test_strategy_extensibility():
    """Test that different authentication strategies work."""
    # Password strategy
    password_store = {"user1": "pass123"}
    password_strategy = PasswordStrategy(password_store)

    # Token strategy
    token_store = {"token123": "user1"}
    token_strategy = TokenStrategy(token_store)

    # OAuth strategy
    oauth_store = {"oauth_token_abc": "user1"}
    oauth_strategy = OAuthStrategy(oauth_store)

    module = AuthModule(
        hierarchy=RoleHierarchy(inheritance_map={}),
        policy=AccessControlPolicy(role_permissions={}),
    )

    # All strategies should work
    result1 = module.authenticate_user("pass123", "user1", password_strategy)
    assert result1.success is True

    result2 = module.authenticate_user("token123", "user1", token_strategy)
    assert result2.success is True

    result3 = module.authenticate_user("oauth_token_abc", "user1", oauth_strategy)
    assert result3.success is True


def test_no_global_state():
    """Test that module instances are independent (no global state)."""
    policy1 = AccessControlPolicy(role_permissions={"role1": {("res1", "act1")}})
    policy2 = AccessControlPolicy(role_permissions={"role2": {("res2", "act2")}})

    module1 = AuthModule(hierarchy=RoleHierarchy(inheritance_map={}), policy=policy1)
    module2 = AuthModule(hierarchy=RoleHierarchy(inheritance_map={}), policy=policy2)

    # Each module should have its own policy
    result1 = module1.authorize_action("user1", "role1", "res1", "act1")
    assert result1.allowed is True

    result2 = module2.authorize_action("user1", "role2", "res2", "act2")
    assert result2.allowed is True

    # Module1 should not have role2 permissions
    result3 = module1.authorize_action("user1", "role2", "res2", "act2")
    assert result3.allowed is False


def test_deterministic_authorization():
    """Test that authorization is deterministic (same inputs = same outputs)."""
    hierarchy = RoleHierarchy(inheritance_map={})
    policy = AccessControlPolicy(role_permissions={"admin": {("users", "read")}})
    module = AuthModule(hierarchy=hierarchy, policy=policy)

    # Same inputs should produce same outputs
    result1 = module.authorize_action("user1", "admin", "users", "read")
    result2 = module.authorize_action("user1", "admin", "users", "read")

    assert result1.allowed == result2.allowed
    assert result1.reason == result2.reason


if __name__ == "__main__":
    test_authentication_success()
    print("✓ Authentication success test passed")

    test_authentication_failure()
    print("✓ Authentication failure test passed")

    test_authorization_allowed()
    print("✓ Authorization allowed test passed")

    test_authorization_denied()
    print("✓ Authorization denied test passed")

    test_role_inheritance()
    print("✓ Role inheritance test passed")

    test_privilege_escalation_prevention()
    print("✓ Privilege escalation prevention test passed")

    test_strategy_extensibility()
    print("✓ Strategy extensibility test passed")

    test_no_global_state()
    print("✓ No global state test passed")

    test_deterministic_authorization()
    print("✓ Deterministic authorization test passed")

    print("\n✅ All tests passed!")
