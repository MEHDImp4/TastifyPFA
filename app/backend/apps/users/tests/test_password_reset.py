from django.core import mail
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import Utilisateur
from apps.users.reset_tokens import build_password_reset_token, build_password_reset_uid


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            username='reset_client',
            email='reset@tastify.ma',
            password='password123',
            role=Utilisateur.Role.CLIENT,
        )
        self.request_url = reverse('users:request_reset')
        self.validate_url = reverse('users:validate_reset_token')
        self.confirm_url = reverse('users:confirm_reset')

    def test_request_reset_is_non_enumerating_and_sends_email_for_active_user(self):
        response = self.client.post(
            self.request_url,
            {'email': self.user.email},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'RESET_REQUEST_ACCEPTED')
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('/reset-password?uid=', mail.outbox[0].body)

    def test_request_reset_does_not_send_email_for_unknown_user(self):
        response = self.client.post(
            self.request_url,
            {'email': 'unknown@tastify.ma'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'RESET_REQUEST_ACCEPTED')
        self.assertEqual(len(mail.outbox), 0)

    def test_validate_reset_token_accepts_valid_token(self):
        response = self.client.post(
            self.validate_url,
            {
                'uid': build_password_reset_uid(self.user),
                'token': build_password_reset_token(self.user),
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'RESET_TOKEN_VALID')

    def test_validate_reset_token_rejects_invalid_token(self):
        response = self.client.post(
            self.validate_url,
            {
                'uid': build_password_reset_uid(self.user),
                'token': 'broken-token',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('token', response.data)

    def test_confirm_reset_updates_password_and_invalidates_old_token(self):
        uid = build_password_reset_uid(self.user)
        token = build_password_reset_token(self.user)

        response = self.client.post(
            self.confirm_url,
            {
                'uid': uid,
                'token': token,
                'password': 'newpassword123',
                'password_confirm': 'newpassword123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))

        replay = self.client.post(
            self.confirm_url,
            {
                'uid': uid,
                'token': token,
                'password': 'anotherpassword123',
                'password_confirm': 'anotherpassword123',
            },
            format='json',
        )
        self.assertEqual(replay.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirm_reset_rejects_mismatch_and_weak_password(self):
        uid = build_password_reset_uid(self.user)
        token = build_password_reset_token(self.user)

        mismatch = self.client.post(
            self.confirm_url,
            {
                'uid': uid,
                'token': token,
                'password': 'newpassword123',
                'password_confirm': 'differentpassword123',
            },
            format='json',
        )
        self.assertEqual(mismatch.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password_confirm', mismatch.data)

        weak = self.client.post(
            self.confirm_url,
            {
                'uid': uid,
                'token': token,
                'password': '123',
                'password_confirm': '123',
            },
            format='json',
        )
        self.assertEqual(weak.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', weak.data)
