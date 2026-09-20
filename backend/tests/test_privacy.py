import pytest
from app.services.privacy_service import get_visible_contact_info
from app.models import User, Profile, PrivacyLevel


def test_contact_privacy_enforcement():
    user = User(id="user123", username="testuser", email="private@example.com", hashed_password="hash")
    profile = Profile(
        user_id="user123",
        full_name="Private User",
        phone_number="+1 555-0199",
        email_privacy=PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE,
        phone_privacy=PrivacyLevel.HIDDEN
    )

    # 1. Unauthenticated viewer -> Both email and phone MUST be None
    email, phone = get_visible_contact_info(profile, user, viewer_id=None, has_active_swap=False)
    assert email is None
    assert phone is None

    # 2. Authenticated viewer without accepted swap -> Both MUST be None
    email, phone = get_visible_contact_info(profile, user, viewer_id="viewer456", has_active_swap=False)
    assert email is None
    assert phone is None

    # 3. Authenticated viewer WITH accepted swap:
    # email_privacy = VISIBLE_AFTER_ACCEPTANCE -> email is visible
    # phone_privacy = HIDDEN -> phone remains None!
    email, phone = get_visible_contact_info(profile, user, viewer_id="viewer456", has_active_swap=True)
    assert email == "private@example.com"
    assert phone is None

    # 4. User viewing their own profile -> Both visible
    email, phone = get_visible_contact_info(profile, user, viewer_id="user123", has_active_swap=False)
    assert email == "private@example.com"
    assert phone == "+1 555-0199"
