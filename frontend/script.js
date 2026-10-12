
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

        const label = document.createElement("label");
        label.textContent = task.title;

        const remove = document.createElement("button");
        remove.className = "delete-btn";
        remove.textContent = "Delete";
        remove.addEventListener("click", () => {
            tasks.splice(index, 1);
            saveTasks();
        });

        row.append(checkbox, label, remove);
        taskList.appendChild(row);
    });

    const completed = tasks.filter(task => task.done).length;
    document.getElementById("total-tasks").textContent = tasks.length;
    document.getElementById("completed-tasks").textContent = completed;
    document.getElementById("completion-rate").textContent =
        tasks.length ? Math.round(completed / tasks.length * 100) + "%" : "0%";
}

function saveTasks() {
    localStorage.setItem("studyTasks", JSON.stringify(tasks));
    renderTasks();
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
        const title = prompt("Enter your study task:");
        if (title && title.trim()) {
            tasks.push({ title: title.trim(), done: false });
            saveTasks();
        }
    } else if (page !== "dashboard") {
        alert("This feature will be developed in our next steps!");
    }
}

navButtons.forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.page));
});

document.getElementById("start-btn").addEventListener("click", () => {
    openPage("planner");
});

renderTasks();