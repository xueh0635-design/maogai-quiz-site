(function () {
  const STORAGE_KEY = "maogai-quiz-state-v1";
  const AUTO_ADVANCE_DELAY = 800;
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
    options: document.querySelector("#options"),
    fillArea: document.querySelector("#fillArea"),
    fillInput: document.querySelector("#fillInput"),
    prevButton: document.querySelector("#prevButton"),
    nextButton: document.querySelector("#nextButton"),
    submitButton: document.querySelector("#submitButton"),
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
    answerSheet: document.querySelector("#answerSheet"),
    resetButton: document.querySelector("#resetButton"),
    installCard: document.querySelector("#installCard"),
    installButton: document.querySelector("#installButton"),
  };

  const state = {
    data: null,
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
    installPrompt: null,
    feedbackTimer: null,
    feedbackState: null,
    autoAdvancePending: false,
  };

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
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      state.records = saved.records || {};
      state.wrong = new Set(saved.wrong || []);
      state.bookmarked = new Set(saved.bookmarked || []);
    } catch {
      state.records = {};
      state.wrong = new Set();
      state.bookmarked = new Set();
    }
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        records: state.records,
        wrong: [...state.wrong],
        bookmarked: [...state.bookmarked],
      }),
    );
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

  function currentPool() {
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

  function resetInteraction() {
    clearFeedbackTimer();
    state.selected = new Set();
    state.fillValue = "";
    state.submitted = false;
    state.lastCorrect = false;
    state.feedbackState = null;
    els.fillInput.value = "";
    setFeedbackState(null);
  }

  function setIndex(index) {
    const pool = currentPool();
    state.index = Math.min(Math.max(index, 0), Math.max(pool.length - 1, 0));
    resetInteraction();
    render();
  }

  function setFilters(next = {}) {
    Object.assign(state, next);
    if (!Object.prototype.hasOwnProperty.call(next, "topicQuestionIds") && (next.chapter || next.type || next.mode)) {
      state.topicQuestionIds = null;
      state.activeTopicId = null;
    }
    state.index = 0;
    resetInteraction();
    render();
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
  }

  function shufflePool() {
    if (!state.data) return;
    const scoped = currentPool().map((question) => question.id);
    const rank = new Map(scoped.map((id, index) => [id, index + Math.random()]));
    state.data.questions.sort((a, b) => (rank.get(a.id) || 99999) - (rank.get(b.id) || 99999));
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

  function submit() {
    const question = currentQuestion();
    if (!question) return;
    if (state.autoAdvancePending) return;
    if (question.type === "fill") {
      state.fillValue = els.fillInput.value;
    }
    const correct = answerIsCorrect(question);
    state.submitted = true;
    state.lastCorrect = correct;
    state.records[question.id] = {
      correct,
      answer: userAnswer(question),
      at: new Date().toISOString(),
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
    if (state.bookmarked.has(question.id)) state.bookmarked.delete(question.id);
    else state.bookmarked.add(question.id);
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

  function renderQuestion() {
    const pool = currentPool();
    const question = currentQuestion();
    els.totalCount.textContent = String(pool.length);
    els.questionProgress.textContent = pool.length ? `${state.index + 1} / ${pool.length}` : "0 / 0";
    const controlsLocked = state.autoAdvancePending;
    els.prevButton.disabled = state.index <= 0 || controlsLocked;
    els.nextButton.disabled = state.index >= pool.length - 1 || controlsLocked;

    if (!question) {
      els.questionTitle.textContent = "这里暂时没有题目";
      els.questionType.textContent = "空";
      els.questionStem.textContent = "换一个章节、题型或练习模式试试。";
      els.options.innerHTML = "";
      els.fillArea.classList.add("hidden");
      els.explanationBox.classList.add("hidden");
      setFeedbackState(null);
      return;
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
        const wrongSelected = state.submitted && selected && !correctKey;
        const correct = state.submitted && correctKey;
        return `<button class="option ${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrongSelected ? "wrong" : ""}" data-option="${option.key}" type="button">
          <span class="option-key">${option.key}</span>
          <span class="option-text">${option.text}</span>
        </button>`;
      })
      .join("");

    els.fillArea.classList.toggle("hidden", question.type !== "fill");
    els.options.classList.toggle("hidden", question.type === "fill");
    els.submitButton.textContent = state.autoAdvancePending ? "即将进入下一题" : state.submitted ? "重新提交" : "提交答案";
    els.submitButton.disabled = state.autoAdvancePending;
    els.bookmarkButton.disabled = state.autoAdvancePending;
    els.shuffleButton.disabled = state.autoAdvancePending;
    if (state.feedbackState) {
      setFeedbackState(state.feedbackState);
    } else {
      setFeedbackState(null);
    }

    if (state.submitted) {
      els.explanationBox.classList.remove("hidden");
      els.resultLine.textContent = state.lastCorrect ? "回答正确" : "回答错误";
      els.resultLine.className = `result-line ${state.lastCorrect ? "ok" : "bad"}`;
      els.answerLine.textContent = `你的答案：${readableAnswer(question, userAnswer(question))} · 正确答案：${question.answer || "未识别"}`;
      els.explanationText.textContent = question.explanation || "暂无解析。";
    } else {
      els.explanationBox.classList.add("hidden");
    }
  }

  function modeLabel() {
    if (state.mode === "wrong") return "错题复习";
    if (state.mode === "bookmarked") return "收藏题";
    return "章节练习";
  }

  function renderStats() {
    const records = Object.values(state.records);
    const done = records.length;
    const correct = records.filter((record) => record.correct).length;
    els.doneCount.textContent = String(done);
    els.accuracy.textContent = done ? `${Math.round((correct / done) * 100)}%` : "0%";
    els.wrongCount.textContent = String(state.wrong.size);
  }

  function renderAnswerSheet() {
    const pool = currentPool();
    els.answerSheet.innerHTML = pool
      .map((question, index) => {
        const record = state.records[question.id];
        const className = [
          "sheet-item",
          index === state.index ? "current" : "",
          record ? "done" : "",
          record && !record.correct ? "wrong" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<button class="${className}" data-index="${index}" type="button">${index + 1}</button>`;
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
    const questionMap = new Map(state.data.questions.map((question) => [question.id, question]));
    const sampleQuestions = topic.questionIds
      .map((id) => questionMap.get(id))
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
    els.resetButton.addEventListener("click", () => {
      if (!confirm("确定清空本浏览器中的答题记录、错题和收藏吗？")) return;
      state.records = {};
      state.wrong = new Set();
      state.bookmarked = new Set();
      saveState();
      render();
    });
  }

  async function init() {
    setupInstallPrompt();
    registerServiceWorker();
    loadSavedState();
    bindEvents();
    try {
      const loaded = await loadData();
      state.data = loaded.questionBank;
      state.knowledgeMap = loaded.knowledgeMap;
      state.activeKnowledgeChapter = state.knowledgeMap?.chapters?.[0]?.chapter || "导言";
      state.activeTopicId = state.knowledgeMap?.chapters?.[0]?.sections?.[0]?.topics?.[0]?.id || null;
      if (window.location.hash === "#knowledge") {
        state.view = "knowledge";
      }
      render();
    } catch (error) {
      els.questionTitle.textContent = "题库加载失败";
      els.questionStem.textContent = "请确认 questions.json 或 questions-data.js 与网页文件在同一目录。";
      console.error(error);
    }
  }

  init();
})();
