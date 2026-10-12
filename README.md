
# StudyMate AI 🎓

StudyMate AI is a web-based study assistant designed to help students organize study tasks and learn more effectively.

## Features

1. Dashboard with task statistics
2. Study planner with task creation, completion, and deletion
3. Gemini-powered AI study chat
4. AI notes summarizer
5. AI multiple-choice quiz generator
6. Progress tracker with subject breakdown
7. Study reminders with browser notifications

## Technology Stack

- HTML, CSS, JavaScript
- Python and Flask
- Google Gemini API
- Browser localStorage

## Setup

1. Install Python.
2. Install the backend packages:

   `python -m pip install -r backend/requirements.txt`

3. Create `backend/.env` and add your private API key:

   `GEMINI_API_KEY=your_actual_key_here`

4. Start the backend from the project root:

   `python backend/app.py`

5. Open `frontend/index.html` using VS Code Live Server.

Keep the backend running while using the AI features.

## Security

Never commit your API key or `.env` file. Browser storage is local to the browser and is not a cloud database. Before public deployment, configure production hosting, restrict CORS, and add suitable authentication and rate limiting.
## Deployment Links

- **StudyMate AI Backend:** https://studymate-ai-backend-3fnb.onrender.com/
- **Backend Health Check:** https://studymate-ai-backend-3fnb.onrender.com/api/health

