loadGameData = async function loadGameDataFast(options = {}) {
  const settings = options && options.type ? {} : options || {};
  const background = Boolean(settings.background);
  const forceRefresh = Boolean(settings.forceRefresh);

  if (!background) {
    setStatus(state.data ? "Refreshing" : "Loading");
    stopTimer();
    clearScheduledAdvance();
  }

  try {
    if (config.dataUrl) {
      const params = {
        action: "data",
        gameCode: state.gameCode
      };
      if (forceRefresh) params.refresh = "1";
      state.data = normalizePayload(await loadJsonp(config.dataUrl, params));
      saveCachedGameData(state.data);
      setStatus(`Room: ${state.gameCode}`);
    } else if (config.useDemoDataWhenEmpty !== false) {
      state.data = normalizePayload(DEMO_DATA);
      setStatus("Preview");
    } else {
      throw new Error("No dataUrl set in config.js.");
    }
    applySettings();
    renderCategories();
    if (!background) showHome();
  } catch (error) {
    console.error(error);
    if (!background) {
      setStatus("Data error");
      showToast("Could not load questions. Check the Apps Script URL.");
    }
  }
};

renderRuleSection = function renderRuleSectionOpen(section, queryOrIndex, forceOpen, queryFromOldCall) {
  const query = typeof queryFromOldCall === "string"
    ? queryFromOldCall
    : typeof queryOrIndex === "string"
      ? queryOrIndex
      : "";

  return `
    <details class="rule-section" id="${ruleDomId(section)}" open>
      <summary>
        <span class="rule-number">Section ${highlightText(section.number, query)}</span>
        <span class="rule-title">${highlightText(section.title, query)}</span>
      </summary>
      <div class="rule-section-body">
        ${renderRuleBlock(section, false, query)}
      </div>
    </details>
  `;
};
