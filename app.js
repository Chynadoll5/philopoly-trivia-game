const DEMO_DATA = {
  settings: {
    gameTitle: "Family Trivia Night",
    subtitle: "Choose a category, pick a level, and answer before the buzzer.",
    timerSeconds: 30,
    allowSkips: true,
    showAnswerButton: true,
    defaultAnswerMode: "typed",
    allowModeSwitch: true,
    showEndGameButton: true,
    buzzerText: "Time!",
    primaryColor: "#2B0A3D",
    backgroundColor: "#050307",
    panelColor: "#12071A",
    creamColor: "#FFF4D6",
    goldColor: "#D8B35A",
    accentColor: "#4B1768",
    buttonTextColor: "#FFF4D6",
    acceptedVariationSeparator: "|"
  },
  categories: [
    {
      name: "Movies",
      questions: [
        { id: "demo-movies-1", level: "easy", question: "What movie features the song \"Hakuna Matata\"?", answer: "The Lion King", acceptedVariations: ["Lion King"] },
        { id: "demo-movies-2", level: "medium", question: "What fictional school does Harry Potter attend?", answer: "Hogwarts", acceptedVariations: ["Hogwarts School"] },
        { id: "demo-movies-3", level: "difficult", question: "What year did the first Jurassic Park movie release?", answer: "1993", acceptedVariations: ["nineteen ninety three"] }
      ]
    },
    {
      name: "Wild Card",
      questions: [
        { id: "demo-wild-1", level: "easy", question: "What color do you get when you mix red and blue?", answer: "Purple", acceptedVariations: ["violet"] },
        { id: "demo-wild-2", level: "medium", question: "What planet is known as the Red Planet?", answer: "Mars", acceptedVariations: [] },
        { id: "demo-wild-3", level: "difficult", question: "What is the chemical symbol for gold?", answer: "Au", acceptedVariations: ["A U"] }
      ]
    }
  ],
  generatedAt: "demo"
};

const config = window.TRIVIA_CONFIG || {};
const els = {};
const state = {
  data: null,
  selectedCategory: null,
  selectedLevel: null,
  activeQuestion: null,
  used: new Set(),
  timerId: null,
  timerSeconds: 30,
  remaining: 30,
  playMode: "typed",
  allowModeSwitch: true,
  audioContext: null
};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  loadUsedQuestions();
  loadGameData();
});

function cacheElements() {
  [
    "gameTitle",
    "subtitle",
    "syncStatus",
    "reloadButton",
    "resetUsedButton",
    "categoryGrid",
    "homeView",
    "questionView",
    "difficultySheet",
    "closeDifficultyButton",
    "backButton",
    "activeCategory",
    "activeLevel",
    "modeSwitch",
    "typedModeButton",
    "hostModeButton",
    "timerDial",
    "timerValue",
    "questionHeading",
    "poolCount",
    "answerForm",
    "answerInput",
    "hostControls",
    "hostCorrectButton",
    "hostMissedButton",
    "feedback",
    "answerPanel",
    "answerText",
    "nextButton",
    "selectAgainButton",
    "skipButton",
    "showAnswerButton",
    "restartTimerButton",
    "endGameButton",
    "endGameSheet",
    "closeEndGameButton",
    "endGameSummary",
    "resumeGameButton",
    "saveProgressButton",
    "newGameButton",
    "toast"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  els.reloadButton.addEventListener("click", loadGameData);
  els.resetUsedButton.addEventListener("click", resetUsedQuestions);
  els.closeDifficultyButton.addEventListener("click", closeDifficultySheet);
  els.backButton.addEventListener("click", showHome);
  els.typedModeButton.addEventListener("click", () => setPlayMode("typed"));
  els.hostModeButton.addEventListener("click", () => setPlayMode("host"));
  els.answerForm.addEventListener("submit", checkAnswer);
  els.nextButton.addEventListener("click", () => drawQuestion());
  els.selectAgainButton.addEventListener("click", selectAgain);
  els.skipButton.addEventListener("click", () => {
    showToast("Skipped");
    drawQuestion();
  });
  els.showAnswerButton.addEventListener("click", revealAnswer);
  els.hostCorrectButton.addEventListener("click", () => markHostResult(true));
  els.hostMissedButton.addEventListener("click", () => markHostResult(false));
  els.restartTimerButton.addEventListener("click", restartTimer);
  els.endGameButton.addEventListener("click", openEndGame);
  els.closeEndGameButton.addEventListener("click", () => closeEndGame(false));
  els.resumeGameButton.addEventListener("click", () => closeEndGame(true));
  els.saveProgressButton.addEventListener("click", saveProgressAndExit);
  els.newGameButton.addEventListener("click", startNewGame);
  document.querySelectorAll(".difficulty-button").forEach((button) => {
    button.addEventListener("click", () => startRound(button.dataset.level));
  });
}

async function loadGameData() {
  setStatus("Loading");
  stopTimer();
  try {
    if (config.dataUrl) {
      state.data = normalizePayload(await loadJsonp(config.dataUrl));
      setStatus("Live Sheet");
    } else if (config.useDemoDataWhenEmpty !== false) {
      state.data = normalizePayload(DEMO_DATA);
      setStatus("Demo Mode");
      showToast("Add your Apps Script URL in config.js when ready.");
    } else {
      throw new Error("No dataUrl set in config.js.");
    }
    applySettings();
    renderCategories();
    showHome();
  } catch (error) {
    console.error(error);
    setStatus("Data Error");
    showToast("Could not load questions. Check the Apps Script URL.");
  }
}

function loadJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `trivia_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const joiner = url.includes("?") ? "&" : "?";
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("The question database did not respond."));
    }, 15000);

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Could not load the question database."));
    };

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    script.src = `${url}${joiner}callback=${encodeURIComponent(callbackName)}&v=${Date.now()}`;
    document.body.appendChild(script);
  });
}

function normalizePayload(payload) {
  const categories = (payload.categories || [])
    .map((category) => ({
      name: String(category.name || "Category").trim(),
      questions: (category.questions || [])
        .filter((q) => q.question && q.answer)
        .filter((q) => !isTruthy(q.blocked))
        .map((q, index) => ({
          id: String(q.id || `${category.name}-${index}`),
          level: normalizeLevel(q.level),
          question: String(q.question),
          answer: String(q.answer),
          acceptedVariations: Array.isArray(q.acceptedVariations)
            ? q.acceptedVariations.map(String).filter(Boolean)
            : splitVariations(q.acceptedVariations)
        }))
    }))
    .filter((category) => category.questions.length);

  return {
    settings: payload.settings || {},
    categories,
    generatedAt: payload.generatedAt || new Date().toISOString()
  };
}

function applySettings() {
  const settings = state.data.settings;
  state.timerSeconds = numberSetting("timerSeconds", 30);
  els.gameTitle.textContent = textSetting("gameTitle", "Family Trivia Night");
  els.subtitle.textContent = textSetting("subtitle", "Choose a category, pick a level, and answer before the buzzer.");
  document.title = els.gameTitle.textContent;
  setCssVar("--primary", textSetting("primaryColor", "#2B0A3D"));
  setCssVar("--background", textSetting("backgroundColor", "#050307"));
  setCssVar("--panel", textSetting("panelColor", "#12071A"));
  setCssVar("--cream", textSetting("creamColor", "#FFF4D6"));
  setCssVar("--gold", textSetting("goldColor", "#D8B35A"));
  setCssVar("--accent", textSetting("accentColor", "#4B1768"));
  setCssVar("--button-text", textSetting("buttonTextColor", "#FFF4D6"));
  state.playMode = normalizePlayMode(window.localStorage.getItem(modeKey()) || textSetting("defaultAnswerMode", "typed"));
  state.allowModeSwitch = booleanSetting("allowModeSwitch", true);
  els.modeSwitch.hidden = !state.allowModeSwitch;
  els.skipButton.hidden = !booleanSetting("allowSkips", true);
  els.showAnswerButton.hidden = !booleanSetting("showAnswerButton", true);
  els.endGameButton.hidden = !booleanSetting("showEndGameButton", true);
  applyPlayMode();
}

function renderCategories() {
  els.categoryGrid.innerHTML = "";
  const allButton = createCategoryButton({
    name: "All Categories",
    questions: state.data.categories.flatMap((category) => category.questions)
  });
  allButton.dataset.category = "__all";
  els.categoryGrid.appendChild(allButton);

  state.data.categories.forEach((category) => {
    const button = createCategoryButton(category);
    button.dataset.category = category.name;
    els.categoryGrid.appendChild(button);
  });
}

function createCategoryButton(category) {
  const button = document.createElement("button");
  button.className = "category-button";
  button.type = "button";
  button.innerHTML = `<strong>${escapeHtml(category.name)}</strong><span>${category.questions.length} questions</span>`;
  button.addEventListener("click", () => {
    state.selectedCategory = button.dataset.category;
    openDifficultySheet(category.name);
  });
  return button;
}

function openDifficultySheet(categoryName) {
  els.difficultySheet.classList.remove("hidden");
  document.getElementById("difficultyTitle").textContent = categoryName;
}

function closeDifficultySheet() {
  els.difficultySheet.classList.add("hidden");
}

function startRound(level) {
  state.selectedLevel = normalizeLevel(level);
  closeDifficultySheet();
  els.homeView.classList.add("hidden");
  els.questionView.classList.remove("hidden");
  drawQuestion();
}

function drawQuestion() {
  const pool = getCurrentPool();
  if (!pool.length) {
    stopTimer();
    clearQuestion();
    showToast("No questions found for that choice.");
    return;
  }

  let available = pool.filter((question) => !state.used.has(question.id));
  if (!available.length) {
    pool.forEach((question) => state.used.delete(question.id));
    available = [...pool];
    showToast("That question set has refreshed.");
  }

  state.activeQuestion = available[Math.floor(Math.random() * available.length)];
  state.used.add(state.activeQuestion.id);
  saveUsedQuestions();
  renderQuestion(pool);
  restartTimer();
}

function getCurrentPool() {
  const categories = state.selectedCategory === "__all"
    ? state.data.categories
    : state.data.categories.filter((category) => category.name === state.selectedCategory);

  return categories.flatMap((category) =>
    category.questions
      .filter((question) => state.selectedLevel === "surprise" || question.level === state.selectedLevel)
      .map((question) => ({ ...question, categoryName: category.name }))
  );
}

function renderQuestion(pool) {
  const question = state.activeQuestion;
  els.activeCategory.textContent = question.categoryName;
  els.activeLevel.textContent = displayLevel(state.selectedLevel);
  els.questionHeading.textContent = question.question;
  els.answerInput.value = "";
  els.answerInput.disabled = false;
  els.answerText.textContent = question.answer;
  els.answerPanel.classList.add("hidden");
  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  applyPlayMode();
  updatePoolCount(pool);
}

function clearQuestion() {
  state.activeQuestion = null;
  els.questionHeading.textContent = "No question available.";
  els.answerText.textContent = "";
  els.answerPanel.classList.add("hidden");
  els.feedback.textContent = "";
  updatePoolCount([]);
}

function updatePoolCount(pool = getCurrentPool()) {
  const left = pool.filter((question) => !state.used.has(question.id)).length;
  els.poolCount.textContent = `${left} left in this set`;
}

function checkAnswer(event) {
  event.preventDefault();
  if (!state.activeQuestion) return;
  const typed = normalizeAnswer(els.answerInput.value);
  const accepted = [
    state.activeQuestion.answer,
    ...state.activeQuestion.acceptedVariations
  ].map(normalizeAnswer);

  if (typed && accepted.includes(typed)) {
    els.feedback.textContent = "Correct";
    els.feedback.className = "feedback correct";
    playTone("correct");
    stopTimer();
  } else {
    els.feedback.textContent = "Try again or show the answer.";
    els.feedback.className = "feedback incorrect";
  }
}

function markHostResult(isCorrect) {
  if (!state.activeQuestion) return;
  els.feedback.textContent = isCorrect ? "Correct" : "Missed";
  els.feedback.className = isCorrect ? "feedback correct" : "feedback incorrect";
  if (isCorrect) playTone("correct");
  stopTimer();
}

function revealAnswer() {
  if (!state.activeQuestion) return;
  els.answerPanel.classList.remove("hidden");
  els.answerInput.disabled = true;
  stopTimer();
}

function restartTimer() {
  stopTimer();
  state.remaining = state.timerSeconds;
  renderTimer();
  startTimer();
}

function startTimer() {
  if (!state.activeQuestion) return;
  stopTimer();
  state.timerId = window.setInterval(() => {
    state.remaining -= 1;
    renderTimer();
    if (state.remaining <= 0) {
      stopTimer();
      els.feedback.textContent = textSetting("buzzerText", "Time!");
      els.feedback.className = "feedback timeout";
      playTone("buzzer");
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function renderTimer() {
  const seconds = Math.max(0, state.remaining);
  const percent = state.timerSeconds ? Math.max(0, Math.min(100, (seconds / state.timerSeconds) * 100)) : 0;
  els.timerValue.textContent = seconds;
  els.timerDial.style.setProperty("--timer-progress", `${percent}%`);
}

function showHome() {
  stopTimer();
  closeDifficultySheet();
  closeEndGame(false);
  els.homeView.classList.remove("hidden");
  els.questionView.classList.add("hidden");
}

function selectAgain() {
  showHome();
  showToast("Choose the next turn.");
}

function setPlayMode(mode) {
  state.playMode = normalizePlayMode(mode);
  window.localStorage.setItem(modeKey(), state.playMode);
  applyPlayMode();
}

function applyPlayMode() {
  const isHost = state.playMode === "host";
  els.answerForm.classList.toggle("hidden", isHost);
  els.hostControls.classList.toggle("hidden", !isHost);
  els.typedModeButton.classList.toggle("active", !isHost);
  els.hostModeButton.classList.toggle("active", isHost);
  els.typedModeButton.setAttribute("aria-pressed", String(!isHost));
  els.hostModeButton.setAttribute("aria-pressed", String(isHost));

  if (!isHost && state.activeQuestion) {
    els.answerInput.disabled = false;
    els.answerInput.focus({ preventScroll: true });
  }
}

function openEndGame() {
  stopTimer();
  const usedCount = state.used.size;
  const totalCount = state.data ? state.data.categories.flatMap((category) => category.questions).length : 0;
  els.endGameSummary.textContent = `${usedCount} of ${totalCount} question spaces used on this device.`;
  els.endGameSheet.classList.remove("hidden");
}

function closeEndGame(shouldResume) {
  els.endGameSheet.classList.add("hidden");
  if (shouldResume && state.activeQuestion && state.remaining > 0) {
    startTimer();
  }
}

function saveProgressAndExit() {
  closeEndGame(false);
  showHome();
  showToast("Progress saved.");
}

function startNewGame() {
  state.used.clear();
  saveUsedQuestions();
  closeEndGame(false);
  showHome();
  showToast("New game started.");
}

function resetUsedQuestions() {
  state.used.clear();
  saveUsedQuestions();
  updatePoolCount();
  showToast("Used questions reset.");
}

function loadUsedQuestions() {
  try {
    const raw = window.localStorage.getItem(storageKey());
    state.used = new Set(raw ? JSON.parse(raw) : []);
  } catch {
    state.used = new Set();
  }
}

function saveUsedQuestions() {
  window.localStorage.setItem(storageKey(), JSON.stringify([...state.used]));
}

function storageKey() {
  return `${config.storageKey || "family-trivia"}:${config.spreadsheetId || "demo"}`;
}

function modeKey() {
  return `${storageKey()}:answer-mode`;
}

function playTone(type) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  state.audioContext = state.audioContext || new AudioContext();
  const context = state.audioContext;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.type = type === "buzzer" ? "sawtooth" : "triangle";
  oscillator.frequency.value = type === "buzzer" ? 130 : 680;
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.26, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + (type === "buzzer" ? 0.7 : 0.22));
  oscillator.start();
  oscillator.stop(context.currentTime + (type === "buzzer" ? 0.72 : 0.24));
}

function setStatus(text) {
  els.syncStatus.textContent = text;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => els.toast.classList.add("hidden"), 2600);
}

function textSetting(key, fallback) {
  const value = state.data?.settings?.[key];
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function numberSetting(key, fallback) {
  const value = Number(state.data?.settings?.[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function booleanSetting(key, fallback) {
  const value = state.data?.settings?.[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "yes", "y", "1"].includes(value.trim().toLowerCase());
  return fallback;
}

function isTruthy(value) {
  if (typeof value === "boolean") return value;
  return ["true", "yes", "y", "1", "block", "blocked", "hide"].includes(String(value || "").trim().toLowerCase());
}

function setCssVar(name, value) {
  if (/^#[0-9a-f]{3,8}$/i.test(value)) {
    document.documentElement.style.setProperty(name, value);
  }
}

function normalizeLevel(level) {
  const normalized = String(level || "surprise").trim().toLowerCase();
  if (normalized.startsWith("easy")) return "easy";
  if (normalized.startsWith("med")) return "medium";
  if (normalized.startsWith("diff") || normalized.startsWith("hard")) return "difficult";
  return "surprise";
}

function normalizePlayMode(mode) {
  const normalized = String(mode || "typed").trim().toLowerCase();
  return normalized.startsWith("host") ? "host" : "typed";
}

function displayLevel(level) {
  return level === "surprise" ? "Surprise Me" : level.charAt(0).toUpperCase() + level.slice(1);
}

function normalizeAnswer(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function splitVariations(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}
