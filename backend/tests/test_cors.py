"""CORS: `*` o'rniga aniq ro'yxat ishlayotganini tekshiradi."""


def _preflight(client, origin: str):
    return client.options(
        "/api/auth/login",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )


def test_local_frontend_origin_is_allowed(client):
    res = _preflight(client, "http://localhost:3000")
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert res.headers.get("access-control-allow-credentials") == "true"


def test_render_frontend_origin_is_allowed(client):
    res = _preflight(client, "https://voxy-frontend.onrender.com")
    assert res.headers.get("access-control-allow-origin") == "https://voxy-frontend.onrender.com"


def test_unknown_origin_is_not_allowed(client):
    res = _preflight(client, "https://zararli-sayt.example")
    assert res.headers.get("access-control-allow-origin") is None


def test_wildcard_origin_is_never_returned(client):
    res = _preflight(client, "http://localhost:3000")
    assert res.headers.get("access-control-allow-origin") != "*"
