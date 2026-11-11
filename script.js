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
