(() => {
  "use strict";
  const STORAGE_KEY = "camino-ciencia-datos-python-v1";
  const checks = Array.from(document.querySelectorAll("[data-lesson]"));
  const progressFill = document.getElementById("progressFill");
  const progressPercent = document.getElementById("progressPercent");
  const progressText = document.getElementById("progressText");
  const xpValue = document.getElementById("xpValue");
  const xpFill = document.getElementById("xpFill");
  const levelValue = document.getElementById("levelValue");
  const playerRank = document.getElementById("playerRank");
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

  function saveProgress() {
    const state = {};
    checks.forEach((check) => {
      state[check.dataset.lesson] = check.checked;
      check.closest(".lesson").classList.toggle("completed", check.checked);
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("El navegador no permitió guardar el progreso.", error);
    }
    updateProgress();
  }

  function updateProgress() {
    const total = checks.length;
    const done = checks.filter((check) => check.checked).length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    progressFill.style.width = percent + "%";
    progressPercent.textContent = percent + "%";
    progressText.textContent = done + " de " + total + " lecciones completadas";
    const xp = done * 100;
    const level = Math.floor(xp / 200) + 1;
    xpValue.textContent = xp + " XP";
    xpFill.style.width = ((xp % 200) / 200 * 100) + "%";
    levelValue.textContent = String(level).padStart(2, "0");
    playerRank.textContent = level >= 3 ? "RANGO 03 · ANALISTA" : level >= 2 ? "RANGO 02 · APRENDIZ" : "RANGO 01 · NOVATO";
  }

  function filterLessons() {
    const query = (searchInput.value || "").trim().toLocaleLowerCase("es");
    let visible = 0;
    lessonCards.forEach((card) => {
      const matches = (card.dataset.search + " " + card.textContent).toLocaleLowerCase("es").includes(query);
      card.hidden = !matches;
      if (matches) visible++;
    });
    lessonCount.textContent = visible + (visible === 1 ? " lección" : " lecciones");
    emptyState.hidden = visible !== 0;
  }

  checks.forEach((check) => check.addEventListener("change", saveProgress));
  searchInput.addEventListener("input", filterLessons);
  loadProgress();
  saveProgress();
  filterLessons();

  const menuToggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));
})();