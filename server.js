
const express = require("express");
const { createClient } = require("redis");
const { randomUUID } = require("crypto");

const app = express();
const PORT = 3000;

const redis = createClient({
  url: "redis://redis:6379"
});

redis.on("error", err => console.log("Redis Error:", err));

app.use(express.json());
app.use(express.static("public"));

async function getTasks() {
  return JSON.parse(await redis.get("tasks") || "[]");
}

async function saveTasks(tasks) {
  await redis.set("tasks", JSON.stringify(tasks));
}

app.get("/api/tasks", async (req, res) => {
  res.json(await getTasks());
});

app.post("/api/tasks", async (req, res) => {
  const { title, dueDate = "", priority = "medium" } = req.body;

  if (typeof title !== "string" || !title.trim() || title.trim().length > 100) {
    return res.status(400).json({ error: "할 일은 1~100자여야 합니다." });
  }

  if (!["low", "medium", "high"].includes(priority)) {
    return res.status(400).json({ error: "잘못된 우선순위입니다." });
  }

  if (typeof dueDate !== "string" ||
      (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate))) {
    return res.status(400).json({ error: "잘못된 마감일입니다." });
  }

  const tasks = await getTasks();

  const task = {
    id: randomUUID(),
    title: title.trim(),
    completed: false,
    dueDate,
    priority
  };

  tasks.push(task);
  await saveTasks(tasks);

  res.status(201).json(task);
});

app.patch("/api/tasks/:id", async (req, res) => {
  const tasks = await getTasks();
  const task = tasks.find(item => item.id === req.params.id);

  if (!task) {
    return res.status(404).json({ error: "할 일을 찾을 수 없습니다." });
  }

  task.completed = !task.completed;
  await saveTasks(tasks);

  res.json(task);
});

app.delete("/api/tasks/:id", async (req, res) => {
  const tasks = await getTasks();
  const updated = tasks.filter(item => item.id !== req.params.id);

  if (tasks.length === updated.length) {
    return res.status(404).json({ error: "할 일을 찾을 수 없습니다." });
  }

  await saveTasks(updated);
  res.json({ success: true });
});

async function startServer() {
  await redis.connect();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TaskFlow running on port ${PORT}`);
  });
}

startServer();
