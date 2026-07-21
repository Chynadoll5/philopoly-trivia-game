const SPREADSHEET_ID = "1b6_V2o3BThSVcRt0YJG4Y_sTqerqP6Zbw6s2Ef0CVlE";
const TOPIC_CONTROLS_SHEET = "Topic Controls";
const EXCLUDED_SHEETS = ["command center", "instructions", "topic controls"];
const GAME_STATE_PREFIX = "philopoly-game-state:";
const DEFAULT_RULES_DOCUMENT_ID = "1Mz6LMi-AY4o8MmGC6tFIRQpljWRb5ZLC";
const GOOGLE_DOC_MIME_TYPE = "application/vnd.google-apps.document";
const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TRIVIA_DATA_CACHE_KEY = `philopoly-trivia-data:${SPREADSHEET_ID || "active"}:v2`;
const TRIVIA_DATA_CACHE_SECONDS = 45;

function authorizeRulesAccess() {
  const file = DriveApp.getFileById(DEFAULT_RULES_DOCUMENT_ID);
  const mimeType = file.getMimeType();
  const documentName = mimeType === GOOGLE_DOC_MIME_TYPE
    ? DocumentApp.openById(DEFAULT_RULES_DOCUMENT_ID).getName()
    : file.getName();

  return {
    fileName: file.getName(),
    documentName,
    mimeType,
    url: file.getUrl()
  };
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = String(params.action || "data").trim().toLowerCase();
  let payload;

  if (action === "draw") {
    payload = drawQuestion_(params);
  } else if (action === "reset") {
    payload = resetGame_(params);
  } else if (action === "end") {
    payload = endGame_(params);
  } else if (action === "rules") {
    payload = readRulesPayload_(params);
  } else {
    payload = buildTriviaPayload_(params);
  }

  const json = JSON.stringify(payload).replace(/<\/script/gi, "<\\/script");
  const callback = params.callback;

  if (callback && /^[A-Za-z_$][\w.$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(`${callback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function readRulesPayload_(params) {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  const settings = readSettings_(spreadsheet);
  const sourceId = extractDocumentId_(
    params.rulesDocumentId ||
    params.rulesDocumentUrl ||
    settings.rulesDocumentId ||
    settings.rulesDocumentUrl ||
    DEFAULT_RULES_DOCUMENT_ID
  );

  if (!sourceId) {
    return {
      ok: false,
      message: "Add a Google Doc or Word .docx link in Command Center as Rules Document URL."
    };
  }

  try {
    const file = DriveApp.getFileById(sourceId);
    const mimeType = file.getMimeType();
    const sourceUrl = `https://docs.google.com/document/d/${sourceId}/edit`;
    let rules;

    if (mimeType === GOOGLE_DOC_MIME_TYPE) {
      const doc = DocumentApp.openById(sourceId);
      rules = parseRulesDocument_(doc.getBody(), doc.getName(), sourceUrl);
    } else if (mimeType === DOCX_MIME_TYPE) {
      rules = parseDocxRulesDocument_(file, sourceUrl);
    } else {
      return {
        ok: false,
        message: "The rules file must be a Google Doc or Microsoft Word .docx file.",
        fileName: file.getName(),
        mimeType
      };
    }

    return { ok: true, rules, generatedAt: new Date().toISOString() };
  } catch (error) {
    return {
      ok: false,
      message: `Could not read the rules document: ${error.message}`
    };
  }
}

function parseRulesDocument_(body, title, sourceUrl) {
  const blocks = readRulesDocumentBlocks_(body);
  return parseRulesBlocks_(blocks, title, sourceUrl);
}

function parseDocxRulesDocument_(file, sourceUrl) {
  const blocks = readDocxRuleBlocks_(file);
  return parseRulesBlocks_(blocks, file.getName(), sourceUrl);
}

function parseRulesBlocks_(blocks, title, sourceUrl) {
  const firstSectionIndex = findFirstRulesSectionIndex_(blocks);
  const intro = readRulesIntro_(blocks, firstSectionIndex);
  const sections = [];
  let current = null;
  let autoSectionNumber = 1;

  const ruleBlocks = blocks.slice(firstSectionIndex);
  ruleBlocks.forEach((block, index) => {
    const text = String(block.text || "").trim();
    const sectionHeading = readRuleSectionHeading_(block, autoSectionNumber);
    const nextBlock = ruleBlocks[index + 1];

    if (sectionHeading) {
      finishOpenRuleBlocks_(getRuleTarget_(current));
      current = {
        number: sectionHeading[1],
        title: sectionHeading[2],
        body: [],
        lists: [],
        tables: [],
        subsections: []
      };
      sections.push(current);
      autoSectionNumber = Number(sectionHeading[1]) + 1;
      return;
    }

    if (!current || shouldSkipRulesLine_(text)) return;

    if (isRulesSubheading_(block) || isPlainRulesSubheading_(block, nextBlock)) {
      finishOpenRuleBlocks_(getRuleTarget_(current));
      const subsection = {
        title: text,
        body: [],
        lists: [],
        tables: []
      };
      current.subsections.push(subsection);
      current._activeSubsection = subsection;
      return;
    }

    addRulesBlock_(getRuleTarget_(current), block);
  });

  finishOpenRuleBlocks_(getRuleTarget_(current));
  sections.forEach(cleanRuleBlock_);

  return {
    title: title || "Philopoly Rule Book",
    sourceName: title || "Philopoly Rule Book",
    sourceUrl,
    intro,
    sections
  };
}

function readRuleSectionHeading_(block, fallbackNumber) {
  const text = String(block && block.text || "").trim();
  if (!text || shouldSkipRulesLine_(text)) return null;

  const typedNumber = text.match(/^(\d{1,2})[.)]\s+(.+)$/);
  if (typedNumber) return [typedNumber[1], typedNumber[2].trim()];

  const heading = String(block.heading || "");
  if (!isTopLevelRulesHeading_(heading)) return null;
  if (/^(philopoly|play hard|the official rule book|for \d+)/i.test(text)) return null;

  const autoNumber = readDocxListNumber_(block) || String(fallbackNumber || 1);
  return [autoNumber, text];
}

function isTopLevelRulesHeading_(heading) {
  const text = String(heading || "").toLowerCase();
  return text === "heading1" || text === "heading 1" || text === "title";
}

function readDocxRuleBlocks_(file) {
  const documentXml = readDocxDocumentXml_(file);
  const document = XmlService.parse(documentXml);
  const root = document.getRootElement();
  const namespace = root.getNamespace();
  const body = root.getChild("body", namespace);
  const blocks = [];

  if (!body) return blocks;

  body.getChildren().forEach((child) => {
    const name = child.getName();

    if (name === "p") {
      const paragraph = readDocxParagraph_(child, namespace);
      if (paragraph) blocks.push(paragraph);
      return;
    }

    if (name === "tbl") {
      const rows = readDocxTableRows_(child, namespace);
      if (rows.length) blocks.push({ type: "table", rows });
    }
  });

  return blocks;
}

function readDocxDocumentXml_(file) {
  const docxBlob = file.getBlob().setContentType("application/zip");
  const blobs = Utilities.unzip(docxBlob);
  const documentBlob = blobs.find((blob) => blob.getName() === "word/document.xml");

  if (!documentBlob) {
    throw new Error("Could not find word/document.xml inside the .docx file.");
  }

  return documentBlob.getDataAsString("UTF-8");
}

function readDocxParagraph_(paragraph, namespace) {
  const text = normalizeDocxText_(collectDocxText_(paragraph)).trim();
  if (!text) return null;

  const paragraphProperties = paragraph.getChild("pPr", namespace);
  const styleElement = paragraphProperties && paragraphProperties.getChild("pStyle", namespace);
  const style = styleElement ? readDocxAttribute_(styleElement, "val", namespace) : "";
  const hasNumbering = Boolean(paragraphProperties && paragraphProperties.getChild("numPr", namespace));
  const numberingElement = paragraphProperties && paragraphProperties.getChild("numPr", namespace);
  const listNumber = numberingElement ? readDocxNumberingValue_(numberingElement, namespace) : "";

  return {
    type: hasNumbering ? "listItem" : "text",
    text,
    heading: style || "",
    listNumber
  };
}

function readDocxNumberingValue_(numberingElement, namespace) {
  const levelElement = numberingElement.getChild("ilvl", namespace);
  const level = levelElement ? readDocxAttribute_(levelElement, "val", namespace) : "";
  return level === "0" ? "" : "";
}

function readDocxListNumber_(block) {
  return String(block && block.listNumber || "").trim();
}

function readDocxTableRows_(table, namespace) {
  const rows = [];

  table.getChildren("tr", namespace).forEach((row) => {
    const cells = row.getChildren("tc", namespace).map((cell) => readDocxTableCell_(cell, namespace));
    if (cells.some((cell) => cell)) rows.push(cells);
  });

  return rows;
}

function readDocxTableCell_(cell, namespace) {
  const parts = [];

  cell.getChildren().forEach((child) => {
    if (child.getName() === "p") {
      const text = normalizeDocxText_(collectDocxText_(child)).trim();
      if (text) parts.push(text);
    }
  });

  return normalizeDocxText_(parts.join(" ")).trim();
}

function collectDocxText_(element) {
  const name = element.getName();
  if (name === "t") return element.getText();
  if (name === "tab") return " ";
  if (name === "br" || name === "cr") return "\n";

  return element.getChildren()
    .map((child) => collectDocxText_(child))
    .join("");
}

function normalizeDocxText_(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ");
}

function readDocxAttribute_(element, name, namespace) {
  const namespaced = element.getAttribute(name, namespace);
  if (namespaced) return namespaced.getValue();

  const plain = element.getAttribute(name);
  return plain ? plain.getValue() : "";
}

function readRulesDocumentBlocks_(body) {
  const blocks = [];

  for (let index = 0; index < body.getNumChildren(); index += 1) {
    const child = body.getChild(index);
    const type = child.getType();

    if (type === DocumentApp.ElementType.PARAGRAPH || type === DocumentApp.ElementType.LIST_ITEM) {
      const paragraph = type === DocumentApp.ElementType.LIST_ITEM
        ? child.asListItem()
        : child.asParagraph();
      const text = paragraph.getText().trim();
      if (text) {
        blocks.push({
          type: type === DocumentApp.ElementType.LIST_ITEM ? "listItem" : "text",
          text,
          heading: paragraph.getHeading ? String(paragraph.getHeading()) : ""
        });
      }
      continue;
    }

    if (type === DocumentApp.ElementType.TABLE) {
      const rows = readRulesTableRows_(child.asTable());
      if (rows.length) blocks.push({ type: "table", rows });
    }
  }

  return blocks;
}

function readRulesTableRows_(table) {
  const rows = [];

  for (let rowIndex = 0; rowIndex < table.getNumRows(); rowIndex += 1) {
    const row = table.getRow(rowIndex);
    const cells = [];

    for (let cellIndex = 0; cellIndex < row.getNumCells(); cellIndex += 1) {
      cells.push(row.getCell(cellIndex).getText().trim());
    }

    if (cells.some((cell) => cell)) rows.push(cells);
  }

  return rows;
}

function findFirstRulesSectionIndex_(blocks) {
  const sectionOneIndexes = [];
  const numberedSectionIndexes = [];
  let tableOfContentsIndex = -1;

  blocks.forEach((block, index) => {
    const text = String(block.text || "").trim();
    if (/^table of contents$/i.test(text)) tableOfContentsIndex = index;
    const sectionHeading = readRuleSectionHeading_(block, numberedSectionIndexes.length + 1);
    if (sectionHeading && sectionHeading[1] === "1") sectionOneIndexes.push(index);
    if (sectionHeading) numberedSectionIndexes.push(index);
  });

  if (tableOfContentsIndex >= 0) {
    const repeatedSectionOne = sectionOneIndexes.filter((index) => index > tableOfContentsIndex);
    if (repeatedSectionOne.length > 1) return repeatedSectionOne[1];
    if (repeatedSectionOne.length === 1) return repeatedSectionOne[0];
  }

  return numberedSectionIndexes.length ? numberedSectionIndexes[0] : 0;
}

function readRulesIntro_(blocks, firstSectionIndex) {
  const intro = [];

  for (let index = 0; index < firstSectionIndex; index += 1) {
    const text = String(blocks[index].text || "").trim();
    if (!text || shouldSkipRulesLine_(text)) continue;
    if (/^\d{1,2}\.\s+/.test(text)) continue;
    intro.push(text);
  }

  return intro;
}

function addRulesBlock_(target, block) {
  if (!target) return;

  if (block.type === "table") {
    finishOpenRuleList_(target);
    finishOpenRuleTable_(target);
    const title = takeRuleLabel_(target) || "Table";
    target.tables.push({
      title,
      headers: block.rows[0] || [],
      rows: block.rows.slice(1)
    });
    return;
  }

  const text = String(block.text || "").trim();
  if (!text || shouldSkipRulesLine_(text)) return;

  const pipeRow = parsePipeRuleRow_(text);
  if (pipeRow) {
    addPipeRuleRow_(target, pipeRow);
    return;
  }

  const listItem = parseRuleListItem_(block);
  if (listItem) {
    addRuleListItem_(target, listItem);
    return;
  }

  finishOpenRuleBlocks_(target);
  target.body.push(text);
}

function addRuleListItem_(target, item) {
  finishOpenRuleTable_(target);

  if (!target._openList) {
    const title = takeRuleLabel_(target) || "Details";
    target._openList = { title, items: [] };
    target.lists.push(target._openList);
  }

  target._openList.items.push(item);
}

function addPipeRuleRow_(target, row) {
  finishOpenRuleList_(target);

  if (!target._openTable) {
    const title = takeRuleLabel_(target) || "Table";
    target._openTable = {
      title,
      headers: row,
      rows: []
    };
    target.tables.push(target._openTable);
    return;
  }

  target._openTable.rows.push(row);
}

function parseRuleListItem_(block) {
  const text = String(block.text || "").trim();
  if (!text) return "";
  if (block.type === "listItem") return text.replace(/^[-*]\s+/, "").trim();
  const bulletMatch = text.match(/^[-*]\s+(.+)$/);
  return bulletMatch ? bulletMatch[1].trim() : "";
}

function parsePipeRuleRow_(text) {
  if (text.indexOf("|") === -1) return null;
  const cells = text.split("|").map((cell) => cell.trim());
  return cells.filter(Boolean).length > 1 ? cells : null;
}

function takeRuleLabel_(target) {
  if (!target || !target.body || !target.body.length) return "";
  const candidate = target.body[target.body.length - 1];
  if (candidate.length <= 90 && !/[.!?]$/.test(candidate)) {
    target.body.pop();
    return candidate;
  }
  return "";
}

function getRuleTarget_(section) {
  if (!section) return null;
  return section._activeSubsection || section;
}

function isRulesSubheading_(block) {
  const text = String(block.text || "").trim();
  if (!text || block.type !== "text" || /^\d{1,2}\.\s+/.test(text)) return false;
  const heading = String(block.heading || "");
  return heading && !/NORMAL/i.test(heading);
}

function isPlainRulesSubheading_(block, nextBlock) {
  const text = String(block.text || "").trim();
  const nextText = String(nextBlock && nextBlock.text || "").trim();
  if (!text || !nextText || block.type !== "text") return false;
  if (/^\d{1,2}\.\s+/.test(text) || /^\d{1,2}\.\s+/.test(nextText)) return false;
  if (shouldSkipRulesLine_(text) || shouldSkipRulesLine_(nextText)) return false;
  if (text.length > 70 || /[.!?:;]$/.test(text) || text.indexOf("|") !== -1) return false;
  if (parseRuleListItem_(block) || parseRuleListItem_(nextBlock) || parsePipeRuleRow_(nextText)) return false;
  return true;
}

function shouldSkipRulesLine_(text) {
  return /^table of contents$/i.test(text) || /update field/i.test(text);
}

function finishOpenRuleBlocks_(target) {
  finishOpenRuleList_(target);
  finishOpenRuleTable_(target);
}

function finishOpenRuleList_(target) {
  if (target && target._openList) delete target._openList;
}

function finishOpenRuleTable_(target) {
  if (target && target._openTable) delete target._openTable;
}

function cleanRuleBlock_(block) {
  if (!block) return;
  finishOpenRuleBlocks_(block);
  delete block._activeSubsection;
  delete block._openList;
  delete block._openTable;

  block.body = (block.body || []).filter(Boolean);
  block.lists = (block.lists || [])
    .map((list) => ({
      title: list.title || "",
      items: (list.items || []).filter(Boolean)
    }))
    .filter((list) => list.items.length);
  block.tables = (block.tables || [])
    .map((table) => ({
      title: table.title || "Table",
      headers: (table.headers || []).filter((header) => header !== ""),
      rows: (table.rows || []).filter((row) => row.some((cell) => cell !== ""))
    }))
    .filter((table) => table.headers.length || table.rows.length);
  block.subsections = (block.subsections || []).filter((subsection) => {
    cleanRuleBlock_(subsection);
    return subsection.body.length || subsection.lists.length || subsection.tables.length;
  });
}

function extractDocumentId_(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const urlMatch = text.match(/\/document\/d\/([A-Za-z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];
  const idMatch = text.match(/^[A-Za-z0-9_-]{20,}$/);
  return idMatch ? idMatch[0] : "";
}

function buildTriviaPayload_(params) {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  const gameCode = normalizeGameCode_(params && params.gameCode);
  const triviaData = readTriviaData_(spreadsheet, params && params.refresh === "1");
  const categories = triviaData.categories;
  const state = getGameState_(gameCode);

  return {
    settings: triviaData.settings,
    categories,
    sharedState: {
      gameCode,
      usedCount: state.used.length,
      totalCount: countQuestions_(categories),
      endedAt: state.endedAt || null
    },
    generatedAt: new Date().toISOString()
  };
}

function drawQuestion_(params) {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  const gameCode = normalizeGameCode_(params.gameCode);
  const categoryName = String(params.category || "__all").trim();
  const level = normalizeLevel_(String(params.level || "surprise").trim().toLowerCase());
  const categories = readTriviaData_(spreadsheet, params && params.refresh === "1").categories;
  const pool = getQuestionPool_(categories, categoryName, level);

  if (!pool.length) {
    return {
      ok: false,
      gameCode,
      message: "No questions found for that category and level."
    };
  }

  const state = getGameState_(gameCode);
  let used = new Set(state.used);
  let available = pool.filter((question) => !used.has(question.id));
  let refreshed = false;

  if (!available.length) {
    pool.forEach((question) => used.delete(question.id));
    available = pool.slice();
    refreshed = true;
  }

  const selected = available[Math.floor(Math.random() * available.length)];
  used.add(selected.id);
  state.used = Array.from(used);
  state.endedAt = null;
  state.updatedAt = new Date().toISOString();
  saveGameState_(gameCode, state);

  return {
    ok: true,
    gameCode,
    refreshed,
    question: selected,
    poolSize: pool.length,
    poolRemaining: pool.filter((question) => !used.has(question.id)).length,
    usedCount: state.used.length,
    totalCount: countQuestions_(categories),
    generatedAt: new Date().toISOString()
  };
}

function resetGame_(params) {
  const gameCode = normalizeGameCode_(params.gameCode);
  const state = {
    used: [],
    endedAt: null,
    updatedAt: new Date().toISOString()
  };
  saveGameState_(gameCode, state);
  return { ok: true, gameCode, usedCount: 0 };
}

function endGame_(params) {
  const gameCode = normalizeGameCode_(params.gameCode);
  const state = getGameState_(gameCode);
  state.endedAt = new Date().toISOString();
  state.updatedAt = state.endedAt;
  saveGameState_(gameCode, state);
  return { ok: true, gameCode, usedCount: state.used.length, endedAt: state.endedAt };
}

function readTriviaData_(spreadsheet, forceRefresh) {
  const cache = CacheService.getScriptCache();

  if (!forceRefresh) {
    const cached = cache.get(TRIVIA_DATA_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (error) {
        cache.remove(TRIVIA_DATA_CACHE_KEY);
      }
    }
  }

  const data = {
    settings: readSettings_(spreadsheet),
    categories: readCategories_(spreadsheet)
  };

  try {
    const serialized = JSON.stringify(data);
    if (serialized.length < 95000) {
      cache.put(TRIVIA_DATA_CACHE_KEY, serialized, TRIVIA_DATA_CACHE_SECONDS);
    }
  } catch (error) {
    // CacheService is a speed helper only; never block gameplay if it refuses a value.
  }

  return data;
}

function readSettings_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName("Command Center");
  if (!sheet) return {};

  const values = sheet.getDataRange().getDisplayValues();
  const settings = {};

  values.forEach((row) => {
    const key = String(row[0] || "").trim();
    const value = row[1];
    if (!key || key.toLowerCase() === "setting" || value === "") return;
    settings[toCamelKey_(key)] = coerceValue_(value);
  });

  return settings;
}

function readCategories_(spreadsheet) {
  const topicControls = readTopicControls_(spreadsheet);

  return spreadsheet.getSheets()
    .filter((sheet) => !EXCLUDED_SHEETS.includes(sheet.getName().trim().toLowerCase()))
    .filter((sheet) => topicControls.get(sheet.getName().trim().toLowerCase()) !== false)
    .map(readCategorySheet_)
    .filter((category) => category.questions.length);
}

function readTopicControls_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(TOPIC_CONTROLS_SHEET);
  const controls = new Map();
  if (!sheet) return controls;

  const values = sheet.getDataRange().getDisplayValues();
  const headerRowIndex = values.findIndex((row) => {
    const normalized = row.map(normalizeHeader_);
    return normalized.includes("category") && normalized.includes("enabled");
  });

  if (headerRowIndex === -1) return controls;

  const headers = values[headerRowIndex].map(normalizeHeader_);
  const categoryIndex = headers.indexOf("category");
  const enabledIndex = headers.indexOf("enabled");

  values.slice(headerRowIndex + 1).forEach((row) => {
    const category = String(row[categoryIndex] || "").trim().toLowerCase();
    if (!category) return;
    controls.set(category, isEnabled_(row[enabledIndex]));
  });

  return controls;
}

function readCategorySheet_(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  const headerRowIndex = values.findIndex((row) => {
    const normalized = row.map(normalizeHeader_);
    return normalized.includes("level") && normalized.includes("question") && normalized.includes("answer");
  });

  if (headerRowIndex === -1) {
    return { name: sheet.getName(), questions: [] };
  }

  const headers = values[headerRowIndex].map(normalizeHeader_);
  const levelIndex = headers.indexOf("level");
  const questionIndex = headers.indexOf("question");
  const answerIndex = headers.indexOf("answer");
  const variationsIndex = headers.indexOf("acceptedvariations");
  const blockedIndex = headers.indexOf("blocked");

  const questions = values.slice(headerRowIndex + 1)
    .map((row, offset) => {
      const level = String(row[levelIndex] || "").trim().toLowerCase();
      const question = String(row[questionIndex] || "").trim();
      const answer = String(row[answerIndex] || "").trim();
      const accepted = variationsIndex >= 0 ? row[variationsIndex] : "";
      const blocked = blockedIndex >= 0 ? row[blockedIndex] : "";

      if (!question || !answer || isBlocked_(blocked)) return null;

      return {
        id: `${sheet.getSheetId()}-${headerRowIndex + offset + 2}`,
        rowNumber: headerRowIndex + offset + 2,
        categoryName: sheet.getName(),
        level: normalizeLevel_(level),
        question,
        answer,
        acceptedVariations: splitAccepted_(accepted),
        blocked: false
      };
    })
    .filter(Boolean);

  return {
    name: sheet.getName(),
    questions
  };
}

function normalizeLevel_(level) {
  if (level.indexOf("easy") === 0) return "easy";
  if (level.indexOf("med") === 0) return "medium";
  if (level.indexOf("diff") === 0 || level.indexOf("hard") === 0) return "difficult";
  return "surprise";
}

function getQuestionPool_(categories, categoryName, level) {
  const normalizedCategory = String(categoryName || "__all").trim().toLowerCase();
  return categories.flatMap((category) => {
    if (normalizedCategory !== "__all" && category.name.trim().toLowerCase() !== normalizedCategory) {
      return [];
    }
    return category.questions
      .filter((question) => level === "surprise" || question.level === level)
      .map((question) => ({
        ...question,
        categoryName: category.name
      }));
  });
}

function countQuestions_(categories) {
  return categories.reduce((count, category) => count + category.questions.length, 0);
}

function normalizeGameCode_(value) {
  const normalized = String(value || "game-1")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "game-1";
}

function getGameState_(gameCode) {
  const raw = PropertiesService.getScriptProperties().getProperty(GAME_STATE_PREFIX + gameCode);
  if (!raw) {
    return { used: [], endedAt: null, updatedAt: null };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      used: Array.isArray(parsed.used) ? parsed.used.map(String) : [],
      endedAt: parsed.endedAt || null,
      updatedAt: parsed.updatedAt || null
    };
  } catch (error) {
    return { used: [], endedAt: null, updatedAt: null };
  }
}

function saveGameState_(gameCode, state) {
  PropertiesService.getScriptProperties().setProperty(
    GAME_STATE_PREFIX + gameCode,
    JSON.stringify({
      used: Array.isArray(state.used) ? state.used : [],
      endedAt: state.endedAt || null,
      updatedAt: state.updatedAt || new Date().toISOString()
    })
  );
}

function isEnabled_(value) {
  const text = String(value || "").trim().toLowerCase();
  return !["false", "no", "n", "0", "off", "disabled"].includes(text);
}

function isBlocked_(value) {
  const text = String(value || "").trim().toLowerCase();
  return ["true", "yes", "y", "1", "block", "blocked", "hide"].includes(text);
}

function splitAccepted_(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeHeader_(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toCamelKey_(value) {
  const parts = String(value || "")
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  return parts.map((part, index) => {
    if (index === 0) return part;
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join("");
}

function coerceValue_(value) {
  const text = String(value || "").trim();
  if (/^(true|false)$/i.test(text)) return text.toLowerCase() === "true";
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return value;
}
