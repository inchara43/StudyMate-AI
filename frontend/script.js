
"use strict";

// ===== 1. Get HTML Elements =====
const pageTitle = document.getElementById("page-title");
const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskSubject = document.getElementById("task-subject");
const taskDueDate = document.getElementById("task-due-date");
const taskList = document.getElementById("task-list");
const formMessage = document.getElementById("form-message");
const addTaskButton = document.getElementById("add-task-btn");

const navButtons = document.querySelectorAll(".nav[data-page]");
const pageButtons = document.querySelectorAll("[data-page]");

// ===== 2. Load Saved Tasks =====
let tasks = [];

try {
    const savedTasks = JSON.parse(
        localStorage.getItem("studyTasks") || "[]"
    );

    if (Array.isArray(savedTasks)) {
        tasks = savedTasks.filter(task =>
            task &&
            typeof task.title === "string"
        ).map(task => ({
            title: task.title,
            subject: typeof task.subject === "string" ? task.subject : "",
            dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
            done: Boolean(task.done)
        }));
    }
} catch (error) {
    console.error("Could not load saved tasks:", error);
}

// ===== 3. Display Messages =====
function showMessage(message, type = "success") {
    formMessage.textContent = message;
    formMessage.className = type;
}

// ===== 4. Update Statistics =====
function updateStatistics() {
    const completed = tasks.filter(task => task.done).length;

    document.getElementById("total-tasks").textContent = tasks.length;
    document.getElementById("completed-tasks").textContent = completed;

    const percentage = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    document.getElementById("completion-rate").textContent =
        percentage + "%";

    document.getElementById("task-count-label").textContent =
        tasks.length + (tasks.length === 1 ? " task" : " tasks");
}

// ===== 5. Render Task List =====
function renderTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty";
        emptyMessage.textContent = "No tasks yet. Add your first task!";
        taskList.appendChild(emptyMessage);
    }

    tasks.forEach((task, index) => {
        const row = document.createElement("div");
        row.className = "task-row" + (task.done ? " done" : "");

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.setAttribute("aria-label", "Mark task complete");

        checkbox.addEventListener("change", () => {
            tasks[index].done = checkbox.checked;

            if (saveTasks()) {
                showMessage(
                    checkbox.checked
                        ? "Task marked as completed!"
                        : "Task marked as incomplete.",
                    "success"
                );
            }
        });

        // Task information
        const details = document.createElement("div");
        details.className = "task-details";

        const label = document.createElement("label");
        label.textContent = task.title;
        details.appendChild(label);

        if (task.subject) {
            const subject = document.createElement("small");
            subject.textContent = "Subject: " + task.subject;
            details.appendChild(subject);
        }

        if (task.dueDate) {
            const date = document.createElement("small");
            date.textContent = "Due: " + task.dueDate;
            details.appendChild(date);
        }

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", "Delete " + task.title);

        deleteButton.addEventListener("click", () => {
            const removedTask = tasks.splice(index, 1)[0];

            if (!saveTasks()) {
                tasks.splice(index, 0, removedTask);
                renderTasks();
                return;
            }

            showMessage("Task deleted successfully.", "success");
        });

        row.append(checkbox, details, deleteButton);
        taskList.appendChild(row);
    });

    updateStatistics();
}

// ===== 6. Save Tasks =====
function saveTasks() {
    try {
        localStorage.setItem("studyTasks", JSON.stringify(tasks));
        renderTasks();
        return true;
    } catch (error) {
        console.error("Could not save tasks:", error);
        showMessage(
            "Could not save tasks. Check your browser storage settings.",
            "error"
        );
        return false;
    }
}

// ===== 7. Add a New Task =====
taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = taskTitle.value.trim();
    const subject = taskSubject.value.trim();
    const dueDate = taskDueDate.value;

    if (!title) {
        showMessage("Please enter a task name.", "error");
        taskTitle.focus();
        return;
    }

    // Do not allow past due dates
    if (dueDate) {
        const selectedDate = new Date(dueDate + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (
            Number.isNaN(selectedDate.getTime()) ||
            selectedDate < today
        ) {
            showMessage(
                "Please choose today or a future due date.",
                "error"
            );
            taskDueDate.focus();
            return;
        }
    }

    const newTask = {
        title: title,
        subject: subject,
        dueDate: dueDate,
        done: false
    };

    tasks.push(newTask);
    addTaskButton.disabled = true;

    if (!saveTasks()) {
        tasks.pop();
        renderTasks();
        addTaskButton.disabled = false;
        return;
    }

    taskForm.reset();
    showMessage("Task added successfully!", "success");
    addTaskButton.disabled = false;
    taskTitle.focus();
});

// ===== 8. Sidebar Navigation =====
function openPage(page) {
    const titles = {
        dashboard: "Good to see you! 👋",
        planner: "Study Planner 📅",
        chatbot: "AI Study Chat 🤖",
        notes: "Notes Summarizer 📝",
        quiz: "Quiz Generator 🧠",
        progress: "My Progress 📊",
        reminders: "Reminders 🔔"
    };

    pageTitle.textContent = titles[page] || titles.dashboard;

    navButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    if (page === "planner") {
        document.getElementById("planner-panel").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        taskTitle.focus({ preventScroll: true });
    } else if (page !== "dashboard") {
        alert(
            titles[page] +
            " is not implemented yet. We'll build this feature next!"
        );
    }
}

pageButtons.forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.page);
    });
});

// ===== 9. Initial Setup =====
function initializeApp() {
    // Set today's date as the earliest selectable due date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    taskDueDate.min = `${year}-${month}-${day}`;

    renderTasks();
}

initializeApp();