(() => {
  "use strict";

  const STORAGE_KEY = "data-quest-practicas-v2";
  const checks = Array.from(document.querySelectorAll("[data-lesson]"));
  const progressFill = document.getElementById("progressFill");
  const progressPercent = document.getElementById("progressPercent");
  const progressText = document.getElementById("progressText");
  const searchInput = document.getElementById("lessonSearch");
  const lessonCount = document.getElementById("lessonCount");
  const emptyState = document.getElementById("emptyState");
  const lessonCards = Array.from(document.querySelectorAll(".lesson"));

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      checks.forEach((check) => {
        check.checked = saved[check.dataset.lesson] === true;
      });
    } catch (error) {
      console.warn("No fue posible recuperar el progreso guardado.", error);
    }
  }

  function updateProgress() {
    const total = checks.length;
    const done = checks.filter((check) => check.checked).length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    if (progressFill) progressFill.style.width = percent + "%";
    if (progressPercent) progressPercent.textContent = percent + "%";
    if (progressText) progressText.textContent = done + " de " + total + " prácticas completadas";

    checks.forEach((check) => {
      const card = check.closest(".lesson");
      if (card) card.classList.toggle("completed", check.checked);
    });
  }

  function saveProgress() {
    const state = {};
    checks.forEach((check) => {
      state[check.dataset.lesson] = check.checked;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("El navegador no permitió guardar el progreso.", error);
    }
    updateProgress();
  }

  function filterLessons() {
    if (!searchInput) return;
    const query = searchInput.value.trim().toLocaleLowerCase("es");
    let visible = 0;

    lessonCards.forEach((card) => {
      const searchableText = (card.dataset.search || "") + " " + card.textContent;
      const matches = searchableText.toLocaleLowerCase("es").includes(query);
      card.hidden = !matches;
      if (matches) visible++;
    });

    if (lessonCount) {
      lessonCount.textContent = visible + (visible === 1 ? " práctica" : " prácticas");
    }
    if (emptyState) emptyState.hidden = visible !== 0;
  }

  checks.forEach((check) => check.addEventListener("change", saveProgress));
  if (searchInput) searchInput.addEventListener("input", filterLessons);

  loadProgress();
  updateProgress();
  filterLessons();

  const menuToggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
      menuToggle.textContent = isOpen ? "×" : "☰";
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menú");
        menuToggle.textContent = "☰";
      });
    });
  }


  // Organizador semanal: las sesiones se guardan solo en este navegador.
  const PLANNER_KEY = "ciencia-datos-plan-semanal-v1";
  const plannerForm = document.getElementById("studyPlannerForm");
  const plannerList = document.getElementById("plannerList");
  const plannedTime = document.getElementById("plannedTime");
  const completedTime = document.getElementById("completedTime");
  const pendingCount = document.getElementById("pendingCount");
  const plannerProgressFill = document.getElementById("plannerProgressFill");
  const plannerProgressText = document.getElementById("plannerProgressText");
  const plannerDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  let studySessions = [];

  function savePlanner() {
    try { localStorage.setItem(PLANNER_KEY, JSON.stringify(studySessions)); }
    catch (error) { console.warn("No fue posible guardar el plan semanal.", error); }
  }

  function renderPlanner() {
    if (!plannerList) return;
    const total = studySessions.reduce((sum, item) => sum + item.minutes, 0);
    const done = studySessions.filter(item => item.done).reduce((sum, item) => sum + item.minutes, 0);
    const completedCount = studySessions.filter(item => item.done).length;
    const pending = studySessions.length - completedCount;
    if (plannedTime) plannedTime.textContent = (total / 60).toLocaleString("es-MX", { maximumFractionDigits: 1 }) + " h";
    if (completedTime) completedTime.textContent = done + " min";
    if (pendingCount) pendingCount.textContent = String(pending);
    const percent = total ? Math.round(done / total * 100) : 0;
    if (plannerProgressFill) plannerProgressFill.style.width = percent + "%";
    if (plannerProgressText) plannerProgressText.textContent = studySessions.length ? percent + "% del tiempo planeado completado" : "Aún no hay sesiones";
    plannerList.replaceChildren();
    if (!studySessions.length) {
      const empty = document.createElement("p");
      empty.className = "planner-empty";
      empty.textContent = "Todavía no tienes sesiones. Agrega la primera para empezar a organizarte.";
      plannerList.appendChild(empty);
      return;
    }
    plannerDays.forEach(day => {
      const sessions = studySessions.filter(item => item.day === day);
      if (!sessions.length) return;
      const group = document.createElement("section");
      group.className = "planner-day";
      const heading = document.createElement("h4");
      heading.textContent = day;
      group.appendChild(heading);
      sessions.forEach(item => {
        const row = document.createElement("article");
        row.className = "planner-session" + (item.done ? " is-done" : "");
        const label = document.createElement("label");
        label.className = "planner-session-label";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.done;
        checkbox.setAttribute("aria-label", "Marcar como completada: " + item.task);
        checkbox.addEventListener("change", () => {
          item.done = checkbox.checked;
          savePlanner();
          renderPlanner();
        });
        const title = document.createElement("span");
        title.textContent = item.task;
        label.append(checkbox, title);
        const duration = document.createElement("span");
        duration.className = "planner-duration";
        duration.textContent = item.minutes >= 60 ? (item.minutes / 60).toLocaleString("es-MX", { maximumFractionDigits: 1 }) + " h" : item.minutes + " min";
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "planner-remove";
        remove.textContent = "Quitar";
        remove.setAttribute("aria-label", "Quitar sesión: " + item.task);
        remove.addEventListener("click", () => {
          studySessions = studySessions.filter(session => session.id !== item.id);
          savePlanner();
          renderPlanner();
        });
        row.append(label, duration, remove);
        group.appendChild(row);
      });
      plannerList.appendChild(group);
    });
  }

  if (plannerForm) {
    try {
      const saved = JSON.parse(localStorage.getItem(PLANNER_KEY) || "[]");
      if (Array.isArray(saved)) studySessions = saved.filter(item =>
        item && typeof item.id === "string" && typeof item.task === "string" &&
        plannerDays.includes(item.day) && Number.isFinite(item.minutes) &&
        item.minutes > 0 && typeof item.done === "boolean"
      );
    } catch (error) {
      console.warn("No fue posible recuperar el plan semanal.", error);
    }
    plannerForm.addEventListener("submit", event => {
      event.preventDefault();
      const taskInput = document.getElementById("studyTask");
      const dayInput = document.getElementById("studyDay");
      const minutesInput = document.getElementById("studyMinutes");
      const task = taskInput.value.trim();
      const minutes = Number(minutesInput.value);
      if (!task || !plannerDays.includes(dayInput.value) || ![25, 50, 75, 100, 120].includes(minutes)) return;
      studySessions.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        task, day: dayInput.value, minutes, done: false
      });
      savePlanner();
      renderPlanner();
      plannerForm.reset();
      taskInput.focus();
    });
    renderPlanner();
  }

  // Asistente IA Data Quest: el endpoint se configura tras desplegar worker/worker.js.
  const CHAT_API_URL = window.DATA_QUEST_CHAT_API || "";
  const chatPanel = document.getElementById("dqChatPanel");
  const chatToggle = document.getElementById("dqChatToggle");
  const chatClose = document.getElementById("dqChatClose");
  const chatForm = document.getElementById("dqChatForm");
  const chatInput = document.getElementById("dqChatInput");
  const chatMessages = document.getElementById("dqChatMessages");
  const chatStatus = document.getElementById("dqChatStatus");
  const chatSend = document.getElementById("dqChatSend");
  const chatHistory = [];

  function setChatOpen(open) {
    if (!chatPanel || !chatToggle) return;
    chatPanel.hidden = !open;
    chatToggle.setAttribute("aria-expanded", String(open));
    chatToggle.classList.toggle("is-open", open);
    if (open && chatInput) chatInput.focus();
  }

  function addChatMessage(role, text) {
    const article = document.createElement("article");
    article.className = "dq-message " + (role === "assistant" ? "dq-assistant" : "dq-user");
    const label = document.createElement("span");
    label.className = "dq-message-label";
    label.textContent = role === "assistant" ? "DATA QUEST" : "TÚ";
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    article.append(label, paragraph);
    chatMessages.appendChild(article);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return article;
  }

  if (chatToggle && chatPanel) {
    chatToggle.addEventListener("click", () => setChatOpen(chatPanel.hidden));
    if (chatClose) chatClose.addEventListener("click", () => setChatOpen(false));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !chatPanel.hidden) setChatOpen(false);
    });
  }

  if (chatForm && chatInput) {
    chatForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const question = chatInput.value.trim();
      if (!question || chatSend.disabled) return;
      addChatMessage("user", question);
      chatInput.value = "";
      if (!CHAT_API_URL) {
        addChatMessage("assistant", "El panel ya está instalado, pero la conexión con la IA todavía no está activada. Falta desplegar el backend seguro y configurar su dirección. La clave API nunca debe escribirse aquí ni guardarse en GitHub.");
        chatStatus.textContent = "Conexión pendiente: consulta README.md, apartado «Activar el asistente IA».";
        return;
      }

      chatSend.disabled = true;
      chatInput.disabled = true;
      chatStatus.textContent = "Preparando respuesta…";
      const pending = addChatMessage("assistant", "Estoy revisando tu pregunta…");
      const messages = [...chatHistory, { role: "user", content: question }].slice(-10);
      try {
        const response = await fetch(CHAT_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "No fue posible obtener una respuesta.");
        const answer = typeof payload.answer === "string" ? payload.answer : "";
        if (!answer) throw new Error("La IA devolvió una respuesta vacía.");
        pending.querySelector("p").textContent = answer;
        chatHistory.push({ role: "user", content: question }, { role: "assistant", content: answer });
        while (chatHistory.length > 10) chatHistory.shift();
        chatStatus.textContent = "Asistente conectado · Verifica datos académicos en fuentes oficiales.";
      } catch (error) {
        pending.querySelector("p").textContent = "No pude conectar con el asistente. " + error.message + " Inténtalo de nuevo más tarde.";
        chatStatus.textContent = "No se pudo completar la consulta.";
      } finally {
        chatSend.disabled = false;
        chatInput.disabled = false;
        chatInput.focus();
      }
    });
    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatForm.requestSubmit();
      }
    });
  }

  const chatSuggestions = document.getElementById("dqChatSuggestions");
  if (chatSuggestions && chatInput) {
    chatSuggestions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-prompt]");
      if (!button) return;
      chatInput.value = button.dataset.prompt || "";
      chatInput.focus();
      chatInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
})();
