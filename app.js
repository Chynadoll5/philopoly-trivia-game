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
    acceptedVariationSeparator: "|"
  },
  categories: [
    {
      name: "Movies",
      questions: [
        { id: "demo-movies-1", level: "easy", question: "What movie features the song \"Hakuna Matata\"?", answer: "The Lion King", acceptedVariations: ["Lion King"] },
        { id: "demo-movies-2", level: "medium", question: "What fictional school does Harry Potter attend?", answer: "Hogwarts", acceptedVariations: ["Hogwarts School"] },
        { id: "demo-movies-3", level: "difficult", question: "What year did the first \"Jurassic Park\" movie release?", answer: "1993", acceptedVariations: ["nineteen ninety three"] }
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

const LEVELS = [
  { id: "easy", label: "Easy", diamonds: "◆" },
  { id: "medium", label: "Medium", diamonds: "◆◆" },
  { id: "difficult", label: "Difficult", diamonds: "◆◆◆" },
  { id: "surprise", label: "Random", diamonds: "" }
];

const RULES = [
  {
    icon: "target",
    title: "Pick a space",
    description: "Choose All categories or one category, then tap a diamond level or Random."
  },
  {
    icon: "clock",
    title: "Beat the clock",
    description: "Answer before the timer runs out. The final five seconds click so everyone can feel the countdown."
  },
  {
    icon: "microphone",
    title: "Choose your mode",
    description: "Type answer checks the phone. Host mode lets one person judge answers out loud."
  },
  {
    icon: "trophy",
    title: "No repeats",
    description: "A room will not reuse a question space until every matching space has been played."
  },
  {
    icon: "cards",
    title: "Keep it fresh",
    description: "Update the Google Sheet whenever you want new questions, answers, or accepted variations."
  }
];

const SOUND_OPTIONS = {
  tick: {
    title: "Timer tick",
    defaultValue: "soft",
    options: [
      { value: "soft", label: "Soft tick" },
      { value: "heartbeat", label: "Heartbeat" },
      { value: "clock", label: "Clock" },
      { value: "off", label: "Off" }
    ]
  },
  buzzer: {
    title: "Buzzer",
    defaultValue: "classic",
    options: [
      { value: "classic", label: "Classic buzz" },
      { value: "gong", label: "Gong" },
      { value: "airhorn", label: "Air horn" },
      { value: "bell", label: "Bell" }
    ]
  },
  correct: {
    title: "Correct answer",
    defaultValue: "chime",
    options: [
      { value: "chime", label: "Chime" },
      { value: "fanfare", label: "Fanfare" },
      { value: "applause", label: "Applause" },
      { value: "ding", label: "Ding" }
    ]
  },
  missed: {
    title: "Missed answer",
    defaultValue: "buzzer",
    options: [
      { value: "womp", label: "Womp womp" },
      { value: "thud", label: "Low thud" },
      { value: "buzzer", label: "Buzzer" },
      { value: "silent", label: "Silent" }
    ]
  }
};

const DEFAULT_SOUND_SETTINGS = {
  volume: 0.8,
  muted: false,
  tick: SOUND_OPTIONS.tick.defaultValue,
  buzzer: SOUND_OPTIONS.buzzer.defaultValue,
  correct: SOUND_OPTIONS.correct.defaultValue,
  missed: SOUND_OPTIONS.missed.defaultValue
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
  advanceTimerId: null,
  timerSeconds: 30,
  remaining: 30,
  questionNumber: 0,
  playMode: "typed",
  allowModeSwitch: true,
  gameCode: "game-1",
  sharedUsedCount: 0,
  sharedTotalCount: 0,
  soundUnlocked: false,
  audioContext: null,
  soundSettings: { ...DEFAULT_SOUND_SETTINGS }
};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  loadSoundSettings();
  renderRules();
  renderSoundSettings();
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
    "rulesButton",
    "closeRulesButton",
    "rulesOverlay",
    "rulesList",
    "soundOverlay",
    "closeSoundButton",
    "masterVolumeInput",
    "volumeReadout",
    "soundChannels",
    "muteToggle",
    "gameCodeInput",
    "saveGameCodeButton",
    "gameCodeNote",
    "categoryGrid",
    "homeView",
    "questionView",
    "backButton",
    "activeCategory",
    "activeLevel",
    "modeSwitch",
    "typedModeButton",
    "hostModeButton",
    "timerDial",
    "timerValue",
    "timerBar",
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
    "toast"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("keydown", handleKeyboard);
  els.rulesButton.addEventListener("click", openRulesOverlay);
  els.closeRulesButton.addEventListener("click", closeRulesOverlay);
  els.rulesOverlay.addEventListener("click", (event) => {
    if (event.target === els.rulesOverlay) closeRulesOverlay();
  });
  els.soundButton.addEventListener("click", openSoundOverlay);
  els.closeSoundButton.addEventListener("click", closeSoundOverlay);
  els.soundOverlay.addEventListener("click", (event) => {
    if (event.target === els.soundOverlay) closeSoundOverlay();
  });
  els.reloadButton.addEventListener("click", loadGameData);
  els.resetUsedButton.addEventListener("click", startNewGame);
  els.saveGameCodeButton.addEventListener("click", saveGameCode);
  els.gameCodeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveGameCode();
  });
  els.backButton.addEventListener("click", showHome);
  els.typedModeButton.addEventListener("click", () => setPlayMode("typed"));
  els.hostModeButton.addEventListener("click", () => setPlayMode("host"));
  els.answerForm.addEventListener("submit", checkAnswer);
  els.nextButton.addEventListener("click", () => drawQuestion());
  els.selectAgainButton.addEventListener("click", selectAgain);
  els.skipButton.addEventListener("click", handleSkip);
  els.showAnswerButton.addEventListener("click", revealAnswer);
  els.hostCorrectButton.addEventListener("click", () => markHostResult(true));
  els.hostMissedButton.addEventListener("click", () => markHostResult(false));
  els.restartTimerButton.addEventListener("click", restartTimer);
  els.endGameButton.addEventListener("click", saveProgressAndExit);
  els.masterVolumeInput.addEventListener("input", handleVolumeInput);
  els.muteToggle.addEventListener("change", handleMuteToggle);
}

async function loadGameData() {
  setStatus("Loading");
  stopTimer();
  clearScheduledAdvance();
  try {
    if (config.dataUrl) {
      state.data = normalizePayload(await loadJsonp(config.dataUrl, {
        action: "data",
        gameCode: state.gameCode
      }));
      setStatus(`Room: ${state.gameCode}`);
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
    setStatus("Data error");
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
  state.timerSeconds = numberSetting("timerSeconds", 30);
  els.gameTitle.textContent = textSetting("gameTitle", "Philopoly");
  els.subtitle.textContent = textSetting("subtitle", "Choose a category, pick a level, and answer before the buzzer.");
  document.title = els.gameTitle.textContent;
  state.playMode = normalizePlayMode(window.localStorage.getItem(modeKey()) || textSetting("defaultAnswerMode", "typed"));
  state.allowModeSwitch = booleanSetting("allowModeSwitch", true);
  els.modeSwitch.hidden = !state.allowModeSwitch;
  els.skipButton.hidden = !booleanSetting("allowSkips", true);
  els.showAnswerButton.hidden = !booleanSetting("showAnswerButton", true);
  els.endGameButton.hidden = !booleanSetting("showEndGameButton", true);
  state.sharedUsedCount = Number(state.data.sharedState?.usedCount || state.used.size || 0);
  state.sharedTotalCount = Number(state.data.sharedState?.totalCount || totalQuestionCount() || 0);
  updateGameCodeNote();
  applyPlayMode();
}

function renderCategories() {
  els.categoryGrid.innerHTML = "";
  if (!state.data) return;

  const allQuestions = state.data.categories.flatMap((category) =>
    category.questions.map((question) => ({ ...question, categoryName: category.name }))
  );
  els.categoryGrid.appendChild(createCategoryRow({
    name: "All categories",
    key: "__all",
    questions: allQuestions,
    featured: true
  }));

  state.data.categories.forEach((category) => {
    els.categoryGrid.appendChild(createCategoryRow({
      name: category.name,
      key: category.name,
      questions: category.questions,
      featured: false
    }));
  });
}

function createCategoryRow(category) {
  const row = document.createElement("div");
  row.className = `board-row category-row${category.featured ? " all-row" : ""}`;

  const categoryCell = document.createElement("div");
  categoryCell.className = "category-cell";
  categoryCell.innerHTML = `
    <span class="category-icon" aria-hidden="true">${iconSvg(category.featured ? "grid" : categoryIconType(category.name))}</span>
    <span>
      <span class="category-name">${escapeHtml(category.name)}</span>
      <span class="category-count">${category.questions.length} question spaces</span>
    </span>
  `;
  row.appendChild(categoryCell);

  LEVELS.forEach((level) => {
    const count = level.id === "surprise"
      ? category.questions.length
      : category.questions.filter((question) => question.level === level.id).length;
    const cell = document.createElement("div");
    cell.className = "level-cell";
    const button = document.createElement("button");
    button.className = `level-button${level.id === "surprise" ? " random-button" : ""}`;
    button.type = "button";
    button.disabled = count === 0;
    button.setAttribute("aria-label", `${category.name}, ${level.label}, ${count} question spaces`);
    button.title = `${category.name} · ${level.label} · ${count} question spaces`;
    button.innerHTML = level.id === "surprise"
      ? `<span class="shuffle-icon" aria-hidden="true">${iconSvg("shuffle")}</span>`
      : `<span aria-hidden="true">${level.diamonds}</span>`;
    button.addEventListener("click", () => startRound(category.key, level.id));
    cell.appendChild(button);
    row.appendChild(cell);
  });

  return row;
}

function startRound(categoryKey, level) {
  unlockAudio();
  clearScheduledAdvance();
  state.selectedCategory = categoryKey;
  state.selectedLevel = normalizeLevel(level);
  els.homeView.classList.add("hidden");
  els.questionView.classList.remove("hidden");
  drawQuestion();
}

async function drawQuestion() {
  unlockAudio();
  clearScheduledAdvance();
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
  state.questionNumber += 1;
  saveUsedQuestions();
  renderQuestion(pool);
  restartTimer();
  updateGameCodeNote();
}

async function drawSharedQuestion() {
  try {
    setStatus("Drawing");
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
      setStatus(`Room: ${state.gameCode}`);
      return;
    }

    state.activeQuestion = normalizeQuestion(payload.question);
    if (!state.activeQuestion.categoryName && state.selectedCategory && state.selectedCategory !== "__all") {
      state.activeQuestion.categoryName = state.selectedCategory;
    }
    state.sharedUsedCount = Number(payload.usedCount || 0);
    state.sharedTotalCount = Number(payload.totalCount || totalQuestionCount() || 0);
    state.questionNumber += 1;
    if (payload.refreshed) showToast("That question set has refreshed.");
    renderQuestion(null, payload);
    restartTimer();
    setStatus(`Room: ${state.gameCode}`);
    updateGameCodeNote();
  } catch (error) {
    console.error(error);
    stopTimer();
    clearQuestion();
    setStatus("Data error");
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
  const categoryName = question.categoryName || (state.selectedCategory === "__all" ? "All categories" : state.selectedCategory || "Category");
  els.activeCategory.textContent = categoryName;
  els.activeLevel.textContent = `${levelDiamonds(question.level)} ${displayLevel(question.level)}`;
  els.questionHeading.innerHTML = formatQuestionText(question.question);
  els.answerInput.value = "";
  els.answerInput.disabled = false;
  els.answerText.textContent = question.answer;
  els.answerPanel.classList.add("hidden");
  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  els.questionView.classList.remove("final-five");
  applyPlayMode();
  updatePoolCount(pool, stats);
}

function clearQuestion() {
  state.activeQuestion = null;
  els.activeCategory.textContent = state.selectedCategory === "__all" ? "All categories" : state.selectedCategory || "Category";
  els.activeLevel.textContent = displayLevel(state.selectedLevel || "surprise");
  els.questionHeading.textContent = "No question available.";
  els.answerInput.value = "";
  els.answerInput.disabled = true;
  els.answerText.textContent = "";
  els.answerPanel.classList.add("hidden");
  els.feedback.textContent = "";
  updatePoolCount([]);
  renderTimer();
}

function updatePoolCount(pool = getCurrentPool(), stats = null) {
  let left;
  if (stats) {
    left = Number(stats.poolRemaining || 0);
  } else {
    left = pool.filter((question) => !state.used.has(question.id)).length;
  }
  els.poolCount.textContent = `Question ${state.questionNumber} · ${left} left in this set`;
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
    markResult(true);
  } else {
    els.feedback.textContent = "Try again or show the answer.";
    els.feedback.className = "feedback incorrect";
    playTone("missed");
  }
}

function markHostResult(isCorrect) {
  if (!state.activeQuestion) return;
  markResult(isCorrect);
}

function markResult(isCorrect) {
  stopTimer();
  els.feedback.textContent = isCorrect ? "Correct" : "Missed";
  els.feedback.className = isCorrect ? "feedback correct" : "feedback incorrect";
  playTone(isCorrect ? "correct" : "missed");
  flashVerdict(isCorrect);
  scheduleNextQuestion();
}

function flashVerdict(isCorrect) {
  const button = isCorrect ? els.hostCorrectButton : els.hostMissedButton;
  button.classList.add("flash");
  window.setTimeout(() => button.classList.remove("flash"), 240);
}

function scheduleNextQuestion() {
  clearScheduledAdvance();
  state.advanceTimerId = window.setTimeout(() => {
    drawQuestion();
  }, 850);
}

function clearScheduledAdvance() {
  if (state.advanceTimerId) {
    window.clearTimeout(state.advanceTimerId);
    state.advanceTimerId = null;
  }
}

function revealAnswer() {
  if (!state.activeQuestion) return;
  els.answerPanel.classList.remove("hidden");
  els.answerInput.disabled = true;
  stopTimer();
  clearScheduledAdvance();
}

function restartTimer() {
  if (!state.activeQuestion) return;
  clearScheduledAdvance();
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
    if (state.remaining > 0 && state.remaining <= 5) {
      playTone("tick");
    } else if (state.remaining <= 0) {
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
  document.documentElement.style.setProperty("--timer-percent", `${percent}%`);
  els.questionView.classList.toggle("final-five", seconds <= 5 && seconds >= 0 && Boolean(state.activeQuestion));
}

function showHome() {
  stopTimer();
  clearScheduledAdvance();
  closeRulesOverlay();
  closeSoundOverlay();
  els.homeView.classList.remove("hidden");
  els.questionView.classList.add("hidden");
  updateGameCodeNote();
}

function selectAgain() {
  showHome();
  showToast("Choose the next turn.");
}

function handleSkip() {
  if (!state.activeQuestion) return;
  showToast("Skipped.");
  drawQuestion();
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
  state.questionNumber = 0;
  loadUsedQuestions();
  updateGameCodeNote();
  loadGameData();
  showToast(`Joined ${state.gameCode}.`);
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

async function saveProgressAndExit() {
  stopTimer();
  clearScheduledAdvance();
  if (config.dataUrl) {
    await loadJsonp(config.dataUrl, {
      action: "end",
      gameCode: state.gameCode
    }).catch(() => null);
  }
  showHome();
  showToast("Game ended. Progress saved.");
}

async function startNewGame() {
  stopTimer();
  clearScheduledAdvance();
  state.used.clear();
  state.questionNumber = 0;
  saveUsedQuestions();
  if (config.dataUrl) {
    await loadJsonp(config.dataUrl, {
      action: "reset",
      gameCode: state.gameCode
    }).catch(() => null);
    state.sharedUsedCount = 0;
  }
  updatePoolCountSafe();
  updateGameCodeNote();
  showHome();
  showToast("New game started.");
}

function updatePoolCountSafe() {
  if (state.activeQuestion) updatePoolCount();
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

function soundKey() {
  return `${config.storageKey || "philopoly-trivia"}:sound-settings`;
}

function renderRules() {
  els.rulesList.innerHTML = RULES.map((rule) => `
    <article class="rule-item">
      <span class="rule-badge" aria-hidden="true">${iconSvg(rule.icon)}</span>
      <div>
        <h3>${escapeHtml(rule.title)}</h3>
        <p>${escapeHtml(rule.description)}</p>
      </div>
    </article>
  `).join("");
}

function openRulesOverlay() {
  els.rulesOverlay.classList.remove("hidden");
}

function closeRulesOverlay() {
  els.rulesOverlay.classList.add("hidden");
}

function openSoundOverlay() {
  unlockAudio();
  renderSoundSettings();
  els.soundOverlay.classList.remove("hidden");
}

function closeSoundOverlay() {
  els.soundOverlay.classList.add("hidden");
}

function renderSoundSettings() {
  els.masterVolumeInput.value = String(Math.round(state.soundSettings.volume * 100));
  els.volumeReadout.textContent = `${Math.round(state.soundSettings.volume * 100)}%`;
  els.muteToggle.checked = state.soundSettings.muted;
  els.soundChannels.innerHTML = Object.entries(SOUND_OPTIONS).map(([channel, definition]) => `
    <section class="sound-channel" data-channel="${channel}">
      <div class="sound-channel-head">
        <span class="sound-channel-title">${escapeHtml(definition.title)}</span>
        <button class="preview-button" type="button" data-preview="${channel}" aria-label="Preview ${escapeHtml(definition.title)}">▶</button>
      </div>
      <div class="sound-options">
        ${definition.options.map((option) => `
          <button class="sound-chip${state.soundSettings[channel] === option.value ? " active" : ""}" type="button" data-channel="${channel}" data-sound="${option.value}">
            ${escapeHtml(option.label)}
          </button>
        `).join("")}
      </div>
    </section>
  `).join("");

  els.soundChannels.querySelectorAll(".sound-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.soundSettings[button.dataset.channel] = button.dataset.sound;
      saveSoundSettings();
      renderSoundSettings();
      playTone(button.dataset.channel);
    });
  });

  els.soundChannels.querySelectorAll(".preview-button").forEach((button) => {
    button.addEventListener("click", () => playTone(button.dataset.preview));
  });
}

function handleVolumeInput() {
  state.soundSettings.volume = Number(els.masterVolumeInput.value) / 100;
  els.volumeReadout.textContent = `${els.masterVolumeInput.value}%`;
  saveSoundSettings();
}

function handleMuteToggle() {
  state.soundSettings.muted = els.muteToggle.checked;
  saveSoundSettings();
}

function loadSoundSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(soundKey()) || "{}");
    state.soundSettings = {
      ...DEFAULT_SOUND_SETTINGS,
      ...saved,
      volume: clamp(Number(saved.volume ?? DEFAULT_SOUND_SETTINGS.volume), 0, 1),
      muted: Boolean(saved.muted)
    };
  } catch {
    state.soundSettings = { ...DEFAULT_SOUND_SETTINGS };
  }
}

function saveSoundSettings() {
  window.localStorage.setItem(soundKey(), JSON.stringify(state.soundSettings));
}

function unlockAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  state.audioContext = state.audioContext || new AudioContext();
  if (state.audioContext.state === "suspended") {
    state.audioContext.resume().catch(() => null);
  }
  state.soundUnlocked = true;
}

function playTone(channel, overrideValue) {
  const value = overrideValue || state.soundSettings[channel];
  if (!value || value === "off" || value === "silent" || state.soundSettings.muted || state.soundSettings.volume <= 0) return;
  const context = getAudioContext();
  if (!context) return;

  if ((channel === "buzzer" || channel === "missed") && "vibrate" in navigator) {
    navigator.vibrate(channel === "buzzer" ? [240, 90, 240, 90, 320] : [180, 80, 180]);
  }

  if (channel === "tick") playTick(value, context);
  if (channel === "buzzer") playBuzzer(value, context);
  if (channel === "correct") playCorrect(value, context);
  if (channel === "missed") playMissed(value, context);
}

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  state.audioContext = state.audioContext || new AudioContext();
  if (state.audioContext.state === "suspended") {
    state.audioContext.resume().catch(() => null);
  }
  return state.audioContext;
}

function playTick(value, context) {
  if (value === "heartbeat") {
    playSequence(context, [
      { start: 0, duration: 0.07, frequency: 110, type: "sine", gain: 0.22 },
      { start: 0.12, duration: 0.08, frequency: 92, type: "sine", gain: 0.18 }
    ]);
    return;
  }
  if (value === "clock") {
    playSequence(context, [
      { start: 0, duration: 0.035, frequency: 1180, type: "square", gain: 0.16 },
      { start: 0.09, duration: 0.035, frequency: 760, type: "square", gain: 0.12 }
    ]);
    return;
  }
  playSequence(context, [
    { start: 0, duration: 0.04, frequency: 980, type: "square", gain: 0.12 }
  ]);
}

function playBuzzer(value, context) {
  if (value === "gong") {
    playSequence(context, [
      { start: 0, duration: 0.8, frequency: 180, endFrequency: 92, type: "triangle", gain: 0.48, attack: 0.02 }
    ]);
    return;
  }
  if (value === "airhorn") {
    playSequence(context, [
      { start: 0, duration: 0.42, frequency: 360, endFrequency: 250, type: "sawtooth", gain: 0.38 },
      { start: 0.48, duration: 0.34, frequency: 430, endFrequency: 280, type: "sawtooth", gain: 0.34 }
    ]);
    return;
  }
  if (value === "bell") {
    playSequence(context, [
      { start: 0, duration: 0.5, frequency: 880, type: "sine", gain: 0.28 },
      { start: 0.03, duration: 0.56, frequency: 1320, type: "sine", gain: 0.16 }
    ]);
    return;
  }
  playClassicBuzzer(context);
}

function playCorrect(value, context) {
  if (value === "fanfare") {
    playSequence(context, [
      { start: 0, duration: 0.12, frequency: 523.25, type: "triangle", gain: 0.2 },
      { start: 0.14, duration: 0.12, frequency: 659.25, type: "triangle", gain: 0.24 },
      { start: 0.28, duration: 0.28, frequency: 783.99, type: "triangle", gain: 0.28 }
    ]);
    return;
  }
  if (value === "applause") {
    for (let index = 0; index < 9; index += 1) {
      playNoiseBurst(context, index * 0.055, 0.045, 0.12 + (index % 3) * 0.03);
    }
    return;
  }
  if (value === "ding") {
    playSequence(context, [
      { start: 0, duration: 0.28, frequency: 1046.5, type: "sine", gain: 0.25 }
    ]);
    return;
  }
  playSequence(context, [
    { start: 0, duration: 0.16, frequency: 659.25, type: "sine", gain: 0.22 },
    { start: 0.17, duration: 0.24, frequency: 987.77, type: "sine", gain: 0.26 }
  ]);
}

function playMissed(value, context) {
  if (value === "thud") {
    playSequence(context, [
      { start: 0, duration: 0.18, frequency: 82, endFrequency: 58, type: "sine", gain: 0.42, attack: 0.01 }
    ]);
    return;
  }
  if (value === "buzzer") {
    playClassicBuzzer(context);
    return;
  }
  playSequence(context, [
    { start: 0, duration: 0.34, frequency: 220, endFrequency: 110, type: "sawtooth", gain: 0.28 },
    { start: 0.36, duration: 0.32, frequency: 185, endFrequency: 92, type: "sawtooth", gain: 0.24 }
  ]);
}

function playClassicBuzzer(context) {
  playSequence(context, [
    { start: 0, duration: 0.22, frequency: 160, type: "sawtooth", gain: 0.42 },
    { start: 0.28, duration: 0.22, frequency: 120, type: "sawtooth", gain: 0.44 },
    { start: 0.56, duration: 0.34, frequency: 95, type: "sawtooth", gain: 0.46 }
  ]);
}

function playSequence(context, pulses) {
  const volume = state.soundSettings.volume;
  pulses.forEach((pulse) => {
    const start = context.currentTime + pulse.start;
    const end = start + pulse.duration;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = pulse.type || "sine";
    oscillator.frequency.setValueAtTime(pulse.frequency, start);
    if (pulse.endFrequency) {
      oscillator.frequency.linearRampToValueAtTime(pulse.endFrequency, end);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * (pulse.gain || 0.22)), start + (pulse.attack || 0.018));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.start(start);
    oscillator.stop(end + 0.03);
  });
}

function playNoiseBurst(context, offset, duration, gainValue) {
  const bufferSize = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < bufferSize; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  const source = context.createBufferSource();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const start = context.currentTime + offset;
  const end = start + duration;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1400 + Math.random() * 1200, start);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, state.soundSettings.volume * gainValue), start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  source.start(start);
  source.stop(end + 0.02);
}

function handleKeyboard(event) {
  if (event.key === "Escape") {
    closeRulesOverlay();
    closeSoundOverlay();
  }
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
  const usedCount = config.dataUrl ? state.sharedUsedCount : state.used.size;
  els.gameCodeNote.textContent = `Tap any cell to start · ${usedCount} question spaces used on ${state.gameCode}`;
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
  const normalized = normalizeLevel(level);
  const match = LEVELS.find((item) => item.id === normalized);
  return match ? match.label : "Random";
}

function levelDiamonds(level) {
  const normalized = normalizeLevel(level);
  const match = LEVELS.find((item) => item.id === normalized);
  return match?.diamonds || "◆";
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

function totalQuestionCount() {
  return state.data ? state.data.categories.flatMap((category) => category.questions).length : 0;
}

function formatQuestionText(value) {
  return escapeHtml(value)
    .replace(/(&quot;)([^&]+?)(&quot;)/g, "$1<em>$2</em>$3")
    .replace(/(“)(.+?)(”)/g, "$1<em>$2</em>$3");
}

function categoryIconType(name) {
  const normalized = String(name || "").toLowerCase();
  if (normalized.includes("movie")) return "film";
  if (normalized.includes("music")) return "note";
  if (normalized.includes("family")) return "people";
  if (normalized.includes("wild")) return "cards";
  if (normalized.includes("sport")) return "football";
  if (normalized.includes("geography")) return "map";
  if (normalized.includes("history")) return "building";
  if (normalized.includes("science")) return "flask";
  if (normalized.includes("food") || normalized.includes("drink")) return "utensils";
  if (normalized.includes("tv") || normalized.includes("pop")) return "television";
  return "grid";
}

function iconSvg(name) {
  const icons = {
    grid: '<rect x="4" y="4" width="6" height="6"></rect><rect x="14" y="4" width="6" height="6"></rect><rect x="4" y="14" width="6" height="6"></rect><rect x="14" y="14" width="6" height="6"></rect>',
    film: '<rect x="4" y="5" width="16" height="14" rx="1"></rect><path d="M8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4"></path>',
    note: '<path d="M9 18V5l10-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="16" cy="16" r="3"></circle>',
    people: '<circle cx="9" cy="8" r="3"></circle><circle cx="17" cy="10" r="2.4"></circle><path d="M3.5 20c.8-3.6 3-5.4 5.5-5.4s4.7 1.8 5.5 5.4"></path><path d="M13.8 15.5c2.4.2 4.2 1.7 4.9 4.5"></path>',
    cards: '<rect x="5" y="6" width="9" height="13" rx="1"></rect><rect x="10" y="4" width="9" height="13" rx="1"></rect><path d="M9 10l1.5 1.5L12 10"></path>',
    football: '<path d="M4 12c2-5.5 10-8 16-4-1 7-8 11-16 4Z"></path><path d="M8 14c3-1 5.5-3 7-6"></path><path d="M10 11l3 2M12 9l3 2"></path>',
    map: '<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z"></path><path d="M9 4v14M15 6v14"></path>',
    building: '<path d="M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16M12 4l8 4H4l8-4Z"></path>',
    flask: '<path d="M10 3h4M11 3v5l-5 9a3 3 0 0 0 2.6 4h6.8a3 3 0 0 0 2.6-4l-5-9V3"></path><path d="M8 16h8"></path>',
    utensils: '<path d="M7 3v8M5 3v8M9 3v8M5 11h4M7 11v10"></path><path d="M16 3v18M16 3c3 2 4 5 2 8h-2"></path>',
    television: '<rect x="4" y="6" width="16" height="11" rx="1"></rect><path d="M8 21h8M12 17v4M9 3l3 3 3-3"></path>',
    shuffle: '<path d="M4 7h3c4 0 5 10 9 10h4"></path><path d="M4 17h3c1.8 0 3-1.8 4.2-3.9"></path><path d="M16 4l4 3-4 3M16 14l4 3-4 3"></path>',
    target: '<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="4"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>',
    clock: '<circle cx="12" cy="12" r="8"></circle><path d="M12 7v5l3 2"></path>',
    microphone: '<rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11c0 4 3 7 7 7s7-3 7-7M12 18v3M9 21h6"></path>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"></path><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v5M8 21h8M9 18h6"></path>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.grid}</svg>`;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
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
