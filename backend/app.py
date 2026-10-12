
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from google import genai

# Load API settings from backend/.env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

client = genai.Client(api_key=API_KEY) if API_KEY else None


def generate_ai_response(prompt):
    """Generate a response using the Gemini API."""

    if client is None:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. Add it to backend/.env."
        )

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    answer = getattr(response, "text", None)

    if not answer or not answer.strip():
        raise RuntimeError(
            "Gemini returned an empty response."
        )

    return answer.strip()


def get_string(data, key, limit):
    """Read and validate a string from request JSON."""

    value = data.get(key, "")

    if not isinstance(value, str):
        return ""

    return value.strip()[:limit]


def ai_error_response(feature, error):
    """Log the actual error and return a safe message to the frontend."""

    app.logger.exception("%s failed", feature)

    # The detailed error appears in the PowerShell terminal.
    # Do not send API keys or other secrets to the browser.
    message = str(error).lower()

    if "api_key_invalid" in message or "invalid api key" in message:
        user_message = (
            "Your Gemini API key appears to be invalid. "
            "Check backend/.env and verify your key in Google AI Studio."
        )
    elif "resource_exhausted" in message or "quota" in message or "429" in message:
        user_message = (
            "Gemini API quota or rate limit reached. "
            "Check your API usage and quota in Google AI Studio."
        )
    elif "permission_denied" in message or "403" in message:
        user_message = (
            "Gemini access was denied. Check your API key, "
            "project permissions, and model availability."
        )
    elif "not_found" in message or "404" in message:
        user_message = (
            f"The model '{MODEL}' may be unavailable to your API key. "
            "Check the model name and availability."
        )
    else:
        user_message = (
            "The AI request failed. Check the PowerShell terminal "
            "for the detailed error."
        )

    return jsonify({"error": user_message}), 502


# 1. Home route
@app.get("/")
def home():
    return jsonify({
        "message": "StudyMate AI backend is running!",
        "ai_configured": client is not None,
        "model": MODEL
    })


# 2. Health-check route
@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "message": "StudyMate AI backend is running!",
        "ai_configured": client is not None,
        "model": MODEL
    }), 200


# 3. AI Study Chat
@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = get_string(data, "message", 6000)

    if not message:
        return jsonify({
            "error": "Please enter a question."
        }), 400

    try:
        reply = generate_ai_response(
            "You are StudyMate AI, a friendly study assistant. "
            "Explain topics in simple English. Use examples and "
            "step-by-step explanations where helpful.\n\n"
            f"Student question:\n{message}"
        )

        return jsonify({"reply": reply})

    except Exception as error:
        return ai_error_response("Chat request", error)


# 4. Notes Summarizer
@app.post("/api/summarize")
def summarize():
    data = request.get_json(silent=True) or {}
    notes = get_string(data, "notes", 20000)

    if len(notes) < 10:
        return jsonify({
            "error": "Please paste at least a few lines of study notes."
        }), 400

    try:
        summary = generate_ai_response(
            "Summarize these study notes in simple English. Include "
            "a heading, key points, important definitions, and a "
            "short revision summary. Do not invent unsupported facts.\n\n"
            f"STUDY NOTES:\n{notes}"
        )

        return jsonify({"summary": summary})

    except Exception as error:
        return ai_error_response("Notes summarization", error)


# 5. Quiz Generator
@app.post("/api/quiz")
def quiz():
    data = request.get_json(silent=True) or {}

    topic = get_string(data, "topic", 500)
    notes = get_string(data, "source_text", 12000)

    try:
        count = int(data.get("count", 5))
    except (TypeError, ValueError):
        count = 5

    count = max(3, min(count, 10))

    if not topic and not notes:
        return jsonify({
            "error": "Enter a topic or paste notes to generate a quiz."
        }), 400

    material = f"Topic: {topic}\n"

    if notes:
        material += f"\nUse these notes as the main source:\n{notes}"

    prompt = (
        f"Create exactly {count} multiple-choice practice questions.\n"
        "For each question, provide four options labelled A, B, C, D, "
        "one correct answer, and a short explanation.\n"
        "Use this format:\n\n"
        "Q1. Question\n"
        "A. Option\nB. Option\nC. Option\nD. Option\n"
        "ANSWER: B\n"
        "EXPLANATION: Explain why the answer is correct.\n\n"
        "Repeat for every question. Keep the quiz educational and clear.\n\n"
        f"{material}"
    )

    try:
        quiz_text = generate_ai_response(prompt)
        return jsonify({"quiz": quiz_text})

    except Exception as error:
        return ai_error_response("Quiz generation", error)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)