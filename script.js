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



  // Calculadora estadística rápida: procesa números localmente en el navegador.
  const dataValuesInput = document.getElementById("dataValues");
  const calculateDataButton = document.getElementById("calculateData");
  const loadSampleDataButton = document.getElementById("loadSampleData");
  const clearDataButton = document.getElementById("clearData");
  const exportExcelButton = document.getElementById("exportExcel");
  const calculatorResults = document.getElementById("calculatorResults");
  const calculatorError = document.getElementById("calculatorError");

  function medianOf(sortedValues) {
    const middle = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2
      ? sortedValues[middle]
      : (sortedValues[middle - 1] + sortedValues[middle]) / 2;
  }

  function formatStatistic(value) {
    if (!Number.isFinite(value)) return "No disponible";
    return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 6 }).format(value);
  }

  function renderStatistic(label, value, description) {
    const card = document.createElement("article");
    card.className = "stat-result";
    const title = document.createElement("span");
    title.textContent = label;
    const result = document.createElement("strong");
    result.textContent = value;
    const detail = document.createElement("small");
    detail.textContent = description || "";
    card.append(title, result, detail);
    return card;
  }

  function calculateData() {
    if (!dataValuesInput || !calculatorResults || !calculatorError) return;
    calculatorError.hidden = true;
    const raw = dataValuesInput.value.trim();
    if (!raw) {
      calculatorError.textContent = "Escribe o pega al menos un número para calcular.";
      calculatorError.hidden = false;
      return;
    }
    const tokens = raw.split(/[\s,;]+/).filter(Boolean);
    const values = tokens.map(token => Number(token));
    if (!values.length || values.some(value => !Number.isFinite(value))) {
      calculatorError.textContent = "Hay un valor no válido. Usa únicamente números y punto para los decimales; separa los datos con comas, espacios o saltos de línea.";
      calculatorError.hidden = false;
      return;
    }
    if (values.length > 100000) {
      calculatorError.textContent = "Para mantener la herramienta ágil, introduce como máximo 100,000 valores.";
      calculatorError.hidden = false;
      return;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((total, value) => total + value, 0);
    const mean = sum / count;
    const median = medianOf(sorted);
    const frequencies = new Map();
    values.forEach(value => frequencies.set(value, (frequencies.get(value) || 0) + 1));
    const highestFrequency = Math.max(...frequencies.values());
    const modes = highestFrequency > 1
      ? [...frequencies].filter(([, frequency]) => frequency === highestFrequency).map(([value]) => value).sort((a, b) => a - b)
      : [];
    const min = sorted[0];
    const max = sorted[count - 1];
    const range = max - min;
    const squaredDifferences = values.reduce((total, value) => total + (value - mean) ** 2, 0);
    const populationVariance = squaredDifferences / count;
    const sampleVariance = count > 1 ? squaredDifferences / (count - 1) : null;
    const lowerHalf = sorted.slice(0, Math.floor(count / 2));
    const upperHalf = sorted.slice(Math.ceil(count / 2));
    const q1 = lowerHalf.length ? medianOf(lowerHalf) : null;
    const q3 = upperHalf.length ? medianOf(upperHalf) : null;
    const results = [
      renderStatistic("Cantidad de datos", formatStatistic(count), "Valores ingresados"),
      renderStatistic("Suma", formatStatistic(sum), "Total de todos los valores"),
      renderStatistic("Media", formatStatistic(mean), "Promedio aritmético"),
      renderStatistic("Mediana", formatStatistic(median), "Valor central ordenado"),
      renderStatistic("Moda", modes.length ? modes.map(formatStatistic).join(", ") : "Sin moda", modes.length ? "Valor(es) más frecuente(s)" : "Ningún valor se repite"),
      renderStatistic("Mínimo", formatStatistic(min), "Valor más pequeño"),
      renderStatistic("Máximo", formatStatistic(max), "Valor más grande"),
      renderStatistic("Rango", formatStatistic(range), "Máximo menos mínimo"),
      renderStatistic("Q1", q1 === null ? "No disponible" : formatStatistic(q1), "Primer cuartil"),
      renderStatistic("Q3", q3 === null ? "No disponible" : formatStatistic(q3), "Tercer cuartil"),
      renderStatistic("Varianza poblacional", formatStatistic(populationVariance), "Divide entre N"),
      renderStatistic("Desv. estándar poblacional", formatStatistic(Math.sqrt(populationVariance)), "Raíz de la varianza poblacional"),
      renderStatistic("Varianza muestral", sampleVariance === null ? "No disponible" : formatStatistic(sampleVariance), "Divide entre n − 1"),
      renderStatistic("Desv. estándar muestral", sampleVariance === null ? "No disponible" : formatStatistic(Math.sqrt(sampleVariance)), "Requiere al menos 2 datos"),
      renderStatistic("Rango intercuartílico", q1 === null || q3 === null ? "No disponible" : formatStatistic(q3 - q1), "Q3 menos Q1"),
      renderStatistic("Coeficiente de variación", mean === 0 ? "No disponible" : formatStatistic(Math.sqrt(populationVariance) / Math.abs(mean) * 100) + " %", "Dispersión relativa respecto a la media"),
      renderStatistic("Suma de cuadrados", formatStatistic(values.reduce((total, value) => total + value * value, 0)), "Suma de cada valor elevado al cuadrado")
    ];
    calculatorResults.replaceChildren(...results);
    const sortedCard = renderStatistic("Datos ordenados", sorted.map(formatStatistic).join("   ·   "), "De menor a mayor");
    sortedCard.classList.add("stat-result-wide");
    calculatorResults.appendChild(sortedCard);
  }

  if (exportExcelButton) exportExcelButton.addEventListener("click", () => {
    if (!dataValuesInput || !calculatorResults || !calculatorError) return;
    calculatorError.hidden = true;
    const raw = dataValuesInput.value.trim();
    const tokens = raw.split(/[\s,;]+/).filter(Boolean);
    const values = tokens.map(Number);
    if (!raw || !values.length || values.some(value => !Number.isFinite(value)) || values.length > 100000) {
      calculatorError.textContent = !raw
        ? "Primero introduce tus datos para generar el archivo."
        : "Revisa los datos: deben ser números válidos y no superar 100,000 valores.";
      calculatorError.hidden = false;
      return;
    }
    if (!calculatorResults.querySelector(".stat-result")) calculateData();
    const cards = [...calculatorResults.querySelectorAll(".stat-result")];
    if (!cards.length) return;
    const summary = [["Indicador", "Resultado", "Descripción"]];
    cards.forEach(card => {
      const parts = card.querySelectorAll("span, strong, small");
      summary.push([parts[0].textContent, parts[1].textContent, parts[2].textContent]);
    });
    const original = [["N.º", "Valor"], ...values.map((value, index) => [index + 1, value])];
    const ordered = [["Posición", "Valor ordenado"], ...[...values].sort((a, b) => a - b).map((value, index) => [index + 1, value])];
    const stamp = new Date().toISOString().slice(0, 10);
    if (window.XLSX && XLSX.utils && XLSX.writeFile) {
      const workbook = XLSX.utils.book_new();
      const sheets = [
        ["Datos originales", original, [{ wch: 10 }, { wch: 18 }]],
        ["Resumen estadístico", summary, [{ wch: 32 }, { wch: 24 }, { wch: 42 }]],
        ["Datos ordenados", ordered, [{ wch: 14 }, { wch: 20 }]]
      ];
      sheets.forEach(([name, rows, widths]) => {
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet["!cols"] = widths;
        if (name !== "Resumen estadístico") sheet["!autofilter"] = { ref: "A1:B" + rows.length };
        XLSX.utils.book_append_sheet(workbook, sheet, name);
      });
      XLSX.writeFile(workbook, "analisis_de_datos_" + stamp + ".xlsx");
      return;
    }
    // Respaldo compatible con Excel si la biblioteca XLSX no carga.
    const csvRows = [
      ["DATOS ORIGINALES"], ...original, [],
      ["RESUMEN ESTADÍSTICO"], ...summary, [],
      ["DATOS ORDENADOS"], ...ordered
    ];
    const csv = "\\uFEFF" + csvRows.map(row => row.map(value => {
      const cell = String(value ?? "").replace(/"/g, '""');
      return '"' + cell + '"';
    }).join(",")).join("\\r\\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analisis_de_datos_" + stamp + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  const copyDataResultsButton = document.getElementById("copyDataResults");
  if (copyDataResultsButton && calculatorResults) copyDataResultsButton.addEventListener("click", async () => {
    const cards = [...calculatorResults.querySelectorAll(".stat-result")];
    if (!cards.length) {
      if (calculatorError) {
        calculatorError.textContent = "Primero calcula tus datos para poder copiar los resultados.";
        calculatorError.hidden = false;
      }
      return;
    }
    const summary = cards.map(card => {
      const parts = card.querySelectorAll("span, strong, small");
      return parts[0].textContent + ": " + parts[1].textContent + (parts[2].textContent ? " (" + parts[2].textContent + ")" : "");
    }).join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      copyDataResultsButton.textContent = "Copiado";
      window.setTimeout(() => { copyDataResultsButton.textContent = "Copiar resultados"; }, 1800);
    } catch (error) {
      if (calculatorError) {
        calculatorError.textContent = "No se pudo copiar automáticamente. Selecciona los resultados y cópialos manualmente.";
        calculatorError.hidden = false;
      }
    }
  });

  if (calculateDataButton) calculateDataButton.addEventListener("click", calculateData);
  if (dataValuesInput) dataValuesInput.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") calculateData();
  });
  if (loadSampleDataButton && dataValuesInput) loadSampleDataButton.addEventListener("click", () => {
    dataValuesInput.value = "12, 15, 18, 18, 20, 22, 25";
    calculateData();
  });
  if (clearDataButton && dataValuesInput && calculatorResults) clearDataButton.addEventListener("click", () => {
    dataValuesInput.value = "";
    calculatorResults.replaceChildren();
    const empty = document.createElement("div");
    empty.className = "calculator-empty";
    empty.textContent = "Tus resultados aparecerán aquí cuando ingreses datos.";
    calculatorResults.appendChild(empty);
    if (calculatorError) calculatorError.hidden = true;
    dataValuesInput.focus();
  });

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
