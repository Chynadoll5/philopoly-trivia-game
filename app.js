const DEMO_DATA = {
  settings: {
    gameTitle: "Philopoly",
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
  gameCode: "game-1",
  sharedUsedCount: 0,
  sharedTotalCount: 0,
  soundUnlocked: false,
  audioContext: null
};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  loadUsedQuestions();
  loadGameCode();
  loadGameData();
});

function cacheElements() {
  [
    "gameTitle",
    "subtitle",
    "syncStatus",
    "soundButton",
    "reloadButton",
    "resetUsedButton",
    "gameCodeInput",
    "saveGameCodeButton",
    "gameCodeNote",
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
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  els.soundButton.addEventListener("click", testSound);
  els.reloadButton.addEventListener("click", loadGameData);
  els.resetUsedButton.addEventListener("click", resetUsedQuestions);
  els.saveGameCodeButton.addEventListener("click", saveGameCode);
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
      state.data = normalizePayload(await loadJsonp(config.dataUrl, {
        action: "data",
        gameCode: state.gameCode
      }));
      setStatus(`Live: ${state.gameCode}`);
    } else if (config.useDemoDataWhenEmpty !== false) {
      state.data = normalizePayload(DEMO_DATA);
      setStatus("Preview");
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

function loadJsonp(url, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `trivia_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const search = new URLSearchParams({
      ...params,
      callback: callbackName,
      v: String(Date.now())
    });
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

    script.src = `${url}${joiner}${search.toString()}`;
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
        .map((q, index) => normalizeQuestion(q, `${category.name}-${index}`))
    }))
    .filter((category) => category.questions.length);

  return {
    settings: payload.settings || {},
    categories,
    sharedState: payload.sharedState || null,
    generatedAt: payload.generatedAt || new Date().toISOString()
  };
}

function normalizeQuestion(question, fallbackId = "question") {
  return {
    id: String(question.id || fallbackId),
    level: normalizeLevel(question.level),
    categoryName: question.categoryName ? String(question.categoryName) : undefined,
    question: String(question.question),
    answer: String(question.answer),
    acceptedVariations: Array.isArray(question.acceptedVariations)
      ? question.acceptedVariations.map(String).filter(Boolean)
      : splitVariations(question.acceptedVariations)
  };
}

function applySettings() {
  const settings = state.data.settings;
  state.timerSeconds = numberSetting("timerSeconds", 30);
  els.gameTitle.textContent = textSetting("gameTitle", "Philopoly");
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
  state.sharedUsedCount = Number(state.data.sharedState?.usedCount || state.used.size || 0);
  state.sharedTotalCount = Number(state.data.sharedState?.totalCount || 0);
  updateGameCodeNote();
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
  unlockAudio();
  state.selectedLevel = normalizeLevel(level);
  closeDifficultySheet();
  els.homeView.classList.add("hidden");
  els.questionView.classList.remove("hidden");
  drawQuestion();
}

async function drawQuestion() {
  unlockAudio();
  if (config.dataUrl) {
    await drawSharedQuestion();
    return;
  }

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

async function drawSharedQuestion() {
  try {
    setStatus(`Drawing: ${state.gameCode}`);
    const payload = await loadJsonp(config.dataUrl, {
      action: "draw",
      gameCode: state.gameCode,
      category: state.selectedCategory || "__all",
      level: state.selectedLevel || "surprise"
    });

    if (!payload.ok || !payload.question) {
      stopTimer();
      clearQuestion();
      showToast(payload.message || "No questions found for that choice.");
      setStatus(`Live: ${state.gameCode}`);
      return;
    }

    state.activeQuestion = normalizeQuestion(payload.question);
    state.sharedUsedCount = Number(payload.usedCount || 0);
    state.sharedTotalCount = Number(payload.totalCount || 0);
    if (payload.refreshed) showToast("That question set has refreshed.");
    renderQuestion(null, payload);
    restartTimer();
    setStatus(`Live: ${state.gameCode}`);
    updateGameCodeNote();
  } catch (error) {
    console.error(error);
    setStatus("Data Error");
    showToast("Could not draw a shared question. Check the Apps Script URL.");
  }
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

function renderQuestion(pool, stats = null) {
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
  updatePoolCount(pool, stats);
}

function clearQuestion() {
  state.activeQuestion = null;
  els.questionHeading.textContent = "No question available.";
  els.answerText.textContent = "";
  els.answerPanel.classList.add("hidden");
  els.feedback.textContent = "";
  updatePoolCount([]);
}

function updatePoolCount(pool = getCurrentPool(), stats = null) {
  if (stats) {
    els.poolCount.textContent = `${Number(stats.poolRemaining || 0)} left in this set for ${state.gameCode}`;
    return;
  }
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

function loadGameCode() {
  const saved = window.localStorage.getItem(gameCodeKey());
  state.gameCode = normalizeGameCode(saved || "game-1");
  els.gameCodeInput.value = state.gameCode;
  updateGameCodeNote();
}

function saveGameCode() {
  state.gameCode = normalizeGameCode(els.gameCodeInput.value || "game-1");
  els.gameCodeInput.value = state.gameCode;
  window.localStorage.setItem(gameCodeKey(), state.gameCode);
  loadUsedQuestions();
  updateGameCodeNote();
  loadGameData();
  showToast(`Using game code ${state.gameCode}.`);
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
  const usedCount = config.dataUrl ? state.sharedUsedCount : state.used.size;
  const totalCount = config.dataUrl
    ? state.sharedTotalCount
    : state.data ? state.data.categories.flatMap((category) => category.questions).length : 0;
  const scope = config.dataUrl ? `for ${state.gameCode}` : "on this device";
  els.endGameSummary.textContent = `${usedCount} of ${totalCount} question spaces used ${scope}.`;
  els.endGameSheet.classList.remove("hidden");
}

function closeEndGame(shouldResume) {
  els.endGameSheet.classList.add("hidden");
  if (shouldResume && state.activeQuestion && state.remaining > 0) {
    startTimer();
  }
}

async function saveProgressAndExit() {
  if (config.dataUrl) {
    await loadJsonp(config.dataUrl, {
      action: "end",
      gameCode: state.gameCode
    }).catch(() => null);
  }
  closeEndGame(false);
  showHome();
  showToast("Progress saved.");
}

async function startNewGame() {
  state.used.clear();
  saveUsedQuestions();
  if (config.dataUrl) {
    await loadJsonp(config.dataUrl, {
      action: "reset",
      gameCode: state.gameCode
    }).catch(() => null);
    state.sharedUsedCount = 0;
    updateGameCodeNote();
  }
  closeEndGame(false);
  showHome();
  showToast("New game started.");
}

async function resetUsedQuestions() {
  state.used.clear();
  saveUsedQuestions();
  if (config.dataUrl) {
    await loadJsonp(config.dataUrl, {
      action: "reset",
      gameCode: state.gameCode
    }).catch(() => null);
    state.sharedUsedCount = 0;
    updateGameCodeNote();
  }
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
  return `${config.storageKey || "philopoly-trivia"}:${config.spreadsheetId || "demo"}:${state.gameCode}`;
}

function modeKey() {
  return `${storageKey()}:answer-mode`;
}

function gameCodeKey() {
  return `${config.storageKey || "philopoly-trivia"}:${config.spreadsheetId || "demo"}:game-code`;
}

function unlockAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext || state.soundUnlocked) return;
  state.audioContext = state.audioContext || new AudioContext();
  if (state.audioContext.state === "suspended") {
    state.audioContext.resume().catch(() => null);
  }
  state.soundUnlocked = true;
  els.soundButton.textContent = "Sound On";
}

function testSound() {
  unlockAudio();
  playTone("correct");
  if ("vibrate" in navigator) navigator.vibrate(80);
  showToast("Sound is on.");
}

function playTone(type) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  state.audioContext = state.audioContext || new AudioContext();
  const context = state.audioContext;
  if (context.state === "suspended") {
    context.resume().catch(() => null);
  }

  if (type === "buzzer" && "vibrate" in navigator) {
    navigator.vibrate([240, 90, 240, 90, 340]);
  }

  const pulses = type === "buzzer"
    ? [
        { start: 0, duration: 0.22, frequency: 160 },
        { start: 0.28, duration: 0.22, frequency: 120 },
        { start: 0.56, duration: 0.34, frequency: 95 }
      ]
    : [{ start: 0, duration: 0.24, frequency: 720 }];

  pulses.forEach((pulse) => {
    const start = context.currentTime + pulse.start;
    const end = start + pulse.duration;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = type === "buzzer" ? "sawtooth" : "triangle";
    oscillator.frequency.setValueAtTime(pulse.frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(type === "buzzer" ? 0.65 : 0.32, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  });
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

function updateGameCodeNote() {
  if (!els.gameCodeNote) return;
  if (config.dataUrl) {
    els.gameCodeNote.textContent = `${state.gameCode} is shared across phones. ${state.sharedUsedCount} question spaces used.`;
  } else {
    els.gameCodeNote.textContent = "Paste the Apps Script URL into config.js to share this code across phones.";
  }
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

function normalizeGameCode(value) {
  const normalized = String(value || "game-1")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "game-1";
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
