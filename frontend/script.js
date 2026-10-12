
const navButtons = document.querySelectorAll("[data-page]");
const pageTitle = document.getElementById("page-title");
const taskList = document.getElementById("task-list");

let tasks = JSON.parse(localStorage.getItem("studyTasks") || "[]");

function renderTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
        taskList.innerHTML =
            '<p class="empty">No tasks yet. Add your first task!</p>';
    }

    tasks.forEach((task, index) => {
        const row = document.createElement("div");
        row.className = "task-row" + (task.done ? " done" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.setAttribute("aria-label", "Mark task complete");

        checkbox.addEventListener("change", () => {
            tasks[index].done = checkbox.checked;
            saveTasks();
        });

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

        const remove = document.createElement("button");
        remove.className = "delete-btn";
        remove.textContent = "Delete";

        remove.addEventListener("click", () => {
            tasks.splice(index, 1);
            saveTasks();
        });

        row.append(checkbox, details, remove);
        taskList.appendChild(row);
    });

    const completed = tasks.filter(task => task.done).length;

    document.getElementById("total-tasks").textContent = tasks.length;
    document.getElementById("completed-tasks").textContent = completed;

    document.getElementById("completion-rate").textContent =
        tasks.length
            ? Math.round(completed / tasks.length * 100) + "%"
            : "0%";
}

function saveTasks() {
    localStorage.setItem("studyTasks", JSON.stringify(tasks));
    renderTasks();
}

function addTask() {
    const title = prompt("Enter your study task:");

    if (!title || !title.trim()) {
        return;
    }

    const subject = prompt("Enter the subject name:");

    if (subject === null) {
        return;
    }

    const dueDate = prompt("Enter the due date (YYYY-MM-DD), or leave blank:");

    if (dueDate === null) {
        return;
    }

    tasks.push({
        title: title.trim(),
        subject: subject.trim(),
        dueDate: dueDate.trim(),
        done: false
    });

    saveTasks();
}

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

    document.querySelectorAll(".nav").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    if (page === "planner") {
        addTask();
    } else if (page !== "dashboard") {
        alert("This feature will be developed in our next steps!");
    }
}

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.page);
    });
});

document.getElementById("start-btn").addEventListener("click", () => {
    addTask();
});

renderTasks();