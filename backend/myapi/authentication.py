# myapi/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from .models import User

class CustomJWTAuthentication(JWTAuthentication):
    """
    Validate token using simplejwt internals (signature/exp) and then
    load the UserAccount instance from 'user_id' in the token payload.
    """

    def get_user(self, validated_token):
        """
        validated_token is the payload (dict) already validated by simplejwt.
        We expect it to contain 'user_id'.
        """
        user_id = validated_token.get("user_id")
        if user_id is None:
            raise AuthenticationFailed(
                "Token contained no recognizable user identification",
                code="token_no_user"
            )
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found", code="user_not_found")
        return user
