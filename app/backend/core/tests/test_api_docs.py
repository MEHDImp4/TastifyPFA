from django.urls import reverse
from django.test import Client


def test_openapi_schema_endpoint_is_available():
    client = Client()

    response = client.get(reverse('api-schema'), {'format': 'json'})

    assert response.status_code == 200
    payload = response.json()
    assert payload['openapi'].startswith('3.')
    assert payload['info']['title'] == 'Tastify API'


def test_swagger_ui_endpoint_is_available():
    client = Client()

    response = client.get(reverse('api-docs'))

    assert response.status_code == 200
    assert 'swagger-ui' in response.content.decode().lower()
