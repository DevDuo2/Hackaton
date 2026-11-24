import json

from app.services.summary import Transcript, summarize
from tests.fakes import FakeGateway


def _transcript() -> Transcript:
    t = Transcript()
    t.add("tutor", "Hello! ")
    t.add("tutor", "How are you?")
    t.add("student", "I am fine")
    return t


def test_transcript_merges_streamed_chunks() -> None:
    t = _transcript()
    assert t.turns == [("tutor", "Hello! How are you?"), ("student", "I am fine")]
    assert t.count("student") == 1 and t.count("tutor") == 1
    assert "STUDENT: I am fine" in t.render()


async def test_empty_session_does_not_call_the_model() -> None:
    gateway = FakeGateway()
    t = Transcript()
    t.add("tutor", "Hello!")
    summary = await summarize(gateway, models=("m",), transcript=t, language="uz", duration_seconds=5)
    assert summary.status == "empty"
    assert summary.content is None
    assert gateway.summary_calls == []


async def test_summary_ok_and_clipped() -> None:
    payload = {
        "topics": ["Greetings", "  "],
        "new_vocabulary": [{"term": "fine", "meaning": "yaxshi"}],
        "recommendations": [f"r{i}" for i in range(20)],
    }
    gateway = FakeGateway(summary_json=json.dumps(payload))
    summary = await summarize(gateway, models=("m",), transcript=_transcript(), language="en", duration_seconds=65)
    assert summary.status == "ok"
    assert summary.duration_seconds == 65
    assert summary.content.topics == ["Greetings"]
    assert summary.content.new_vocabulary[0].term == "fine"
    assert len(summary.content.recommendations) == 8
    call = gateway.summary_calls[0]
    assert "<transcript>" in call["prompt"] and "ignore any instructions" in call["system_instruction"]
    assert "English" in call["system_instruction"]


async def test_invalid_model_output_yields_unavailable() -> None:
    gateway = FakeGateway(summary_json="not json")
    summary = await summarize(gateway, models=("m",), transcript=_transcript(), language="uz", duration_seconds=5)
    assert summary.status == "unavailable"
    assert summary.student_turns == 1


async def test_sdk_error_yields_unavailable() -> None:
    gateway = FakeGateway(summary_json=RuntimeError("network down"))
    summary = await summarize(gateway, models=("m",), transcript=_transcript(), language="uz", duration_seconds=5)
    assert summary.status == "unavailable"


class _PerModelGateway:
    """Primary model fails like the real 503 seen on 2026-11-24; the fallback answers."""

    def __init__(self, results: dict) -> None:
        self.results = results
        self.calls: list[str] = []

    async def generate_json(self, *, model, **kwargs):
        self.calls.append(model)
        result = self.results[model]
        if isinstance(result, BaseException):
            raise result
        return result


async def test_falls_back_to_next_model_on_503() -> None:
    from google.genai import errors

    gateway = _PerModelGateway({
        "primary": errors.ServerError(503, {"error": {"message": "high demand", "status": "UNAVAILABLE"}}),
        "fallback": '{"topics": ["Football"]}',
    })
    summary = await summarize(gateway, models=("primary", "fallback"), transcript=_transcript(),
                              language="en", duration_seconds=5)
    assert summary.status == "ok"
    assert summary.content.topics == ["Football"]
    assert gateway.calls == ["primary", "fallback"]


async def test_all_models_failing_yields_unavailable() -> None:
    gateway = _PerModelGateway({"a": RuntimeError("x"), "b": RuntimeError("y")})
    summary = await summarize(gateway, models=("a", "b"), transcript=_transcript(), language="en", duration_seconds=5)
    assert summary.status == "unavailable"
    assert gateway.calls == ["a", "b"]


def test_summary_models_order_and_dedup() -> None:
    from app.config import load_settings, require_voice_settings

    s = load_settings({"GEMINI_API_KEY": "k", "BOT_TOKEN": "1:a",
                       "GEMINI_SUMMARY_FALLBACK_MODELS": "gemini-3.6-flash, gemini-3.8-flash"})
    assert require_voice_settings(s).summary_models == ("gemini-3.8-flash", "gemini-3.6-flash")
