import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client() -> TestClient:
    with TestClient(create_app()) as c:  # `with` runs startup/shutdown
        yield c


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "voxy-backend"}


def test_root_redirects_to_miniapp(client: TestClient) -> None:
    response = client.get("/", follow_redirects=False)
    assert response.status_code in (302, 307)
    assert response.headers["location"] == "/miniapp/"


def test_miniapp_index_loads(client: TestClient) -> None:
    response = client.get("/miniapp/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    html = response.text
    assert "<title>VOXY</title>" in html
    assert 'id="start-button"' in html
    assert 'id="end-button"' in html
    assert 'id="mic-button"' in html
    assert "telegram-web-app.js" in html


@pytest.mark.parametrize(
    ("path", "content_type"),
    [
        ("/miniapp/style.css", "text/css"),
        ("/miniapp/app.js", "javascript"),
        ("/miniapp/mic.js", "javascript"),
    ],
)
def test_miniapp_assets_load(client: TestClient, path: str, content_type: str) -> None:
    response = client.get(path)
    assert response.status_code == 200
    assert content_type in response.headers["content-type"]


def test_hidden_attribute_is_enforced_in_css(client: TestClient) -> None:
    # Regression: `.field { display: flex }` overrode [hidden], so the subject picker stayed visible
    # in English Speaking mode.
    css = client.get("/miniapp/style.css").text
    assert "[hidden]" in css and "display: none !important" in css


def test_miniapp_does_not_auto_start_microphone(client: TestClient) -> None:
    # getUserMedia may only be reached through Microphone.start(), which app.js calls from click handlers.
    app_js = client.get("/miniapp/app.js").text
    assert "getUserMedia" not in app_js
    assert 'ui.start.addEventListener("click", startConversation)' in app_js
