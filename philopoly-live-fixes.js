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

renderRules = function renderRulesWithFullToc(query = "") {
  const book = state.ruleBook || normalizeRuleBook(FALLBACK_RULE_BOOK);
  const sections = book.sections || [];
  const normalizedQuery = normalizeRuleQuery(query);
  const rawQuery = String(query || "").trim();
  const matches = sections.filter((section) => !normalizedQuery || ruleSearchText(section).includes(normalizedQuery));
  const matchedSectionIds = new Set(matches.map((section) => ruleDomId(section)));
  const sectionWord = matches.length === 1 ? "section" : "sections";

  state.ruleMatches = [];
  state.activeRuleMatchIndex = -1;
  els.rulesSearchCount.textContent = normalizedQuery
    ? `${matches.length} of ${sections.length} ${sectionWord}`
    : `${sections.length} sections`;

  els.rulesToc.innerHTML = sections.map((section) => {
    const isMatch = !normalizedQuery || matchedSectionIds.has(ruleDomId(section));
    const searchClass = normalizedQuery ? (isMatch ? " is-match" : " is-muted") : "";
    return `
    <button class="toc-button${searchClass}" type="button" data-rule-id="${ruleDomId(section)}">
      <span class="toc-number">${escapeHtml(section.number)}</span>
      <span>${escapeHtml(section.title)}</span>
    </button>
  `;
  }).join("");

  els.rulesList.innerHTML = [
    renderRuleIntro(normalizedQuery, rawQuery, book),
    ...sections.map((section) => renderRuleSection(section, rawQuery))
  ].join("");

  updateRuleMatchNav();
  if (state.ruleMatches.length) {
    window.setTimeout(() => focusRuleMatch(0, false), 0);
  }
};
