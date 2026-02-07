const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "mathBuddyData";
const MAX_SHAPES = 20;
const MIN_SPEECH_CONFIDENCE = 0.25;

const state = {
  data: loadData(),
  session: null,
  timerId: null,
  timeLeft: 0,
  recognition: null,
  speechSupported: false,
  audioCtx: null,
  currentAnswer: "",
  isIOS: false,
};

const elements = {
  currentUserLabel: $("currentUserLabel"),
  openProfileBtn: $("openProfileBtn"),
  profileDialog: $("profileDialog"),
  profileList: $("profileList"),
  profileName: $("profileName"),
  profileAge: $("profileAge"),
  profileGrade: $("profileGrade"),
  saveProfileBtn: $("saveProfileBtn"),
  closeProfileBtn: $("closeProfileBtn"),
  gradeSelect: $("gradeSelect"),
  modeSelect: $("modeSelect"),
  tablesOptions: $("tablesOptions"),
  beforeAfterOptions: $("beforeAfterOptions"),
  moreLessOptions: $("moreLessOptions"),
  addSubtractOptions: $("addSubtractOptions"),
  tablesList: $("tablesList"),
  tableMin: $("tableMin"),
  tableMax: $("tableMax"),
  beforeAfterMin: $("beforeAfterMin"),
  beforeAfterMax: $("beforeAfterMax"),
  beforeAfterType: $("beforeAfterType"),
  moreLessMin: $("moreLessMin"),
  moreLessMax: $("moreLessMax"),
  more10: $("more10"),
  less10: $("less10"),
  more100: $("more100"),
  less100: $("less100"),
  digitsSelect: $("digitsSelect"),
  noRegrouping: $("noRegrouping"),
  addMode: $("addMode"),
  subtractMode: $("subtractMode"),
  difficultySelect: $("difficultySelect"),
  questionCount: $("questionCount"),
  showShapes: $("showShapes"),
  startQuizBtn: $("startQuizBtn"),
  questionIndex: $("questionIndex"),
  questionTotal: $("questionTotal"),
  timerValue: $("timerValue"),
  questionText: $("questionText"),
  shapeHint: $("shapeHint"),
  answerDisplay: $("answerDisplay"),
  answerInput: $("answerInput"),
  submitAnswerBtn: $("submitAnswerBtn"),
  skipAnswerBtn: $("skipAnswerBtn"),
  listenBtn: $("listenBtn"),
  speechStatus: $("speechStatus"),
  feedback: $("feedback"),
  scoreSummary: $("scoreSummary"),
  historyList: $("historyList"),
  keyboardRow: $("keyboardRow"),
  keypad: $("keypad"),
  celebration: $("celebration"),
  listenCard: $("listenCard"),
  quitQuizBtn: $("quitQuizBtn"),
};

init();

function init() {
  buildTablesList();
  applyGradePreset(Number(elements.gradeSelect.value));
  updateModeOptions();
  renderProfileBar();
  renderHistory();
  state.isIOS = isIOSDevice();
  disableSpeech();

  elements.modeSelect.addEventListener("change", updateModeOptions);
  elements.gradeSelect.addEventListener("change", () =>
    applyGradePreset(Number(elements.gradeSelect.value))
  );
  elements.openProfileBtn.addEventListener("click", () =>
    elements.profileDialog.showModal()
  );
  elements.closeProfileBtn.addEventListener("click", () =>
    elements.profileDialog.close()
  );
  elements.saveProfileBtn.addEventListener("click", saveProfile);
  elements.startQuizBtn.addEventListener("click", startSession);
  elements.submitAnswerBtn.addEventListener("click", () => submitAnswer(false));
  elements.skipAnswerBtn.addEventListener("click", () => submitAnswer(true));
  elements.listenBtn.addEventListener("click", () => startListening());
  elements.keypad.addEventListener("click", handleKeypadClick);
  elements.quitQuizBtn.addEventListener("click", quitQuiz);
}

function buildTablesList() {
  const defaultTables = [2, 3, 4, 5, 10];
  for (let i = 2; i <= 12; i += 1) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = i;
    if (defaultTables.includes(i)) input.checked = true;
    label.appendChild(input);
    label.append(` Table ${i}`);
    elements.tablesList.appendChild(label);
  }
}

function updateModeOptions() {
  const mode = elements.modeSelect.value;
  elements.tablesOptions.style.display = mode === "tables" ? "grid" : "none";
  elements.beforeAfterOptions.style.display =
    mode === "beforeAfter" ? "grid" : "none";
  elements.moreLessOptions.style.display = mode === "moreLess" ? "grid" : "none";
  elements.addSubtractOptions.style.display =
    mode === "addSubtract" ? "grid" : "none";
}

function applyGradePreset(grade) {
  const presets = {
    1: {
      tables: [2, 5, 10],
      tableMax: 5,
      beforeAfterMax: 100,
      moreLessMax: 100,
      digits: 1,
      regroup: "yes",
      difficulty: "easy",
    },
    2: {
      tables: [2, 3, 4, 5, 10],
      tableMax: 10,
      beforeAfterMax: 200,
      moreLessMax: 200,
      digits: 2,
      regroup: "yes",
      difficulty: "medium",
    },
    3: {
      tables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      tableMax: 12,
      beforeAfterMax: 500,
      moreLessMax: 500,
      digits: 2,
      regroup: "no",
      difficulty: "medium",
    },
    4: {
      tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      tableMax: 12,
      beforeAfterMax: 1000,
      moreLessMax: 1000,
      digits: 2,
      regroup: "no",
      difficulty: "hard",
    },
    5: {
      tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      tableMax: 12,
      beforeAfterMax: 1000,
      moreLessMax: 1000,
      digits: 2,
      regroup: "no",
      difficulty: "hard",
    },
  };

  const preset = presets[grade];
  elements.tableMax.value = preset.tableMax;
  elements.beforeAfterMax.value = preset.beforeAfterMax;
  elements.moreLessMax.value = preset.moreLessMax;
  elements.digitsSelect.value = String(preset.digits);
  elements.noRegrouping.value = preset.regroup;
  elements.difficultySelect.value = preset.difficulty;

  Array.from(elements.tablesList.querySelectorAll("input")).forEach((input) => {
    input.checked = preset.tables.includes(Number(input.value));
  });
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { users: [], currentUserId: null };
    }
    return JSON.parse(stored);
  } catch (error) {
    return { users: [], currentUserId: null };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function getCurrentUser() {
  if (!state.data.currentUserId) return null;
  return state.data.users.find((u) => u.id === state.data.currentUserId) || null;
}

function renderProfileBar() {
  const user = getCurrentUser();
  elements.currentUserLabel.textContent = user
    ? `${user.name} (Grade ${user.grade})`
    : "No profile";
  renderProfileList();
}

function renderProfileList() {
  elements.profileList.innerHTML = "";
  if (!state.data.users.length) {
    elements.profileList.textContent = "No profiles yet.";
    return;
  }

  state.data.users.forEach((user) => {
    const card = document.createElement("div");
    card.className = "profile-card";
    const label = document.createElement("span");
    label.textContent = `${user.name} — Age ${user.age}, Grade ${user.grade}`;
    const selectBtn = document.createElement("button");
    selectBtn.className = "secondary";
    selectBtn.textContent = "Use";
    selectBtn.addEventListener("click", () => {
      state.data.currentUserId = user.id;
      saveData();
      renderProfileBar();
      renderHistory();
      elements.profileDialog.close();
    });
    card.appendChild(label);
    card.appendChild(selectBtn);
    elements.profileList.appendChild(card);
  });
}

function saveProfile() {
  const name = elements.profileName.value.trim();
  const age = Number(elements.profileAge.value);
  const grade = Number(elements.profileGrade.value);

  if (!name || !age || !grade) return;

  const newProfile = {
    id: `user-${Date.now()}`,
    name,
    age,
    grade,
    history: [],
  };
  state.data.users.push(newProfile);
  state.data.currentUserId = newProfile.id;
  saveData();
  elements.profileName.value = "";
  elements.profileAge.value = "";
  renderProfileBar();
  renderHistory();
  elements.profileDialog.close();
}

function getSettings() {
  const mode = elements.modeSelect.value;
  const tables = Array.from(elements.tablesList.querySelectorAll("input"))
    .filter((input) => input.checked)
    .map((input) => Number(input.value));

  return {
    grade: Number(elements.gradeSelect.value),
    mode,
    tables: tables.length ? tables : [2, 3, 4, 5, 10],
    tableMin: clamp(Number(elements.tableMin.value) || 1, 1, 12),
    tableMax: clamp(Number(elements.tableMax.value) || 10, 1, 12),
    beforeAfterMin: clamp(Number(elements.beforeAfterMin.value) || 1, 1, 1000),
    beforeAfterMax: clamp(Number(elements.beforeAfterMax.value) || 200, 1, 1000),
    beforeAfterType: elements.beforeAfterType.value,
    moreLessMin: clamp(Number(elements.moreLessMin.value) || 1, 1, 1000),
    moreLessMax: clamp(Number(elements.moreLessMax.value) || 300, 1, 1000),
    offsets: {
      more10: elements.more10.checked,
      less10: elements.less10.checked,
      more100: elements.more100.checked,
      less100: elements.less100.checked,
    },
    digits: Number(elements.digitsSelect.value),
    noRegrouping: elements.noRegrouping.value === "yes",
    allowAdd: elements.addMode.checked,
    allowSubtract: elements.subtractMode.checked,
    difficulty: elements.difficultySelect.value,
    questionCount: clamp(Number(elements.questionCount.value) || 10, 10, 20),
    showShapes: elements.showShapes.checked,
  };
}

function startSession() {
  const user = getCurrentUser();
  if (!user) {
    elements.profileDialog.showModal();
    return;
  }

  const settings = getSettings();
  const total = settings.questionCount;
  state.session = {
    settings,
    total,
    index: 0,
    correct: 0,
    questions: [],
  };
  setQuizMode(true);
  primeAudio();
  elements.questionTotal.textContent = total;
  elements.scoreSummary.textContent = `0 / ${total} correct`;
  nextQuestion();
}

function nextQuestion() {
  if (!state.session) return;
  if (state.session.index >= state.session.total) {
    finishSession();
    return;
  }

  const question = generateQuestion(state.session.settings);
  state.session.currentQuestion = question;
  state.session.index += 1;
  elements.questionIndex.textContent = state.session.index;
  elements.questionText.textContent = question.text;
  state.currentAnswer = "";
  updateAnswerDisplay();
  elements.answerInput.value = "";
  elements.feedback.textContent = "";
  elements.feedback.className = "feedback";
  renderShapes(question);
  startTimer(getTimeLimit(state.session.settings.difficulty));
  startListening();
  speakQuestion(question.text);
}

function submitAnswer(skip) {
  if (!state.session) return;
  stopListening();
  stopTimer();
  stopSpeak();

  const question = state.session.currentQuestion;
  const answerValue = skip ? null : Number(elements.answerInput.value);
  const isCorrect = !skip && Number.isFinite(answerValue) && answerValue === question.answer;

  if (isCorrect) {
    state.session.correct += 1;
    elements.feedback.textContent = "Correct!";
    elements.feedback.className = "feedback correct";
    playSound("correct");
    showCelebration("correct");
  } else {
    elements.feedback.textContent = `Wrong. Answer: ${question.answer}`;
    elements.feedback.className = "feedback wrong";
    playSound("wrong");
    showCelebration("wrong");
  }

  state.session.questions.push({
    text: question.text,
    answer: question.answer,
    userAnswer: skip ? "skipped" : answerValue,
    correct: isCorrect,
  });

  elements.scoreSummary.textContent = `${state.session.correct} / ${state.session.total} correct`;
  setTimeout(nextQuestion, 700);
}

function finishSession() {
  stopTimer();
  stopListening();
  stopSpeak();
  const user = getCurrentUser();
  if (!user || !state.session) return;

  const sessionSummary = {
    date: new Date().toLocaleString(),
    mode: state.session.settings.mode,
    score: state.session.correct,
    total: state.session.total,
    difficulty: state.session.settings.difficulty,
  };
  user.history.unshift(sessionSummary);
  saveData();
  renderHistory();
  elements.questionText.textContent = "Session complete!";
  elements.shapeHint.innerHTML = "";
  state.session = null;
  setQuizMode(false);
}

function quitQuiz() {
  if (!state.session) return;
  stopTimer();
  stopListening();
  stopSpeak();
  state.session = null;
  elements.questionText.textContent = "Quiz stopped.";
  elements.shapeHint.innerHTML = "";
  elements.feedback.textContent = "";
  elements.scoreSummary.textContent = "No active session.";
  setQuizMode(false);
}

function renderHistory() {
  const user = getCurrentUser();
  elements.historyList.innerHTML = "";
  if (!user || !user.history.length) {
    elements.historyList.textContent = "No scores yet.";
    return;
  }
  user.history.slice(0, 10).forEach((entry) => {
    const card = document.createElement("div");
    card.className = "history-item";
    card.textContent = `${entry.date} — ${entry.mode} — ${entry.score}/${entry.total} (${entry.difficulty})`;
    elements.historyList.appendChild(card);
  });
}

function getTimeLimit(difficulty) {
  if (difficulty === "easy") return 30;
  if (difficulty === "hard") return 10;
  return 20;
}

function startTimer(seconds) {
  stopTimer();
  state.timeLeft = seconds;
  elements.timerValue.textContent = state.timeLeft;
  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    elements.timerValue.textContent = state.timeLeft;
    if (state.timeLeft <= 0) {
      submitAnswer(true);
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function renderShapes(question) {
  elements.shapeHint.innerHTML = "";
  if (!state.session?.settings.showShapes) return;
  if (!question.shapes || question.shapes.length > MAX_SHAPES) return;

  question.shapes.forEach(() => {
    const dot = document.createElement("div");
    dot.className = "dot";
    elements.shapeHint.appendChild(dot);
  });
}

function generateQuestion(settings) {
  if (settings.mode === "mixed") {
    const mix = buildMixedModes(settings.grade);
    const selected = mix[Math.floor(Math.random() * mix.length)];
    return generateQuestion({ ...settings, mode: selected });
  }

  if (settings.mode === "tables") return generateTableQuestion(settings);
  if (settings.mode === "beforeAfter") return generateBeforeAfterQuestion(settings);
  if (settings.mode === "moreLess") return generateMoreLessQuestion(settings);
  return generateAddSubtractQuestion(settings);
}

function buildMixedModes(grade) {
  if (grade <= 1) return ["tables", "beforeAfter", "addSubtract"];
  if (grade === 2) return ["tables", "beforeAfter", "addSubtract"];
  if (grade === 3) return ["tables", "beforeAfter", "addSubtract", "moreLess"];
  return ["tables", "beforeAfter", "addSubtract", "moreLess"];
}

function generateTableQuestion(settings) {
  const table = sample(settings.tables);
  const min = Math.min(settings.tableMin, settings.tableMax);
  const max = Math.max(settings.tableMin, settings.tableMax);
  const multiplier = randInt(min, max);
  return {
    text: `${table} × ${multiplier}`,
    answer: table * multiplier,
  };
}

function generateBeforeAfterQuestion(settings) {
  const min = Math.min(settings.beforeAfterMin, settings.beforeAfterMax);
  const max = Math.max(settings.beforeAfterMin, settings.beforeAfterMax);
  const type = settings.beforeAfterType;
  const actualType =
    type === "both" ? sample(["before", "after"]) : type;

  let value = randInt(min, max);
  if (actualType === "before" && value <= min) value = min + 1;
  if (actualType === "after" && value >= max) value = max - 1;

  return {
    text:
      actualType === "before"
        ? `What comes before ${value}?`
        : `What comes after ${value}?`,
    answer: actualType === "before" ? value - 1 : value + 1,
  };
}

function generateMoreLessQuestion(settings) {
  const min = Math.min(settings.moreLessMin, settings.moreLessMax);
  const max = Math.max(settings.moreLessMin, settings.moreLessMax);
  const options = [];
  if (settings.offsets.more10) options.push({ label: "10 more", delta: 10 });
  if (settings.offsets.less10) options.push({ label: "10 less", delta: -10 });
  if (settings.offsets.more100) options.push({ label: "100 more", delta: 100 });
  if (settings.offsets.less100) options.push({ label: "100 less", delta: -100 });
  const choice = options.length ? sample(options) : { label: "10 more", delta: 10 };
  let value = randInt(min, max);

  if (choice.delta < 0 && value + choice.delta < min) value = min - choice.delta;
  if (choice.delta > 0 && value + choice.delta > max) value = max - choice.delta;

  return {
    text: `${choice.label} than ${value}`,
    answer: value + choice.delta,
  };
}

function generateAddSubtractQuestion(settings) {
  const ops = [];
  if (settings.allowAdd) ops.push("+");
  if (settings.allowSubtract) ops.push("-");
  const op = ops.length ? sample(ops) : "+";

  if (settings.noRegrouping && settings.digits === 2) {
    if (op === "+") {
      const a = randInt(10, 99);
      const b = randInt(10, 99);
      const aT = Math.floor(a / 10);
      const aO = a % 10;
      const bT = Math.floor(b / 10);
      const bO = b % 10;
      if (aT + bT >= 10 || aO + bO >= 10) {
        return generateAddSubtractQuestion(settings);
      }
      return {
        text: `${a} + ${b}`,
        answer: a + b,
        shapes: a + b <= MAX_SHAPES ? Array(a + b).fill(1) : null,
      };
    }

    const a = randInt(10, 99);
    const b = randInt(10, 99);
    const aT = Math.floor(a / 10);
    const aO = a % 10;
    const bT = Math.floor(b / 10);
    const bO = b % 10;
    if (b > a || bT > aT || bO > aO) {
      return generateAddSubtractQuestion(settings);
    }
    return {
      text: `${a} - ${b}`,
      answer: a - b,
      shapes: a <= MAX_SHAPES ? Array(a).fill(1) : null,
    };
  }

  const max = settings.digits === 1 ? 9 : 99;
  const min = settings.digits === 1 ? 0 : 10;
  let a = randInt(min, max);
  let b = randInt(min, max);
  if (op === "-" && b > a) {
    [a, b] = [b, a];
  }
  return {
    text: `${a} ${op} ${b}`,
    answer: op === "+" ? a + b : a - b,
    shapes: op === "+" && a + b <= MAX_SHAPES ? Array(a + b).fill(1) : null,
  };
}

function setupSpeech() {
  if (state.isIOS) {
    elements.speechStatus.textContent =
      "Voice not supported on iPhone. Use tap keypad.";
    elements.listenBtn.disabled = true;
    setKeyboardMode(true);
    return;
  }
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    elements.speechStatus.textContent = "Speech not supported. Use keyboard.";
    elements.listenBtn.disabled = true;
    setKeyboardMode(true);
    return;
  }
  state.speechSupported = true;
  setKeyboardMode(false);
  state.recognition = new SpeechRecognition();
  state.recognition.lang = "en-US";
  state.recognition.interimResults = true;
  state.recognition.maxAlternatives = 1;
  state.recognition.continuous = true;

  state.recognition.onresult = (event) => {
    if (!state.session) return;
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (!result.isFinal) continue;
      const spoken = result[0].transcript;
      const confidence = result[0].confidence ?? 1;
      const parsed = parseSpokenNumber(spoken);
      if (Number.isFinite(parsed) && confidence >= MIN_SPEECH_CONFIDENCE) {
        setAnswerValue(String(parsed));
        submitAnswer(false);
        return;
      }
    }
    elements.speechStatus.textContent = "Listening... try again";
  };

  state.recognition.onerror = () => {
    elements.speechStatus.textContent = "Speech error";
  };

  state.recognition.onend = () => {
    elements.speechStatus.textContent = "Speech ready";
    if (state.session) {
      startListening();
    }
  };
}

function disableSpeech() {
  state.speechSupported = false;
  state.recognition = null;
  elements.speechStatus.textContent =
    "Voice off. Use the keypad to answer.";
  elements.listenBtn.disabled = true;
  elements.listenCard.classList.add("hidden");
  setKeyboardMode(true);
}

function speakQuestion(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function stopSpeak() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

function startListening() {
  if (!state.speechSupported || !state.recognition) return;
  try {
    elements.speechStatus.textContent = "Listening...";
    state.recognition.start();
  } catch (error) {
    elements.speechStatus.textContent = "Speech busy";
  }
}

function setKeyboardMode(isVisible) {
  if (isVisible) {
    elements.keyboardRow.classList.remove("hidden");
    elements.skipAnswerBtn.classList.remove("hidden");
    elements.keypad.classList.remove("hidden");
  } else {
    elements.keyboardRow.classList.add("hidden");
    elements.skipAnswerBtn.classList.add("hidden");
    elements.keypad.classList.add("hidden");
  }
}

function stopListening() {
  if (!state.speechSupported || !state.recognition) return;
  try {
    state.recognition.stop();
  } catch (error) {
    // Safe to ignore when recognition is idle.
  }
}

function setQuizMode(active) {
  document.body.classList.toggle("quiz-active", active);
}

function primeAudio() {
  if (!state.audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) state.audioCtx = new AudioContext();
  }
  if (state.audioCtx && state.audioCtx.state === "suspended") {
    state.audioCtx.resume();
  }
}

function playSound(type) {
  if (!state.audioCtx) return;
  const ctx = state.audioCtx;
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  gain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = type === "correct" ? "triangle" : "sawtooth";
  osc.frequency.setValueAtTime(type === "correct" ? 700 : 220, now);
  osc.frequency.exponentialRampToValueAtTime(
    type === "correct" ? 900 : 180,
    now + 0.18
  );
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.4);
}

function showCelebration(type) {
  const container = elements.celebration;
  container.innerHTML = "";
  container.classList.remove("hidden");
  container.classList.add("active");

  const message = document.createElement("div");
  message.className = `message ${type === "correct" ? "correct-message" : "wrong-message"}`;
  message.textContent = type === "correct" ? "Great Job!" : "Try Again!";
  container.appendChild(message);

  const colors =
    type === "correct"
      ? ["#22c55e", "#f97316", "#facc15", "#38bdf8"]
      : ["#ef4444", "#f97316", "#f59e0b"];

  for (let i = 0; i < 16; i += 1) {
    const particle = document.createElement("div");
    particle.className = `particle ${i % 3 === 0 ? "star" : ""}`;
    particle.style.background = colors[i % colors.length];
    particle.style.left = `${40 + Math.random() * 20}%`;
    particle.style.top = `${50 + Math.random() * 10}%`;
    container.appendChild(particle);
  }

  setTimeout(() => {
    container.classList.remove("active");
    container.classList.add("hidden");
    container.innerHTML = "";
  }, 800);
}

function parseSpokenNumber(text) {
  const normalized = normalizeSpeech(text);
  const digits = normalized.replace(/[^\d-]/g, "");
  if (digits) return Number(digits);
  return wordsToNumber(normalized);
}

function normalizeSpeech(text) {
  return text
    .toLowerCase()
    .replace(/\bto\b/g, "two")
    .replace(/\btoo\b/g, "two")
    .replace(/\bfor\b/g, "four")
    .replace(/\bfore\b/g, "four")
    .replace(/\bate\b/g, "eight")
    .replace(/\bfree\b/g, "three")
    .replace(/\btree\b/g, "three");
}

function wordsToNumber(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const smallNumbers = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
  };
  const tensNumbers = {
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };

  let total = 0;
  let current = 0;

  words.forEach((word) => {
    if (word in smallNumbers) {
      current += smallNumbers[word];
    } else if (word in tensNumbers) {
      current += tensNumbers[word];
    } else if (word === "hundred") {
      current *= 100;
    } else if (word === "thousand") {
      total += current * 1000;
      current = 0;
    }
  });

  total += current;
  return Number.isFinite(total) ? total : null;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function handleKeypadClick(event) {
  const button = event.target.closest("button");
  if (!button) return;
  const value = button.dataset.value;
  const action = button.dataset.action;

  if (value) {
    if (state.currentAnswer.length >= 4) return;
    state.currentAnswer += value;
    setAnswerValue(state.currentAnswer);
    return;
  }

  if (action === "clear") {
    state.currentAnswer = "";
    setAnswerValue("");
  }

  if (action === "ok" && state.currentAnswer) {
    submitAnswer(false);
  }
}

function setAnswerValue(value) {
  elements.answerInput.value = value;
  state.currentAnswer = value;
  updateAnswerDisplay();
}

function updateAnswerDisplay() {
  elements.answerDisplay.textContent = state.currentAnswer
    ? `Your answer: ${state.currentAnswer}`
    : "Your answer: —";
}

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
