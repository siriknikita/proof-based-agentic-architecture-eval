"""
Example authentication strategies demonstrating extensibility.

These implementations show how new authentication strategies can be added
without modifying the core authentication module.
"""

from typing import Dict, Optional
from auth_module import AuthenticationStrategy, UserId


# Password-based authentication strategy
class PasswordStrategy:
    """Password-based authentication strategy."""

    def __init__(self, password_store: Dict[UserId, str]):
        """
        Initialize with a password store.

        Args:
            password_store: Dictionary mapping user_id to password hash
        """
        self.password_store = password_store

    def verify(self, credential: str, user_id: UserId) -> bool:
        """
        Verify a password credential.

        Args:
            credential: The password to verify
            user_id: The user identifier

        Returns:
            True if password matches, False otherwise
        """
        stored_password = self.password_store.get(user_id)
        if stored_password is None:
            return False
        return credential == stored_password


# Token-based authentication strategy
class TokenStrategy:
    """Token-based authentication strategy."""

    def __init__(self, valid_tokens: Dict[str, UserId]):
        """
        Initialize with a token store.

        Args:
            valid_tokens: Dictionary mapping token to user_id
        """
        self.valid_tokens = valid_tokens

    def verify(self, credential: str, user_id: UserId) -> bool:
        """
        Verify a token credential.

        Args:
            credential: The token to verify
            user_id: The user identifier

        Returns:
            True if token is valid and matches user_id, False otherwise
        """
        token_user_id = self.valid_tokens.get(credential)
        return token_user_id is not None and token_user_id == user_id


# OAuth-like strategy (simplified)
class OAuthStrategy:
    """OAuth-like authentication strategy (simplified example)."""

    def __init__(self, oauth_tokens: Dict[str, UserId]):
        """
        Initialize with OAuth token store.

        Args:
            oauth_tokens: Dictionary mapping OAuth token to user_id
        """
        self.oauth_tokens = oauth_tokens

    def verify(self, credential: str, user_id: UserId) -> bool:
        """
        Verify an OAuth token credential.

        Args:
            credential: The OAuth token to verify
            user_id: The user identifier

        Returns:
            True if OAuth token is valid and matches user_id, False otherwise
        """
        token_user_id = self.oauth_tokens.get(credential)
        return token_user_id is not None and token_user_id == user_id
