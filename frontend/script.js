
"use strict";

const API_BASE = "http://127.0.0.1:5000";
const TASKS_KEY = "studyMateTasksV2";
const REMINDERS_KEY = "studyMateRemindersV1";

const pageTitles = {
    dashboard: "Dashboard",
    planner: "Study Planner",
    chatbot: "AI Study Chat",
    notes: "Notes Summarizer",
    quiz: "Quiz Generator",
    progress: "Progress Tracker",
    reminders: "Study Reminders"
};

let tasks = readStorage(TASKS_KEY);
let reminders = readStorage(REMINDERS_KEY);
let reminderTimer = null;

function readStorage(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Browser storage error:", error);
        return false;
    }
}

function setStatus(element, message, type = "") {
    if (!element) return;
    element.textContent = message;
    element.className = "status-message" + (type ? " " + type : "");
}

function makeId() {
    return typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(16).slice(2);
}

function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/* NAVIGATION: all seven pages */
function showPage(page) {
    if (!pageTitles[page]) page = "dashboard";

    document.querySelectorAll(".page-section").forEach(section => {
        section.hidden = section.id !== `${page}-page`;
    });

    document.querySelectorAll(".nav-link").forEach(button => {
        const active = button.dataset.page === page;
        button.classList.toggle("active", active);

        if (active) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
    });

    document.getElementById("page-title").textContent = pageTitles[page];

    if (page === "planner") renderTaskList("planner-task-list");
    if (page === "progress") renderProgress();
    if (page === "reminders") renderReminders();
}

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.page));
});

/* TASKS AND STUDY PLANNER */
function addTask(title, subject, dueDate, statusElement) {
    title = title.trim();

    if (!title) {
        setStatus(statusElement, "Please enter a task name.", "error");
        return false;
    }

    tasks.unshift({
        id: makeId(),
        title,
        subject: subject.trim() || "General",
        dueDate: dueDate || "",
        done: false,
        createdAt: new Date().toISOString()
    });

    const saved = saveStorage(TASKS_KEY, tasks);
    renderAllTasks();

    setStatus(
        statusElement,
        saved ? "Task added successfully!" :
            "Task added, but browser storage is unavailable.",
        saved ? "success" : "error"
    );

    return true;
}

document.getElementById("task-form").addEventListener("submit", event => {
    event.preventDefault();

    const form = event.currentTarget;
    const added = addTask(
        document.getElementById("task-title").value,
        document.getElementById("task-subject").value,
        document.getElementById("task-due-date").value,
        document.getElementById("form-message")
    );

    if (added) form.reset();
});

document.getElementById("planner-task-form").addEventListener("submit", event => {
    event.preventDefault();

    const form = event.currentTarget;
    const added = addTask(
        document.getElementById("planner-task-title").value,
        document.getElementById("planner-task-subject").value,
        document.getElementById("planner-task-date").value,
        document.getElementById("planner-message")
    );

    if (added) form.reset();
});

function renderTaskList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.replaceChildren();

    if (tasks.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "No tasks yet. Add a task to get started.";
        container.appendChild(empty);
        return;
    }

    tasks.forEach(task => {
        const row = document.createElement("div");
        row.className = "task-item" + (task.done ? " done" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(task.done);
        checkbox.setAttribute("aria-label", `Complete ${task.title}`);

        checkbox.addEventListener("change", () => {
            const selected = tasks.find(item => item.id === task.id);
            if (selected) selected.done = checkbox.checked;

            saveStorage(TASKS_KEY, tasks);
            renderAllTasks();
        });

        const copy = document.createElement("div");
        copy.className = "task-copy";

        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = task.title;

        const meta = document.createElement("div");
        meta.className = "task-meta";
        meta.textContent =
            `${task.subject || "General"}` +
            (task.dueDate ? ` · Due ${task.dueDate}` : "");

        copy.append(title, meta);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "task-delete";
        remove.textContent = "Delete";
        remove.setAttribute("aria-label", `Delete ${task.title}`);

        remove.addEventListener("click", () => {
            tasks = tasks.filter(item => item.id !== task.id);
            saveStorage(TASKS_KEY, tasks);
            renderAllTasks();
        });

        row.append(checkbox, copy, remove);
        container.appendChild(row);
    });
}

/* DASHBOARD STATISTICS */
function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.done).length;
    const remaining = total - completed;
    const percentage = total
        ? Math.round((completed / total) * 100)
        : 0;

    document.getElementById("total-tasks").textContent = total;
    document.getElementById("completed-tasks").textContent = completed;
    document.getElementById("completion-rate").textContent = `${percentage}%`;

    document.getElementById("progress-total").textContent = total;
    document.getElementById("progress-completed").textContent = completed;
    document.getElementById("progress-remaining").textContent = remaining;
    document.getElementById("progress-percent").textContent = `${percentage}%`;
    document.getElementById("progress-bar").style.width = `${percentage}%`;

    const caption = document.getElementById("progress-caption");
    caption.textContent = total === 0
        ? "Add tasks to start tracking your progress."
        : percentage === 100
            ? "Amazing! You completed every task."
            : `${completed} of ${total} tasks completed. Keep going!`;
}

function renderProgress() {
    renderStats();
    renderTaskList("progress-task-list");

    const breakdown = document.getElementById("subject-breakdown");
    breakdown.replaceChildren();

    if (tasks.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "Subject statistics appear after you add tasks.";
        breakdown.appendChild(empty);
        return;
    }

    const groups = {};

    tasks.forEach(task => {
        const subject = task.subject || "General";

        if (!groups[subject]) {
            groups[subject] = { total: 0, completed: 0 };
        }

        groups[subject].total++;

        if (task.done) groups[subject].completed++;
    });

    Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([subject, values]) => {
            const row = document.createElement("div");
            row.className = "breakdown-row";

            const name = document.createElement("span");
            name.textContent = subject;

            const track = document.createElement("div");
            track.className = "breakdown-track";

            const fill = document.createElement("div");
            fill.className = "breakdown-fill";
            fill.style.width =
                `${Math.round(values.completed / values.total * 100)}%`;

            track.appendChild(fill);

            const count = document.createElement("strong");
            count.textContent = `${values.completed}/${values.total}`;

            row.append(name, track, count);
            breakdown.appendChild(row);
        });
}

function renderAllTasks() {
    renderTaskList("task-list");
    renderTaskList("planner-task-list");
    renderStats();

    if (!document.getElementById("progress-page").hidden) {
        renderProgress();
    }
}

/* SHARED BACKEND REQUEST FUNCTION */
async function postJSON(endpoint, payload) {
    let response;

    try {
        response = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } catch {
        throw new Error(
            "Cannot connect to the backend. Run python backend/app.py in VS Code."
        );
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("The backend returned an unexpected response.");
    }

    if (!response.ok) {
        throw new Error(data.error || "The request failed.");
    }

    return data;
}

/* 3. AI STUDY CHAT */
function addChatMessage(text, type) {
    const messages = document.getElementById("chat-messages");

    const bubble = document.createElement("div");
    bubble.className = `chat-message ${type}`;

    const label = document.createElement("strong");
    label.textContent = type === "user-message" ? "You" : "StudyMate AI";

    const paragraph = document.createElement("p");
    paragraph.textContent = text;

    bubble.append(label, paragraph);
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
}

document.getElementById("chat-form").addEventListener("submit", async event => {
    event.preventDefault();

    const input = document.getElementById("chat-input");
    const send = document.getElementById("chat-send");
    const status = document.getElementById("chat-status");
    const message = input.value.trim();

    if (!message) return;

    addChatMessage(message, "user-message");
    input.value = "";
    input.disabled = true;
    send.disabled = true;

    setStatus(status, "StudyMate is thinking...");

    try {
        const data = await postJSON("/api/chat", { message });
        addChatMessage(data.reply, "bot-message");
        setStatus(status, "");
    } catch (error) {
        setStatus(status, error.message, "error");
    } finally {
        input.disabled = false;
        send.disabled = false;
        input.focus();
    }
});

/* 4. NOTES SUMMARIZER */
document.getElementById("notes-form").addEventListener("submit", async event => {
    event.preventDefault();

    const notes = document.getElementById("notes-input").value.trim();
    const button = document.getElementById("summarize-button");
    const status = document.getElementById("notes-status");
    const result = document.getElementById("summary-result");

    if (!notes) {
        setStatus(status, "Please paste your notes first.", "error");
        return;
    }

    button.disabled = true;
    button.textContent = "Summarizing...";
    result.hidden = true;
    setStatus(status, "Creating your revision summary...");

    try {
        const data = await postJSON("/api/summarize", { notes });

        document.getElementById("summary-text").textContent = data.summary;
        result.hidden = false;
        setStatus(status, "Summary ready!", "success");
    } catch (error) {
        setStatus(status, error.message, "error");
    } finally {
        button.disabled = false;
        button.textContent = "Summarize notes ✨";
    }
});

/* 5. QUIZ GENERATOR */
document.getElementById("quiz-form").addEventListener("submit", async event => {
    event.preventDefault();

    const topic = document.getElementById("quiz-topic").value.trim();
    const source_text = document.getElementById("quiz-source").value.trim();
    const count = Number(document.getElementById("quiz-count").value);
    const button = document.getElementById("quiz-button");
    const status = document.getElementById("quiz-status");
    const result = document.getElementById("quiz-result");

    if (!topic && !source_text) {
        setStatus(status, "Enter a topic or paste notes first.", "error");
        return;
    }

    button.disabled = true;
    button.textContent = "Generating...";
    result.hidden = true;
    setStatus(status, "Preparing your practice questions...");

    try {
        const data = await postJSON("/api/quiz", {
            topic,
            source_text,
            count
        });

        document.getElementById("quiz-text").textContent = data.quiz;
        result.hidden = false;
        setStatus(status, "Your quiz is ready!", "success");
    } catch (error) {
        setStatus(status, error.message, "error");
    } finally {
        button.disabled = false;
        button.textContent = "Generate quiz ✨";
    }
});

/* COPY SUMMARIES AND QUIZZES */
async function copyText(text, statusId) {
    const status = document.getElementById(statusId);

    try {
        await navigator.clipboard.writeText(text);
        setStatus(status, "Copied to clipboard!", "success");
    } catch {
        setStatus(
            status,
            "Clipboard access was blocked. Select the text and copy it manually.",
            "error"
        );
    }
}

document.getElementById("copy-summary").addEventListener("click", () => {
    copyText(document.getElementById("summary-text").textContent, "notes-status");
});

document.getElementById("copy-quiz").addEventListener("click", () => {
    copyText(document.getElementById("quiz-text").textContent, "quiz-status");
});

/* 7. STUDY REMINDERS */
document.getElementById("reminder-form").addEventListener("submit", event => {
    event.preventDefault();

    const title = document.getElementById("reminder-title").value.trim();
    const date = document.getElementById("reminder-date").value;
    const time = document.getElementById("reminder-time").value;
    const status = document.getElementById("reminder-status");

    if (!title || !date || !time) {
        setStatus(status, "Fill in the reminder, date, and time.", "error");
        return;
    }

    const due = new Date(`${date}T${time}`);

    if (Number.isNaN(due.getTime()) || due.getTime() <= Date.now()) {
        setStatus(status, "Choose a valid future date and time.", "error");
        return;
    }

    reminders.push({
        id: makeId(),
        title,
        date,
        time,
        notified: false
    });

    reminders.sort((a, b) =>
        new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
    );

    const saved = saveStorage(REMINDERS_KEY, reminders);
    event.currentTarget.reset();
    setStatus(
        status,
        saved ? "Reminder saved!" : "Reminder saved for this session only.",
        saved ? "success" : "error"
    );

    renderReminders();
});

function renderReminders() {
    const list = document.getElementById("reminder-list");
    list.replaceChildren();

    if (reminders.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "No reminders yet. Add one above.";
        list.appendChild(empty);
        return;
    }

    reminders.forEach(reminder => {
        const due = new Date(`${reminder.date}T${reminder.time}`);
        const row = document.createElement("div");

        row.className = "reminder-item" + (due < new Date() ? " past" : "");

        const icon = document.createElement("div");
        icon.className = "reminder-icon";
        icon.textContent = "⏰";

        const copy = document.createElement("div");
        copy.className = "reminder-copy";

        const title = document.createElement("strong");
        title.textContent = reminder.title;

        const detail = document.createElement("small");
        detail.textContent =
            `${reminder.date} at ${reminder.time}` +
            (reminder.notified ? " · Notification sent" : "");

        copy.append(title, detail);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "task-delete";
        remove.textContent = "Delete";
        remove.setAttribute("aria-label", `Delete reminder ${reminder.title}`);

        remove.addEventListener("click", () => {
            reminders = reminders.filter(item => item.id !== reminder.id);
            saveStorage(REMINDERS_KEY, reminders);
            renderReminders();
        });

        row.append(icon, copy, remove);
        list.appendChild(row);
    });
}

document.getElementById("enable-notifications").addEventListener("click", async () => {
    const status = document.getElementById("reminder-status");

    if (!("Notification" in window)) {
        setStatus(
            status,
            "This browser does not support notifications. Your reminders remain listed here.",
            "error"
        );
        return;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            setStatus(
                status,
                "Notifications enabled. Keep the dashboard open for reminders.",
                "success"
            );
            checkReminders();
        } else {
            setStatus(
                status,
                "Notification permission was not granted. You can still view reminders here.",
                "error"
            );
        }
    } catch {
        setStatus(status, "Could not enable browser notifications.", "error");
    }
});

function checkReminders() {
    const now = Date.now();
    let changed = false;

    reminders.forEach(reminder => {
        const due = new Date(`${reminder.date}T${reminder.time}`).getTime();

        // Notify once for reminders that became due within the last minute.
        if (!reminder.notified && due <= now && due > now - 60_000) {
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("StudyMate AI reminder", {
                    body: reminder.title
                });
            }

            reminder.notified = true;
            changed = true;
        }
    });

    if (changed) {
        saveStorage(REMINDERS_KEY, reminders);
        renderReminders();
    }
}

function startReminderChecks() {
    if (reminderTimer) clearInterval(reminderTimer);
    checkReminders();
    reminderTimer = setInterval(checkReminders, 15000);
}

/* INITIALIZATION */
function initializeDates() {
    const today = localDateString();

    document.getElementById("task-due-date").min = today;
    document.getElementById("planner-task-date").min = today;
    document.getElementById("reminder-date").min = today;
}

initializeDates();
renderAllTasks();
renderReminders();
showPage("dashboard");
startReminderChecks();