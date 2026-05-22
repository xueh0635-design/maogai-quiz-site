(function () {
  const STORAGE_KEY = "maogai-quiz-state-v2";
  const SYNC_STORAGE_KEY = "maogai-quiz-sync-v1";
  const LEGACY_STORAGE_KEY = "maogai-quiz-state-v1";
  const AUTO_ADVANCE_DELAY = 800;
  const MEMORY_REPEAT_DELAY = 3;
  const SYNC_RETRY_DELAY = 2500;
  const TYPE_LABELS = {
    all: "全部",
    single: "单选",
    multiple: "多选",
    fill: "填空",
    judge: "判断",
  };

  const els = {
    chapterList: document.querySelector("#chapterList"),
    viewButtons: document.querySelectorAll(".view-button"),
    quizView: document.querySelector("#quizView"),
    knowledgeView: document.querySelector("#knowledgeView"),
    backToQuizButton: document.querySelector("#backToQuizButton"),
    mapFlow: document.querySelector("#mapFlow"),
    topicList: document.querySelector("#topicList"),
    topicDetail: document.querySelector("#topicDetail"),
    typeFilter: document.querySelector("#typeFilter"),
    currentScope: document.querySelector("#currentScope"),
    questionTitle: document.querySelector("#questionTitle"),
    questionType: document.querySelector("#questionType"),
    questionProgress: document.querySelector("#questionProgress"),
    questionStem: document.querySelector("#questionStem"),
    memoryStage: document.querySelector("#memoryStage"),
    memoryAnswerPreview: document.querySelector("#memoryAnswerPreview"),
    options: document.querySelector("#options"),
    fillArea: document.querySelector("#fillArea"),
    fillInput: document.querySelector("#fillInput"),
    prevButton: document.querySelector("#prevButton"),
    nextButton: document.querySelector("#nextButton"),
    submitButton: document.querySelector("#submitButton"),
    memoryPeekButton: document.querySelector("#memoryPeekButton"),
    bookmarkButton: document.querySelector("#bookmarkButton"),
    shuffleButton: document.querySelector("#shuffleButton"),
    explanationBox: document.querySelector("#explanationBox"),
    resultLine: document.querySelector("#resultLine"),
    answerLine: document.querySelector("#answerLine"),
    explanationText: document.querySelector("#explanationText"),
    questionCard: document.querySelector("#questionCard"),
    feedbackBadge: document.querySelector("#feedbackBadge"),
    totalCount: document.querySelector("#totalCount"),
    doneCount: document.querySelector("#doneCount"),
    accuracy: document.querySelector("#accuracy"),
    wrongCount: document.querySelector("#wrongCount"),
    totalLabel: document.querySelector("#totalLabel"),
    doneLabel: document.querySelector("#doneLabel"),
    accuracyLabel: document.querySelector("#accuracyLabel"),
    wrongLabel: document.querySelector("#wrongLabel"),
    answerSheet: document.querySelector("#answerSheet"),
    resetButton: document.querySelector("#resetButton"),
    installCard: document.querySelector("#installCard"),
    installButton: document.querySelector("#installButton"),
    syncGroupInput: document.querySelector("#syncGroupInput"),
    syncDeviceInput: document.querySelector("#syncDeviceInput"),
    syncCreateButton: document.querySelector("#syncCreateButton"),
    syncJoinButton: document.querySelector("#syncJoinButton"),
    syncNowButton: document.querySelector("#syncNowButton"),
    syncStatus: document.querySelector("#syncStatus"),
    syncMeta: document.querySelector("#syncMeta"),
  };

  const state = {
    data: null,
    questionMap: new Map(),
    knowledgeMap: null,
    view: "quiz",
    activeKnowledgeChapter: "导言",
    activeTopicId: null,
    topicQuestionIds: null,
    chapter: "全部",
    type: "all",
    mode: "all",
    index: 0,
    selected: new Set(),
    fillValue: "",
    submitted: false,
    lastCorrect: false,
    records: {},
    wrong: new Set(),
    bookmarked: new Set(),
    bookmarkedMeta: {},
    memoryRecords: {},
    memoryQueue: [],
    memoryScopeKey: "",
    memoryPhase: "preview",
    sync: {
      groupCode: "",
      deviceId: "",
      deviceName: "",
      revision: 0,
      lastSyncedAt: "",
      lastError: "",
      status: "未连接云同步",
      dirty: false,
      busy: false,
    },
    syncTimer: null,
    installPrompt: null,
    feedbackTimer: null,
    feedbackState: null,
    autoAdvancePending: false,
  };

  function createMemoryRecord() {
    return {
      previewed: false,
      attempts: 0,
      correct: 0,
      passed: false,
      pendingRepeat: false,
      lastCorrect: null,
      lastAnswer: "",
      lastSeenAt: null,
    };
  }

  function memoryRecordFor(questionId) {
    if (!state.memoryRecords[questionId]) {
      state.memoryRecords[questionId] = createMemoryRecord();
    }
    return state.memoryRecords[questionId];
  }

  function createDefaultDeviceName() {
    const isPhone = /iphone|ipod/i.test(navigator.userAgent);
    const isPad = /ipad/i.test(navigator.userAgent);
    const platform = isPhone ? "iPhone" : isPad ? "iPad" : /android/i.test(navigator.userAgent) ? "Android" : "电脑";
    return `${platform} · ${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  function loadSyncState() {
    try {
      const raw = JSON.parse(localStorage.getItem(SYNC_STORAGE_KEY) || "null");
      if (!raw) return;
      state.sync.groupCode = raw.groupCode || "";
      state.sync.deviceId = raw.deviceId || "";
      state.sync.deviceName = raw.deviceName || "";
      state.sync.revision = Number(raw.revision || 0);
      state.sync.lastSyncedAt = raw.lastSyncedAt || "";
      state.sync.lastError = raw.lastError || "";
      state.sync.status = raw.status || "未连接云同步";
      state.sync.dirty = Boolean(raw.dirty);
    } catch {
      // ignore broken sync metadata
    }
  }

  function saveSyncState() {
    localStorage.setItem(
      SYNC_STORAGE_KEY,
      JSON.stringify({
        groupCode: state.sync.groupCode,
        deviceId: state.sync.deviceId,
        deviceName: state.sync.deviceName,
        revision: state.sync.revision,
        lastSyncedAt: state.sync.lastSyncedAt,
        lastError: state.sync.lastError,
        status: state.sync.status,
        dirty: state.sync.dirty,
      }),
    );
  }

  function ensureSyncIdentity() {
    if (!state.sync.deviceId) {
      state.sync.deviceId = crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    }
    if (!state.sync.deviceName) {
      state.sync.deviceName = createDefaultDeviceName();
    }
  }

  function touchSyncStatus(text, error = "") {
    state.sync.status = text;
    state.sync.lastError = error;
    saveSyncState();
    renderSyncPanel();
  }

  function markSyncDirty() {
    if (!state.sync.groupCode) return;
    if (state.sync.busy) return;
    state.sync.dirty = true;
    saveSyncState();
    scheduleSyncSoon();
  }

  function scheduleSyncSoon() {
    if (!state.sync.groupCode || state.sync.busy) return;
    if (state.syncTimer) {
      window.clearTimeout(state.syncTimer);
    }
    state.syncTimer = window.setTimeout(() => {
      state.syncTimer = null;
      syncNow({ silent: true }).catch(() => {});
    }, SYNC_RETRY_DELAY);
  }

  function timestampOf(value) {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function recordUpdatedAt(record) {
    return timestampOf(record?.updatedAt || record?.at || record?.lastSeenAt);
  }

  function normalizeRecords(records = {}) {
    const normalized = {};
    Object.entries(records).forEach(([id, record]) => {
      normalized[id] = {
        ...record,
        updatedAt: record.updatedAt || record.at || nowIso(),
      };
    });
    return normalized;
  }

  function normalizeMemoryRecords(records = {}) {
    const normalized = {};
    Object.entries(records).forEach(([id, record]) => {
      normalized[id] = {
        ...createMemoryRecord(),
        ...record,
        updatedAt: record.updatedAt || record.lastSeenAt || nowIso(),
      };
    });
    return normalized;
  }

  function normalizeBookmarkMeta(meta = {}, bookmarked = new Set()) {
    const normalized = {};
    Object.entries(meta).forEach(([id, record]) => {
      normalized[id] = {
        value: record?.value !== false,
        updatedAt: record?.updatedAt || nowIso(),
      };
    });
    bookmarked.forEach((id) => {
      if (!normalized[id]) {
        normalized[id] = { value: true, updatedAt: nowIso() };
      }
    });
    return normalized;
  }

  function bookmarkedSetFromMeta(meta = {}) {
    return new Set(Object.entries(meta).filter(([, record]) => record?.value !== false).map(([id]) => id));
  }

  function captureSession() {
    return {
      view: state.view,
      activeKnowledgeChapter: state.activeKnowledgeChapter,
      activeTopicId: state.activeTopicId,
      topicQuestionIds: state.topicQuestionIds,
      chapter: state.chapter,
      type: state.type,
      mode: state.mode,
      index: state.index,
      memoryScopeKey: state.memoryScopeKey,
      memoryPhase: state.memoryPhase,
      currentQuestionId: currentQuestion()?.id || null,
      updatedAt: nowIso(),
    };
  }

  function applySession(session = {}) {
    if (!session) return;
    if (session.view) state.view = session.view;
    if (session.activeKnowledgeChapter) state.activeKnowledgeChapter = session.activeKnowledgeChapter;
    if (Object.prototype.hasOwnProperty.call(session, "activeTopicId")) state.activeTopicId = session.activeTopicId;
    if (Object.prototype.hasOwnProperty.call(session, "topicQuestionIds")) state.topicQuestionIds = session.topicQuestionIds;
    if (session.chapter) state.chapter = session.chapter;
    if (session.type) state.type = session.type;
    if (session.mode) state.mode = session.mode;
    if (typeof session.index === "number") state.index = session.index;
    if (session.memoryScopeKey) state.memoryScopeKey = session.memoryScopeKey;
    if (session.memoryPhase) state.memoryPhase = session.memoryPhase;
  }

  function localSyncSnapshot() {
    return {
      schemaVersion: 1,
      session: captureSession(),
      records: deepClone(state.records),
      bookmarked: Object.fromEntries(
        Object.entries(state.bookmarkedMeta).map(([id, record]) => [id, { ...record }]),
      ),
      memoryRecords: deepClone(state.memoryRecords),
    };
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeTimestampedMap(localMap = {}, remoteMap = {}) {
    const merged = deepClone(localMap || {});
    Object.entries(remoteMap || {}).forEach(([id, remoteRecord]) => {
      const localRecord = merged[id];
      const localTime = recordUpdatedAt(localRecord);
      const remoteTime = recordUpdatedAt(remoteRecord);
      if (!localRecord || remoteTime >= localTime) {
        merged[id] = deepClone(remoteRecord);
      }
    });
    return merged;
  }

  function mergeBookmarkMeta(localMeta = {}, remoteMeta = {}) {
    const merged = deepClone(localMeta || {});
    Object.entries(remoteMeta || {}).forEach(([id, remoteRecord]) => {
      const localRecord = merged[id];
      const localTime = timestampOf(localRecord?.updatedAt);
      const remoteTime = timestampOf(remoteRecord?.updatedAt);
      if (!localRecord || remoteTime >= localTime) {
        merged[id] = {
          value: remoteRecord?.value !== false,
          updatedAt: remoteRecord?.updatedAt || nowIso(),
        };
      }
    });
    return merged;
  }

  function mergeSession(localSession = {}, remoteSession = {}) {
    if (!remoteSession) return deepClone(localSession || {});
    if (!localSession?.updatedAt) return deepClone(remoteSession);
    return timestampOf(remoteSession.updatedAt) >= timestampOf(localSession.updatedAt)
      ? deepClone(remoteSession)
      : deepClone(localSession);
  }

  function mergeSyncSnapshots(localSnapshot, remoteSnapshot) {
    const merged = {
      schemaVersion: 1,
      session: mergeSession(localSnapshot.session, remoteSnapshot.session),
      records: mergeTimestampedMap(localSnapshot.records, remoteSnapshot.records),
      bookmarked: mergeBookmarkMeta(localSnapshot.bookmarked, remoteSnapshot.bookmarked),
      memoryRecords: mergeTimestampedMap(localSnapshot.memoryRecords, remoteSnapshot.memoryRecords),
    };
    return merged;
  }

  function applyMergedSnapshot(snapshot) {
    if (!snapshot) return;
    state.records = normalizeRecords(snapshot.records || {});
    state.bookmarkedMeta = normalizeBookmarkMeta(snapshot.bookmarked || {});
    state.bookmarked = bookmarkedSetFromMeta(state.bookmarkedMeta);
    state.memoryRecords = normalizeMemoryRecords(snapshot.memoryRecords || {});
    if (snapshot.session) {
      applySession(snapshot.session);
    }
    state.wrong = new Set(
      Object.entries(state.records)
        .filter(([, record]) => record && !record.correct)
        .map(([id]) => id),
    );
  }

  function clearFeedbackTimer() {
    if (state.feedbackTimer) {
      window.clearTimeout(state.feedbackTimer);
      state.feedbackTimer = null;
    }
    state.autoAdvancePending = false;
  }

  function refreshFeedbackUI() {
    renderQuestion();
    renderAnswerSheet();
  }

  function setFeedbackState(nextState) {
    state.feedbackState = nextState;
    if (!els.questionCard || !els.feedbackBadge) return;
    els.questionCard.classList.remove("feedback-correct", "feedback-wrong");
    els.feedbackBadge.classList.add("hidden");
    els.feedbackBadge.classList.remove("badge-correct", "badge-wrong", "badge-pop");

    if (nextState === "correct") {
      els.questionCard.classList.add("feedback-correct");
      els.feedbackBadge.textContent = "回答正确";
      els.feedbackBadge.classList.remove("hidden");
      els.feedbackBadge.classList.add("badge-correct", "badge-pop");
    } else if (nextState === "wrong") {
      els.questionCard.classList.add("feedback-wrong");
      els.feedbackBadge.textContent = "回答错误";
      els.feedbackBadge.classList.remove("hidden");
      els.feedbackBadge.classList.add("badge-wrong", "badge-pop");
    }
  }

  function scheduleAutoAdvance(nextIndex) {
    clearFeedbackTimer();
    state.autoAdvancePending = true;
    refreshFeedbackUI();
    state.feedbackTimer = window.setTimeout(() => {
      state.feedbackTimer = null;
      state.autoAdvancePending = false;
      setIndex(nextIndex);
    }, AUTO_ADVANCE_DELAY);
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isStandalone() {
    return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone;
  }

  function setupInstallPrompt() {
    if (!els.installCard || !els.installButton) return;
    if (isStandalone()) {
      els.installCard.classList.add("hidden");
      return;
    }

    const iosText = "Safari 分享 → 添加到主屏幕";
    els.installButton.textContent = isIos() ? iosText : "添加到主屏幕";

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.installPrompt = event;
      els.installCard.classList.remove("hidden");
      els.installButton.textContent = "添加到主屏幕";
    });

    els.installButton.addEventListener("click", async () => {
      if (state.installPrompt) {
        state.installPrompt.prompt();
        await state.installPrompt.userChoice;
        state.installPrompt = null;
        return;
      }
      if (isIos()) {
        alert("在 iPhone/iPad 上请用 Safari 打开本页，点底部分享按钮，然后选择“添加到主屏幕”。");
      } else {
        alert("如果浏览器没有弹出安装按钮，可以先收藏本页；使用 HTTPS 打开时会支持离线安装。");
      }
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.warn("Service worker registration failed", error);
      });
    });
  }

  function loadSavedState() {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (current) {
        state.records = normalizeRecords(current.records || {});
        state.wrong = new Set(current.wrong || []);
        state.bookmarkedMeta = normalizeBookmarkMeta(current.bookmarkedMeta || {}, new Set(current.bookmarked || []));
        state.bookmarked = bookmarkedSetFromMeta(state.bookmarkedMeta);
        state.memoryRecords = normalizeMemoryRecords(current.memoryRecords || {});
        state.memoryQueue = Array.isArray(current.memoryQueue) ? current.memoryQueue : [];
        state.memoryScopeKey = current.memoryScopeKey || "";
        if (current.session) {
          applySession(current.session);
        }
        return;
      }
      const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "{}");
      state.records = normalizeRecords(legacy.records || {});
      state.wrong = new Set(legacy.wrong || []);
      state.bookmarkedMeta = normalizeBookmarkMeta({}, new Set(legacy.bookmarked || []));
      state.bookmarked = bookmarkedSetFromMeta(state.bookmarkedMeta);
      state.memoryRecords = {};
      state.memoryQueue = [];
      state.memoryScopeKey = "";
    } catch {
      state.records = {};
      state.wrong = new Set();
      state.bookmarked = new Set();
      state.bookmarkedMeta = {};
      state.memoryRecords = {};
      state.memoryQueue = [];
      state.memoryScopeKey = "";
    }
  }

  function saveState(options = {}) {
    state.session = captureSession();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        records: state.records,
        wrong: [...state.wrong],
        bookmarked: [...state.bookmarked],
        bookmarkedMeta: state.bookmarkedMeta,
        memoryRecords: state.memoryRecords,
        memoryQueue: state.memoryQueue,
        memoryScopeKey: state.memoryScopeKey,
        session: state.session,
      }),
    );
    if (!options.skipSyncMark) {
      markSyncDirty();
    }
  }

  async function loadData() {
    let questionBank;
    if (window.QUESTION_BANK) {
      questionBank = window.QUESTION_BANK;
    } else {
      const response = await fetch("./questions.json");
      questionBank = await response.json();
    }
    let knowledgeMap = window.KNOWLEDGE_MAP;
    if (!knowledgeMap) {
      const response = await fetch("./knowledge-map.json");
      knowledgeMap = await response.json();
    }
    return { questionBank, knowledgeMap };
  }

  function configReady() {
    return Boolean(window.MaogaiSyncClient && window.MAOGAI_SYNC_CONFIG?.databaseUrl);
  }

  function renderSyncPanel() {
    if (!els.syncStatus || !els.syncMeta || !els.syncGroupInput || !els.syncDeviceInput) return;
    els.syncGroupInput.value = state.sync.groupCode || "";
    els.syncDeviceInput.value = state.sync.deviceName || "";
    const syncedAt = state.sync.lastSyncedAt ? new Date(state.sync.lastSyncedAt).toLocaleString("zh-CN") : "未同步";
    const revision = state.sync.revision ? `r${state.sync.revision}` : "r0";
    const device = state.sync.deviceName || "未命名设备";
    els.syncStatus.textContent = state.sync.lastError
      ? `${state.sync.status}：${state.sync.lastError}`
      : state.sync.status;
    els.syncMeta.textContent = state.sync.groupCode
      ? `同步码 ${state.sync.groupCode} · ${device} · ${revision} · 最近同步 ${syncedAt}`
      : `本地记录仅保存在当前设备。创建同步码后，手机和电脑就能共享同一份学习档案。`;
    if (els.syncCreateButton) els.syncCreateButton.disabled = state.sync.busy;
    if (els.syncJoinButton) els.syncJoinButton.disabled = state.sync.busy;
    if (els.syncNowButton) els.syncNowButton.disabled = state.sync.busy || !state.sync.groupCode;
    if (els.syncGroupInput) els.syncGroupInput.disabled = state.sync.busy;
    if (els.syncDeviceInput) els.syncDeviceInput.disabled = state.sync.busy;
  }

  function prepareSnapshotForCloud(snapshot) {
    const next = deepClone(snapshot);
    next.meta = {
      schemaVersion: 1,
      updatedAt: nowIso(),
      deviceId: state.sync.deviceId,
      deviceName: state.sync.deviceName,
    };
    return next;
  }

  function cloudPayloadFromRow(row) {
    if (!row?.state) {
      return {
        schemaVersion: 1,
        session: {},
        records: {},
        bookmarked: {},
        memoryRecords: {},
      };
    }
    return typeof row.state === "string" ? JSON.parse(row.state) : row.state;
  }

  async function createCloudGroup() {
    ensureSyncIdentity();
    const inputCode = (els.syncGroupInput?.value || "").trim().toUpperCase();
    const groupCode = inputCode || MaogaiSyncClient.randomCode(8);
    const snapshot = prepareSnapshotForCloud(localSyncSnapshot());
    state.sync.groupCode = groupCode;
    touchSyncStatus("正在创建云档案…");

    const existing = await MaogaiSyncClient.fetchGroup(groupCode);
    if (existing) {
      const remote = cloudPayloadFromRow(existing);
      const merged = mergeSyncSnapshots(localSyncSnapshot(), remote);
      const current = await MaogaiSyncClient.updateGroup(
        groupCode,
        Number(existing.revision || 0),
        prepareSnapshotForCloud(merged),
        state.sync,
      );
      if (!current) {
        throw new Error("同步档案刚好被其他设备更新了，请再同步一次");
      }
      state.sync.revision = Number(current.revision || 0);
      state.sync.lastSyncedAt = nowIso();
      state.sync.dirty = false;
      saveSyncState();
      applyMergedSnapshot(cloudPayloadFromRow(current));
      saveState({ skipSyncMark: true });
      touchSyncStatus("云档案已连接");
      render();
      return;
    }

    const created = await MaogaiSyncClient.createGroup(groupCode, snapshot, state.sync);
    if (!created) {
      throw new Error("云档案创建失败");
    }

    state.sync.revision = Number(created.revision || 0);
    state.sync.lastSyncedAt = nowIso();
    state.sync.dirty = false;
    saveSyncState();
    applyMergedSnapshot(cloudPayloadFromRow(created));
    saveState({ skipSyncMark: true });
    touchSyncStatus("云档案已创建");
    render();
  }

  async function joinCloudGroup() {
    ensureSyncIdentity();
    const groupCode = (els.syncGroupInput?.value || "").trim().toUpperCase();
    if (!groupCode) {
      throw new Error("请输入同步码");
    }
    state.sync.groupCode = groupCode;
    touchSyncStatus("正在加入云档案…");
    const row = await MaogaiSyncClient.fetchGroup(groupCode);
    if (!row) {
      throw new Error("没找到这个同步码");
    }
    const remote = cloudPayloadFromRow(row);
    const merged = mergeSyncSnapshots(localSyncSnapshot(), remote);
    const current = await MaogaiSyncClient.updateGroup(groupCode, Number(row.revision || 0), prepareSnapshotForCloud(merged), state.sync);
    if (!current) {
      throw new Error("加入成功，但云端状态刚好被其他设备更新了，请再同步一次");
    }
    state.sync.revision = Number(current.revision || 0);
    state.sync.lastSyncedAt = nowIso();
    state.sync.dirty = false;
    saveSyncState();
    applyMergedSnapshot(cloudPayloadFromRow(current));
    saveState({ skipSyncMark: true });
    touchSyncStatus("已加入云档案");
    render();
  }

  async function syncNow(options = {}) {
    if (!configReady()) return;
    if (!state.sync.groupCode) {
      if (!options.silent) touchSyncStatus("还没有同步码");
      return;
    }
    if (state.sync.busy) return;
    ensureSyncIdentity();
    state.sync.busy = true;
    if (!options.silent) touchSyncStatus("正在同步…");
    renderSyncPanel();

    try {
      let row = await MaogaiSyncClient.fetchGroup(state.sync.groupCode);
      const localSnapshot = localSyncSnapshot();
      if (!row) {
        row = await MaogaiSyncClient.createGroup(state.sync.groupCode, prepareSnapshotForCloud(localSnapshot), state.sync);
        if (!row) {
          throw new Error("创建云档案失败");
        }
        applyMergedSnapshot(cloudPayloadFromRow(row));
        saveState({ skipSyncMark: true });
      } else {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const remote = cloudPayloadFromRow(row);
          const merged = mergeSyncSnapshots(localSnapshot, remote);
          const updated = await MaogaiSyncClient.updateGroup(
            state.sync.groupCode,
            Number(row.revision || 0),
            prepareSnapshotForCloud(merged),
            state.sync,
          );
          if (updated) {
            row = updated;
            applyMergedSnapshot(merged);
            saveState({ skipSyncMark: true });
            break;
          }
          row = await MaogaiSyncClient.fetchGroup(state.sync.groupCode);
          if (!row) {
            throw new Error("云档案在同步途中消失了");
          }
        }
      }

      state.sync.revision = Number(row.revision || 0);
      state.sync.lastSyncedAt = nowIso();
      state.sync.dirty = false;
      state.sync.lastError = "";
      state.sync.status = "同步完成";
      saveSyncState();
      renderSyncPanel();
      if (!options.silent) render();
    } catch (error) {
      state.sync.lastError = error?.message || "同步失败";
      state.sync.status = "同步失败";
      saveSyncState();
      renderSyncPanel();
      if (!options.silent) console.warn("Sync failed", error);
    } finally {
      state.sync.busy = false;
      renderSyncPanel();
    }
  }

  function baseScopedQuestions() {
    if (!state.data) return [];
    let pool = state.data.questions.slice();
    if (state.topicQuestionIds) {
      const allowed = new Set(state.topicQuestionIds);
      pool = pool.filter((question) => allowed.has(question.id));
    }
    if (state.chapter !== "全部") {
      pool = pool.filter((question) => question.chapter === state.chapter);
    }
    if (state.type !== "all") {
      pool = pool.filter((question) => question.type === state.type);
    }
    return pool;
  }

  function memoryScopeKey() {
    return JSON.stringify({
      chapter: state.chapter,
      type: state.type,
      topicQuestionIds: state.topicQuestionIds || null,
    });
  }

  function rebuildMemoryQueue(preserveCurrent = false) {
    const scopedIds = baseScopedQuestions().map((question) => question.id);
    const currentId = preserveCurrent ? state.memoryQueue[state.index]?.id || null : null;
    state.memoryQueue = scopedIds.map((id) => ({ id, phase: "preview", repeated: false }));
    state.memoryScopeKey = memoryScopeKey();
    if (currentId) {
      const nextIndex = state.memoryQueue.findIndex((entry) => entry.id === currentId);
      state.index = nextIndex >= 0 ? nextIndex : 0;
    } else {
      state.index = Math.min(state.index, Math.max(state.memoryQueue.length - 1, 0));
    }
    syncMemoryPhase();
  }

  function ensureMemoryQueue() {
    if (state.mode !== "memory") return;
    const nextKey = memoryScopeKey();
    if (state.memoryScopeKey !== nextKey || !state.memoryQueue.length) {
      rebuildMemoryQueue(Boolean(state.memoryQueue.length));
      return;
    }
    const allowedIds = new Set(baseScopedQuestions().map((question) => question.id));
    const filteredQueue = state.memoryQueue.filter((entry) => allowedIds.has(entry.id));
    if (filteredQueue.length !== state.memoryQueue.length) {
      const currentId = state.memoryQueue[state.index]?.id || null;
      state.memoryQueue = filteredQueue;
      if (currentId) {
        const nextIndex = state.memoryQueue.findIndex((entry) => entry.id === currentId);
        state.index = nextIndex >= 0 ? nextIndex : 0;
      } else {
        state.index = Math.min(state.index, Math.max(state.memoryQueue.length - 1, 0));
      }
      syncMemoryPhase();
    }
  }

  function currentPool() {
    if (!state.data) return [];
    if (state.mode === "memory") {
      ensureMemoryQueue();
      return state.memoryQueue
        .map((entry) => state.questionMap.get(entry.id))
        .filter(Boolean);
    }
    let pool = baseScopedQuestions();
    if (state.mode === "wrong") {
      pool = pool.filter((question) => state.wrong.has(question.id));
    }
    if (state.mode === "bookmarked") {
      pool = pool.filter((question) => state.bookmarked.has(question.id));
    }
    return pool;
  }

  function currentQuestion() {
    const pool = currentPool();
    return pool[state.index] || null;
  }

  function currentMemoryEntry() {
    if (state.mode !== "memory") return null;
    ensureMemoryQueue();
    return state.memoryQueue[state.index] || null;
  }

  function syncMemoryPhase() {
    const entry = currentMemoryEntry();
    state.memoryPhase = entry?.phase || "preview";
  }

  function resetInteraction() {
    clearFeedbackTimer();
    state.selected = new Set();
    state.fillValue = "";
    state.submitted = false;
    state.lastCorrect = false;
    state.feedbackState = null;
    if (els.fillInput) els.fillInput.value = "";
    setFeedbackState(null);
    syncMemoryPhase();
  }

  function setIndex(index) {
    const pool = currentPool();
    state.index = Math.min(Math.max(index, 0), Math.max(pool.length - 1, 0));
    resetInteraction();
    render();
    saveState();
  }

  function setFilters(next = {}) {
    const modeChanging = Object.prototype.hasOwnProperty.call(next, "mode");
    Object.assign(state, next);
    if (!Object.prototype.hasOwnProperty.call(next, "topicQuestionIds") && (next.chapter || next.type)) {
      state.topicQuestionIds = null;
      state.activeTopicId = null;
    }
    state.index = 0;
    if (state.mode === "memory") {
      rebuildMemoryQueue(false);
    } else if (modeChanging) {
      state.memoryPhase = "preview";
    }
    resetInteraction();
    render();
    saveState();
  }

  function setView(view) {
    state.view = view;
    if (window.location.hash !== `#${view}`) {
      history.replaceState(null, "", `#${view}`);
    }
    render();
  }

  function setKnowledgeChapter(chapter) {
    state.activeKnowledgeChapter = chapter;
    const chapterData = getKnowledgeChapter(chapter);
    const firstTopic = chapterData?.sections?.[0]?.topics?.[0];
    state.activeTopicId = firstTopic ? firstTopic.id : null;
    renderKnowledge();
  }

  function setActiveTopic(topicId) {
    state.activeTopicId = topicId;
    renderKnowledge();
  }

  function studyTopic(topicId) {
    const topic = findTopic(topicId);
    if (!topic) return;
    state.topicQuestionIds = topic.topic.questionIds;
    state.activeTopicId = topicId;
    state.chapter = "全部";
    state.type = "all";
    state.mode = "all";
    state.index = 0;
    resetInteraction();
    setView("quiz");
    saveState();
  }

  function shufflePool() {
    if (!state.data) return;
    const scoped = currentPool().map((question) => question.id);
    const rank = new Map(scoped.map((id, index) => [id, index + Math.random()]));
    state.data.questions.sort((a, b) => (rank.get(a.id) || 99999) - (rank.get(b.id) || 99999));
    if (state.mode === "memory") {
      rebuildMemoryQueue(false);
      resetInteraction();
      render();
      saveState();
      return;
    }
    setIndex(0);
  }

  function normalizeAnswer(value) {
    return String(value || "")
      .replace(/\s+/g, "")
      .replace(/[，、；;]/g, "")
      .toUpperCase();
  }

  function expectedAnswer(question) {
    if (!question) return "";
    if (question.type === "judge") {
      return question.answer === "正确" ? "A" : "B";
    }
    if (question.type === "multiple") {
      return normalizeAnswer(question.answer).split("").sort().join("");
    }
    return normalizeAnswer(question.answer);
  }

  function userAnswer(question) {
    if (!question) return "";
    if (question.type === "single" || question.type === "judge") {
      return [...state.selected][0] || "";
    }
    if (question.type === "multiple") {
      return [...state.selected].sort().join("");
    }
    return normalizeAnswer(state.fillValue);
  }

  function answerIsCorrect(question) {
    if (question.type === "fill") {
      return normalizeAnswer(state.fillValue) === normalizeAnswer(question.answer);
    }
    return normalizeAnswer(userAnswer(question)) === expectedAnswer(question);
  }

  function readableAnswer(question, value) {
    if (!value) return "未作答";
    if (question.type === "judge") {
      if (value === "A") return "正确";
      if (value === "B") return "错误";
    }
    return value;
  }

  function markMemoryPreviewSeen(question) {
    const record = memoryRecordFor(question.id);
    if (!record.previewed) {
      record.previewed = true;
      record.lastSeenAt = new Date().toISOString();
      record.updatedAt = record.lastSeenAt;
      saveState();
    }
  }

  function enterMemoryRecall() {
    const question = currentQuestion();
    const entry = currentMemoryEntry();
    if (!question || !entry || state.autoAdvancePending) return;
    const record = memoryRecordFor(question.id);
    record.previewed = true;
    record.lastSeenAt = new Date().toISOString();
    record.updatedAt = record.lastSeenAt;
    entry.phase = "recall";
    state.memoryPhase = "recall";
    state.selected = new Set();
    state.fillValue = "";
    state.submitted = false;
    state.lastCorrect = false;
    setFeedbackState(null);
    saveState();
    render();
  }

  function peekMemoryPreview() {
    if (!els.memoryStage) return;
    els.memoryStage.classList.remove("stage-pulse");
    void els.memoryStage.offsetWidth;
    els.memoryStage.classList.add("stage-pulse");
    window.setTimeout(() => {
      els.memoryStage?.classList.remove("stage-pulse");
    }, 420);
  }

  function scheduleMemoryRepeat(questionId) {
    const insertIndex = Math.min(state.index + MEMORY_REPEAT_DELAY + 1, state.memoryQueue.length);
    const hasLaterRepeat = state.memoryQueue.some(
      (entry, index) => index > state.index && entry.id === questionId && entry.repeated,
    );
    if (hasLaterRepeat) return;
    state.memoryQueue.splice(insertIndex, 0, {
      id: questionId,
      phase: "preview",
      repeated: true,
    });
  }

  function submitMemoryRecall(question) {
    if (question.type === "fill") {
      state.fillValue = els.fillInput.value;
    }
    const correct = answerIsCorrect(question);
    const record = memoryRecordFor(question.id);
    state.submitted = true;
    state.lastCorrect = correct;
    record.attempts += 1;
    record.lastCorrect = correct;
    record.lastAnswer = userAnswer(question);
    record.lastSeenAt = new Date().toISOString();
    record.updatedAt = record.lastSeenAt;
    if (correct) {
      record.correct += 1;
      record.passed = true;
      record.pendingRepeat = false;
    } else {
      record.passed = false;
      record.pendingRepeat = true;
      scheduleMemoryRepeat(question.id);
    }
    saveState();
    setFeedbackState(correct ? "correct" : "wrong");
    render();

    if (correct) {
      const pool = currentPool();
      if (state.index < pool.length - 1) {
        scheduleAutoAdvance(state.index + 1);
      }
    }
  }

  function submit() {
    const question = currentQuestion();
    if (!question || state.autoAdvancePending) return;

    if (state.mode === "memory") {
      if (state.memoryPhase === "preview") {
        enterMemoryRecall();
        return;
      }
      submitMemoryRecall(question);
      return;
    }

    if (question.type === "fill") {
      state.fillValue = els.fillInput.value;
    }
    const correct = answerIsCorrect(question);
    const now = new Date().toISOString();
    state.submitted = true;
    state.lastCorrect = correct;
    state.records[question.id] = {
      correct,
      answer: userAnswer(question),
      at: now,
      updatedAt: now,
    };
    if (correct) state.wrong.delete(question.id);
    else state.wrong.add(question.id);
    saveState();
    setFeedbackState(correct ? "correct" : "wrong");
    render();

    if (correct) {
      const pool = currentPool();
      if (state.index < pool.length - 1) {
        scheduleAutoAdvance(state.index + 1);
      }
    }
  }

  function toggleOption(key) {
    const question = currentQuestion();
    if (!question || state.submitted) return;
    if (state.mode === "memory" && state.memoryPhase === "preview") return;
    if (question.type === "multiple") {
      if (state.selected.has(key)) state.selected.delete(key);
      else state.selected.add(key);
    } else {
      state.selected = new Set([key]);
    }
    renderQuestion();
  }

  function toggleBookmark() {
    const question = currentQuestion();
    if (!question) return;
    const now = new Date().toISOString();
    if (state.bookmarked.has(question.id)) {
      state.bookmarked.delete(question.id);
      state.bookmarkedMeta[question.id] = { value: false, updatedAt: now };
    } else {
      state.bookmarked.add(question.id);
      state.bookmarkedMeta[question.id] = { value: true, updatedAt: now };
    }
    saveState();
    render();
  }

  function renderChapterList() {
    const chapters = ["全部", ...state.data.chapters];
    els.chapterList.innerHTML = chapters
      .map((chapter) => {
        const count =
          chapter === "全部"
            ? state.data.questions.length
            : state.data.questions.filter((question) => question.chapter === chapter).length;
        return `<button class="chapter-button ${chapter === state.chapter ? "active" : ""}" data-chapter="${chapter}" type="button"><span>${chapter}</span><span>${count}</span></button>`;
      })
      .join("");
  }

  function renderTypeFilter() {
    els.typeFilter.innerHTML = Object.entries(TYPE_LABELS)
      .map(
        ([key, label]) =>
          `<button class="${key === state.type ? "active" : ""}" data-type="${key}" type="button">${label}</button>`,
      )
      .join("");
  }

  function renderPreviewExplanation(question) {
    els.explanationBox.classList.remove("hidden");
    els.resultLine.textContent = "先看答案记忆";
    els.resultLine.className = "result-line ok";
    els.answerLine.textContent = `正确答案：${question.answer || "未识别"}`;
    els.explanationText.textContent = question.explanation || "暂无解析。";
  }

  function renderSubmittedExplanation(question) {
    els.explanationBox.classList.remove("hidden");
    els.resultLine.textContent = state.lastCorrect ? "回答正确" : "回答错误";
    els.resultLine.className = `result-line ${state.lastCorrect ? "ok" : "bad"}`;
    const answerSource = state.mode === "memory" ? memoryRecordFor(question.id).lastAnswer : userAnswer(question);
    els.answerLine.textContent = `你的答案：${readableAnswer(question, answerSource)} · 正确答案：${question.answer || "未识别"}`;
    els.explanationText.textContent = question.explanation || "暂无解析。";
  }

  function renderQuestion() {
    const pool = currentPool();
    const question = currentQuestion();
    const memoryMode = state.mode === "memory";
    const entry = memoryMode ? currentMemoryEntry() : null;
    const memoryPreview = memoryMode && state.memoryPhase === "preview";
    const controlsLocked = state.autoAdvancePending;

    els.totalCount.textContent = String(pool.length);
    els.questionProgress.textContent = pool.length ? `${state.index + 1} / ${pool.length}` : "0 / 0";
    els.prevButton.disabled = state.index <= 0 || controlsLocked;
    els.nextButton.disabled = state.index >= pool.length - 1 || controlsLocked;
    els.memoryPeekButton.classList.toggle("hidden", !memoryPreview);
    els.memoryPeekButton.disabled = controlsLocked;

    if (!question) {
      els.questionTitle.textContent = "这里暂时没有题目";
      els.questionType.textContent = "空";
      els.questionStem.textContent = "换一个章节、题型或练习模式试试。";
      els.options.innerHTML = "";
      els.fillArea.classList.add("hidden");
      els.memoryAnswerPreview.classList.add("hidden");
      els.explanationBox.classList.add("hidden");
      els.memoryStage.classList.add("hidden");
      setFeedbackState(null);
      return;
    }

    if (memoryPreview) {
      markMemoryPreviewSeen(question);
    }

    const activeTopic = state.topicQuestionIds && state.activeTopicId ? findTopic(state.activeTopicId) : null;
    els.currentScope.textContent = activeTopic
      ? `考点练习 · ${activeTopic.topic.title} · ${pool.length}题`
      : `${state.chapter} · ${TYPE_LABELS[state.type]} · ${modeLabel()}`;
    els.questionTitle.textContent = `${question.chapter} 第 ${question.number} 题`;
    els.questionType.textContent = TYPE_LABELS[question.type] || question.type;
    els.questionStem.textContent = question.stem;
    els.bookmarkButton.classList.toggle("active", state.bookmarked.has(question.id));
    els.bookmarkButton.textContent = state.bookmarked.has(question.id) ? "已收藏" : "收藏";
    els.bookmarkButton.disabled = controlsLocked;
    els.shuffleButton.disabled = controlsLocked;

    if (memoryMode) {
      els.memoryStage.classList.remove("hidden");
      els.memoryStage.textContent = memoryPreview ? "先看答案记忆" : "现在遮住答案自测";
      els.memoryStage.classList.toggle("recall", !memoryPreview);
    } else {
      els.memoryStage.classList.add("hidden");
      els.memoryStage.classList.remove("recall");
    }

    const options = question.type === "judge" && question.options.length === 0
      ? [
          { key: "A", text: "正确" },
          { key: "B", text: "错误" },
        ]
      : question.options;

    els.options.innerHTML = options
      .map((option) => {
        const selected = state.selected.has(option.key);
        const correctKey = expectedAnswer(question).includes(option.key);
        const previewCorrect = memoryPreview && correctKey;
        const wrongSelected = state.submitted && selected && !correctKey;
        const correct = (state.submitted && correctKey) || previewCorrect;
        const previewLocked = memoryPreview ? "preview-locked" : "";
        const previewClass = previewCorrect ? "preview-correct" : "";
        return `<button class="option ${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrongSelected ? "wrong" : ""} ${previewClass} ${previewLocked}" data-option="${option.key}" type="button">
          <span class="option-key">${option.key}</span>
          <span class="option-text">${option.text}</span>
        </button>`;
      })
      .join("");

    const showingFillRecall = question.type === "fill" && (!memoryMode || !memoryPreview);
    els.fillArea.classList.toggle("hidden", !showingFillRecall);
    els.options.classList.toggle("hidden", question.type === "fill");
    els.memoryAnswerPreview.classList.toggle("hidden", !(question.type === "fill" && memoryPreview));
    if (question.type === "fill" && memoryPreview) {
      els.memoryAnswerPreview.innerHTML = `<strong>标准答案</strong><span>${question.answer || "暂无标准答案"}</span>`;
    } else {
      els.memoryAnswerPreview.innerHTML = "";
    }

    if (memoryMode) {
      els.submitButton.textContent = state.autoAdvancePending
        ? "即将进入下一题"
        : memoryPreview
          ? "记住了"
          : "提交自测";
    } else {
      els.submitButton.textContent = state.autoAdvancePending ? "即将进入下一题" : state.submitted ? "重新提交" : "提交答案";
    }
    els.submitButton.disabled = state.autoAdvancePending;

    if (state.feedbackState) {
      setFeedbackState(state.feedbackState);
    } else {
      setFeedbackState(null);
    }

    if (memoryPreview) {
      renderPreviewExplanation(question);
      return;
    }

    if (state.submitted) {
      renderSubmittedExplanation(question);
    } else {
      els.explanationBox.classList.add("hidden");
    }

    if (entry && state.submitted && state.lastCorrect) {
      entry.phase = "recall";
    }
  }

  function modeLabel() {
    if (state.mode === "memory") return "记忆模式";
    if (state.mode === "wrong") return "错题复习";
    if (state.mode === "bookmarked") return "收藏题";
    return "章节练习";
  }

  function renderStats() {
    if (state.mode === "memory") {
      const pool = currentPool();
      const uniqueIds = [...new Set(pool.map((question) => question.id))];
      const records = uniqueIds.map((id) => memoryRecordFor(id));
      const previewed = records.filter((record) => record.previewed).length;
      const tested = records.filter((record) => record.attempts > 0).length;
      const mastered = records.filter((record) => record.passed).length;
      const pendingRepeat = records.filter((record) => record.pendingRepeat).length;
      els.totalLabel.textContent = "记忆卡";
      els.doneLabel.textContent = "已看";
      els.accuracyLabel.textContent = "掌握率";
      els.wrongLabel.textContent = "待回流";
      els.doneCount.textContent = String(previewed);
      els.accuracy.textContent = tested ? `${Math.round((mastered / tested) * 100)}%` : "0%";
      els.wrongCount.textContent = String(pendingRepeat);
      return;
    }

    const records = Object.values(state.records);
    const done = records.length;
    const correct = records.filter((record) => record.correct).length;
    els.totalLabel.textContent = "题目";
    els.doneLabel.textContent = "已练";
    els.accuracyLabel.textContent = "正确率";
    els.wrongLabel.textContent = "错题";
    els.doneCount.textContent = String(done);
    els.accuracy.textContent = done ? `${Math.round((correct / done) * 100)}%` : "0%";
    els.wrongCount.textContent = String(state.wrong.size);
  }

  function renderAnswerSheet() {
    const pool = currentPool();
    els.answerSheet.innerHTML = pool
      .map((question, index) => {
        const classes = ["sheet-item"];
        if (index === state.index) classes.push("current");

        if (state.mode === "memory") {
          const entry = state.memoryQueue[index];
          const record = memoryRecordFor(question.id);
          if (record.passed) classes.push("memory-mastered");
          else if (record.pendingRepeat && entry?.repeated) classes.push("memory-repeat");
          else if (entry?.phase === "recall") classes.push("memory-recall");
          else if (record.previewed) classes.push("memory-preview");
        } else {
          const record = state.records[question.id];
          if (record) classes.push("done");
          if (record && !record.correct) classes.push("wrong");
        }

        return `<button class="${classes.join(" ")}" data-index="${index}" type="button">${index + 1}</button>`;
      })
      .join("");
  }

  function renderModes() {
    document.querySelectorAll(".mode").forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === state.mode);
    });
  }

  function getKnowledgeChapter(chapterName) {
    return state.knowledgeMap?.chapters.find((chapter) => chapter.chapter === chapterName) || null;
  }

  function findTopic(topicId) {
    if (!state.knowledgeMap) return null;
    for (const chapter of state.knowledgeMap.chapters) {
      for (const section of chapter.sections) {
        for (const topic of section.topics) {
          if (topic.id === topicId) return { chapter, section, topic };
        }
      }
    }
    return null;
  }

  function typeSummary(typeCounts = {}) {
    const parts = [];
    if (typeCounts.single) parts.push(`单选 ${typeCounts.single}`);
    if (typeCounts.multiple) parts.push(`多选 ${typeCounts.multiple}`);
    if (typeCounts.fill) parts.push(`填空 ${typeCounts.fill}`);
    if (typeCounts.judge) parts.push(`判断 ${typeCounts.judge}`);
    return parts.join(" · ") || "主线节点";
  }

  function renderKnowledge() {
    if (!state.knowledgeMap) return;
    if (!state.activeKnowledgeChapter) {
      state.activeKnowledgeChapter = state.knowledgeMap.chapters[0]?.chapter || "导言";
    }
    const chapter = getKnowledgeChapter(state.activeKnowledgeChapter) || state.knowledgeMap.chapters[0];
    if (!state.activeTopicId) {
      state.activeTopicId = chapter.sections[0]?.topics[0]?.id || null;
    }
    const activeTopic = findTopic(state.activeTopicId) || {
      chapter,
      section: chapter.sections[0],
      topic: chapter.sections[0]?.topics[0],
    };

    els.mapFlow.innerHTML = state.knowledgeMap.chapters
      .map((item, index) => {
        const node = `<button class="flow-node ${item.chapter === chapter.chapter ? "active" : ""}" data-knowledge-chapter="${item.chapter}" type="button">
          <span class="flow-chapter">${item.chapter}</span>
          <span class="flow-title">${item.title}</span>
          <small>${item.questionCount}题</small>
        </button>`;
        const arrow = index < state.knowledgeMap.chapters.length - 1 ? '<div class="flow-arrow">→</div>' : "";
        return node + arrow;
      })
      .join("");

    els.topicList.innerHTML = chapter.sections
      .map(
        (section) => `<section class="section-block">
          <h3>${section.title}</h3>
          <div class="topic-grid">
            ${section.topics
              .map(
                (topic) => `<button class="topic-card ${topic.id === state.activeTopicId ? "active" : ""}" data-topic="${topic.id}" type="button">
                  <strong>${topic.title}</strong>
                  <span>${topic.must}</span><br>
                  <span>${topic.questionCount} 题 · ${typeSummary(topic.typeCounts)}</span>
                </button>`,
              )
              .join("")}
          </div>
        </section>`,
      )
      .join("");

    if (!activeTopic?.topic) {
      els.topicDetail.innerHTML = "<h3>暂无考点</h3>";
      return;
    }
    const { topic, section } = activeTopic;
    const sampleQuestions = topic.questionIds
      .map((id) => state.questionMap.get(id))
      .filter(Boolean)
      .slice(0, 10);
    els.topicDetail.innerHTML = `
      <div class="detail-meta">${chapter.chapter} · ${section.title}</div>
      <h3>${topic.title}</h3>
      <p>${topic.core}</p>
      <div class="detail-box"><strong>必背句</strong><p>${topic.must}</p></div>
      <div class="detail-box"><strong>易错辨析</strong><p>${topic.pitfall}</p></div>
      <div class="keyword-row">关键词：${topic.keywords.join("、")}</div>
      <button class="primary study-topic-button" data-study-topic="${topic.id}" type="button">练这个考点的 ${topic.questionCount} 道题</button>
      <div class="question-link-list">
        ${sampleQuestions
          .map(
            (question) => `<button class="question-link" data-question-id="${question.id}" type="button">
              ${question.chapter} 第${question.number}题 · ${TYPE_LABELS[question.type] || question.type}<br>${question.stem.slice(0, 58)}${question.stem.length > 58 ? "..." : ""}
            </button>`,
          )
          .join("")}
      </div>
    `;
  }

  function renderView() {
    const isKnowledge = state.view === "knowledge";
    els.quizView.classList.toggle("hidden", isKnowledge);
    els.knowledgeView.classList.toggle("hidden", !isKnowledge);
    els.viewButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.view === state.view);
    });
    if (isKnowledge) renderKnowledge();
  }

  function render() {
    if (!state.data) return;
    renderView();
    renderChapterList();
    renderTypeFilter();
    renderQuestion();
    renderStats();
    renderAnswerSheet();
    renderModes();
    renderSyncPanel();
  }

  function bindEvents() {
    els.chapterList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-chapter]");
      if (button) setFilters({ chapter: button.dataset.chapter });
    });
    els.viewButtons.forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });
    els.backToQuizButton.addEventListener("click", () => setView("quiz"));
    els.mapFlow.addEventListener("click", (event) => {
      const button = event.target.closest("[data-knowledge-chapter]");
      if (button) setKnowledgeChapter(button.dataset.knowledgeChapter);
    });
    els.topicList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-topic]");
      if (button) setActiveTopic(button.dataset.topic);
    });
    els.topicDetail.addEventListener("click", (event) => {
      const studyButton = event.target.closest("[data-study-topic]");
      if (studyButton) {
        studyTopic(studyButton.dataset.studyTopic);
        return;
      }
      const questionButton = event.target.closest("[data-question-id]");
      if (questionButton) {
        const topic = findTopic(state.activeTopicId);
        if (topic) {
          state.topicQuestionIds = topic.topic.questionIds;
          const nextIndex = topic.topic.questionIds.indexOf(questionButton.dataset.questionId);
          state.chapter = "全部";
          state.type = "all";
          state.mode = "all";
          state.index = nextIndex >= 0 ? nextIndex : 0;
          resetInteraction();
          setView("quiz");
          saveState();
        }
      }
    });
    els.typeFilter.addEventListener("click", (event) => {
      const button = event.target.closest("[data-type]");
      if (button) setFilters({ type: button.dataset.type });
    });
    els.options.addEventListener("click", (event) => {
      const button = event.target.closest("[data-option]");
      if (button) toggleOption(button.dataset.option);
    });
    els.prevButton.addEventListener("click", () => setIndex(state.index - 1));
    els.nextButton.addEventListener("click", () => setIndex(state.index + 1));
    els.submitButton.addEventListener("click", submit);
    els.memoryPeekButton.addEventListener("click", peekMemoryPreview);
    els.bookmarkButton.addEventListener("click", toggleBookmark);
    els.shuffleButton.addEventListener("click", shufflePool);
    els.fillInput.addEventListener("input", () => {
      state.fillValue = els.fillInput.value;
    });
    els.answerSheet.addEventListener("click", (event) => {
      const button = event.target.closest("[data-index]");
      if (button) setIndex(Number(button.dataset.index));
    });
    document.querySelectorAll(".mode").forEach((button) => {
      button.addEventListener("click", () => setFilters({ mode: button.dataset.mode }));
    });
    if (els.syncGroupInput) {
      els.syncGroupInput.addEventListener("input", () => {
        state.sync.groupCode = els.syncGroupInput.value.trim().toUpperCase();
        saveSyncState();
        renderSyncPanel();
      });
    }
    if (els.syncDeviceInput) {
      els.syncDeviceInput.addEventListener("input", () => {
        state.sync.deviceName = els.syncDeviceInput.value.trim() || createDefaultDeviceName();
        saveSyncState();
        renderSyncPanel();
      });
    }
    document.addEventListener("click", async (event) => {
      const button = event.target.closest("#syncCreateButton, #syncJoinButton, #syncNowButton");
      if (!button) return;
      event.preventDefault();
      try {
        if (button.id === "syncCreateButton") {
          await createCloudGroup();
        } else if (button.id === "syncJoinButton") {
          await joinCloudGroup();
        } else if (button.id === "syncNowButton") {
          await syncNow();
        }
      } catch (error) {
        if (button.id === "syncCreateButton") {
          touchSyncStatus("创建失败", error?.message || "请检查网络后重试");
        } else if (button.id === "syncJoinButton") {
          touchSyncStatus("加入失败", error?.message || "请检查同步码后重试");
        } else {
          touchSyncStatus("同步失败", error?.message || "请检查网络后重试");
        }
      }
    });
    els.resetButton.addEventListener("click", () => {
      if (!confirm("确定清空本浏览器中的答题记录、错题、收藏和记忆进度吗？")) return;
      state.records = {};
      state.wrong = new Set();
      state.bookmarked = new Set();
      state.bookmarkedMeta = {};
      state.memoryRecords = {};
      state.memoryQueue = [];
      state.memoryScopeKey = "";
      state.sync.dirty = true;
      saveState();
      if (state.mode === "memory") rebuildMemoryQueue(false);
      resetInteraction();
      render();
    });
    window.addEventListener("online", () => {
      if (state.sync.groupCode) {
        touchSyncStatus("网络恢复，准备同步…");
        scheduleSyncSoon();
      }
    });
    window.addEventListener("visibilitychange", () => {
      if (!document.hidden && state.sync.groupCode && state.sync.dirty) {
        scheduleSyncSoon();
      }
    });
  }

  async function init() {
    setupInstallPrompt();
    registerServiceWorker();
    loadSavedState();
    loadSyncState();
    ensureSyncIdentity();
    saveSyncState();
    bindEvents();
    try {
      const loaded = await loadData();
      state.data = loaded.questionBank;
      state.questionMap = new Map(state.data.questions.map((question) => [question.id, question]));
      state.knowledgeMap = loaded.knowledgeMap;
      state.activeKnowledgeChapter = state.knowledgeMap?.chapters?.[0]?.chapter || "导言";
      state.activeTopicId = state.knowledgeMap?.chapters?.[0]?.sections?.[0]?.topics?.[0]?.id || null;
      if (window.location.hash === "#knowledge") {
        state.view = "knowledge";
      }
      render();
      if (state.sync.groupCode && configReady()) {
        scheduleSyncSoon();
      }
    } catch (error) {
      els.questionTitle.textContent = "题库加载失败";
      els.questionStem.textContent = "请确认 questions.json 或 questions-data.js 与网页文件在同一目录。";
      console.error(error);
    }
  }

  init();
})();
