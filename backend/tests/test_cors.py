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


def test_any_local_port_is_allowed_in_development():
    """`next dev` 3000 band bo'lsa 3100 ga o'tadi — CORS buni to'smasligi kerak.

    Ilgari ro'yxatda faqat 3000 turardi va brauzerdan boradigan HAR BIR so'rov
    (dashboard, reyting, fanlar) bloklanardi. Buni sezish qiyin edi: login
    Next proksisi orqali server tomonidan ketadi va CORS ga tushmaydi, ya'ni
    kirish ishlagandek ko'rinar, ichkarida esa hech narsa yuklanmasdi.
    """
    import re

    from app.core.config import Settings

    dev = Settings()
    dev.APP_ENV = "development"
    pattern = re.compile(dev.cors_origin_regex)

    for origin in ("http://localhost:3000", "http://localhost:3100", "http://127.0.0.1:3001"):
        assert pattern.fullmatch(origin), f"{origin} bloklandi"


def test_production_does_not_trust_arbitrary_hosts():
    """Lokal kengaytma productionga o'tib ketmasligi kerak."""
    import re

    from app.core.config import Settings

    prod = Settings()
    prod.APP_ENV = "production"
    pattern = re.compile(prod.cors_origin_regex)

    assert pattern.fullmatch("https://voxy-frontend.onrender.com")
    assert not pattern.fullmatch("http://localhost:3100")
    assert not pattern.fullmatch("https://evil.example.com")
    assert not pattern.fullmatch("http://evil.com:3100")
