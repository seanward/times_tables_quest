/* ============================================================
   Times Tables Quest — game logic
   A times-tables learning game with stars, badges and a shop.
   ============================================================ */

(() => {
  'use strict';

  /* ---------------- constants ---------------- */

  const MAX_TABLE = 12;
  const PRACTICE_QUESTIONS = 10;
  const LIGHTNING_SECONDS = 60;
  const PERFECT_BONUS_STARS = 5;
  const MASTERY_SCORE_THRESHOLD = 8;   // score needed in practice/type-it to earn a table star
  const MAX_MASTERY = 3;
  const SAVE_KEY = 'timesTablesQuest.save.v1';

  const PRAISE = [
    'Brilliant! 🌟', 'You got it! 🎉', 'Super smart! 🧠', 'Sparky is so proud! 🐉',
    'Amazing work! ✨', 'Yes! That is right! 💪', 'Wonderful! 🌈', 'Fantastic! 🎊'
  ];

  const ENCOURAGE = [
    'Good try! You will get the next one!', 'Almost! Keep going, you are learning!',
    'Nice try! Sparky believes in you!', 'Do not worry, mistakes help us learn!'
  ];

  const PROMPTS = [
    'Here comes a question…', 'Can you solve this one?', 'Sparky wants to know…',
    'Quick, what is the answer?', 'You can do this!', 'Think carefully…'
  ];

  const SHOP_ITEMS = [
    { id: 'chick',     emoji: '🐣', name: 'Baby Chick',     price: 15 },
    { id: 'butterfly', emoji: '🦋', name: 'Butterfly',      price: 20 },
    { id: 'turtle',    emoji: '🐢', name: 'Turtle',         price: 25 },
    { id: 'rainbow',   emoji: '🌈', name: 'Rainbow',        price: 30 },
    { id: 'kitten',    emoji: '🐱', name: 'Kitten',         price: 40 },
    { id: 'puppy',     emoji: '🐶', name: 'Puppy',          price: 40 },
    { id: 'cupcake',   emoji: '🧁', name: 'Cupcake',        price: 60 },
    { id: 'bow',       emoji: '🎀', name: 'Sparkly Bow',    price: 60 },
    { id: 'fox',       emoji: '🦊', name: 'Clever Fox',     price: 75 },
    { id: 'unicorn',   emoji: '🦄', name: 'Unicorn',        price: 90 },
    { id: 'crown',     emoji: '👑', name: 'Golden Crown',   price: 120 },
    { id: 'wand',      emoji: '🪄', name: 'Magic Wand',     price: 140 },
    { id: 'castle',    emoji: '🏰', name: 'Mini Castle',    price: 180 },
    { id: 'dragon',    emoji: '🐉', name: 'Dragon Friend',  price: 220 },
    { id: 'gem',       emoji: '💎', name: 'Giant Diamond',  price: 280 },
    { id: 'rocket',    emoji: '🚀', name: 'Star Rocket',    price: 340 },
    { id: 'goldstar',  emoji: '🌟', name: 'The Golden Star', price: 400 }
  ];

  // Sparky grows through these stages as the treasure collection gets bigger.
  const DRAGON_STAGES = [
    { treasures: 0,                 name: 'Little Sparky',   img: 'assets/mascot.png',        desc: 'Sparky is just starting out on the quest.' },
    { treasures: 3,                 name: 'Cosy Sparky',     img: 'assets/sparky_stage2.png', desc: '3 treasures earned Sparky a snuggly scarf!' },
    { treasures: 6,                 name: 'Explorer Sparky', img: 'assets/sparky_stage3.png', desc: '6 treasures turned Sparky into a real explorer!' },
    { treasures: 10,                name: 'Hero Sparky',     img: 'assets/sparky_stage4.png', desc: '10 treasures made Sparky a true hero!' },
    { treasures: 14,                name: 'Royal Sparky',    img: 'assets/sparky_stage5.png', desc: '14 treasures crowned Sparky royalty!' },
    { treasures: SHOP_ITEMS.length, name: 'Golden Sparky',   img: 'assets/sparky_stage6.png', desc: 'Every treasure collected — Sparky is legendary!' }
  ];

  const BADGES = [
    { id: 'first-steps',    emoji: '👟', name: 'First Steps',      desc: 'Finish your first Practice round',        test: p => p.counters.practiceRounds >= 1 },
    { id: 'perfect-10',     emoji: '💯', name: 'Perfect 10',       desc: 'Get 10 out of 10 in Practice',            test: p => p.counters.perfectRounds >= 1 },
    { id: 'hat-trick',      emoji: '🎩', name: 'Hat Trick',        desc: 'Get 3 perfect Practice rounds',           test: p => p.counters.perfectRounds >= 3 },
    { id: 'typing-first',   emoji: '⌨️', name: 'Keyboard Explorer', desc: 'Finish your first Type It round',         test: p => p.counters.typingRounds >= 1 },
    { id: 'typing-perfect', emoji: '🖥️', name: 'Typing Champion',  desc: 'Get 10 out of 10 in Type It',             test: p => p.counters.perfectTypingRounds >= 1 },
    { id: 'explorer',       emoji: '🗺️', name: 'Explorer',         desc: 'Play a Practice or Type It round on every times table', test: p => allTables().every(t => p.tableStats[t].rounds >= 1) },
    { id: 'lightning-kid',  emoji: '⚡', name: 'Lightning Kid',    desc: 'Score 15 or more in Lightning',           test: p => p.bestLightning >= 15 },
    { id: 'lightning-hero', emoji: '🌩️', name: 'Lightning Hero',   desc: 'Score 25 or more in Lightning',           test: p => p.bestLightning >= 25 },
    { id: 'star-collector', emoji: '✨', name: 'Star Collector',   desc: 'Earn 100 stars in total',                 test: p => p.starsEarned >= 100 },
    { id: 'star-champion',  emoji: '👑', name: 'Star Champion',    desc: 'Earn 500 stars in total',                 test: p => p.starsEarned >= 500 },
    { id: 'table-master',   emoji: '🏅', name: 'Table Master',     desc: 'Earn 3 stars on any times table',         test: p => allTables().some(t => p.tableStats[t].mastery >= MAX_MASTERY) },
    { id: 'grand-master',   emoji: '🏆', name: 'Grand Master',     desc: 'Earn 3 stars on every times table',       test: p => allTables().every(t => p.tableStats[t].mastery >= MAX_MASTERY) },
    { id: 'treasure-1',     emoji: '🗝️', name: 'Treasure Hunter',  desc: 'Buy your first treasure in the Star Shop', test: p => p.treasures.length >= 1 },
    { id: 'treasure-5',     emoji: '📦', name: 'Treasure Keeper',  desc: 'Collect 5 treasures',                     test: p => p.treasures.length >= 5 },
    { id: 'treasure-all',   emoji: '🐲', name: 'Treasure Dragon',  desc: 'Collect every treasure in the shop',      test: p => p.treasures.length >= SHOP_ITEMS.length }
  ];

  /* ---------------- helpers ---------------- */

  const $ = id => document.getElementById(id);

  function allTables() {
    const list = [];
    for (let t = 1; t <= MAX_TABLE; t++) list.push(t);
    return list;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /* ---------------- persistent state ---------------- */

  let save = loadSave();
  let player = null;

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.players)) {
          parsed.players.forEach(ensurePlayerShape);
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not load saved game:', err);
    }
    return { players: [], lastPlayerId: null, soundOn: true };
  }

  function persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (err) {
      console.warn('Could not save game:', err);
    }
  }

  function newPlayer(name) {
    const tableStats = {};
    allTables().forEach(t => {
      tableStats[t] = { rounds: 0, bestScore: 0, mastery: 0 };
    });
    return {
      id: 'p' + Date.now().toString(36) + randomInt(100, 999),
      name,
      stars: 0,          // spendable balance
      starsEarned: 0,    // lifetime total
      tableStats,
      factWrong: {},     // "7x8" -> number of times answered wrong
      bestLightning: 0,
      badges: [],
      treasures: [],
      counters: {
        practiceRounds: 0, perfectRounds: 0,
        typingRounds: 0, perfectTypingRounds: 0,
        totalCorrect: 0, totalAnswered: 0
      }
    };
  }

  // Coerce a value to a non-negative whole number, falling back when missing or invalid.
  function toCount(value, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return fallback;
    return Math.floor(num);
  }

  // Fill in missing fields and sanitise values for profiles loaded from storage or
  // imported from a save code (which is user-controlled text).
  function ensurePlayerShape(p) {
    if (typeof p.id !== 'string' || !p.id) p.id = 'p' + Date.now().toString(36) + randomInt(100, 999);
    if (typeof p.name !== 'string' || !p.name.trim()) p.name = 'Explorer';
    p.name = p.name.trim().slice(0, 16);

    p.stars = toCount(p.stars, 0);
    p.starsEarned = toCount(p.starsEarned, p.stars);
    p.bestLightning = toCount(p.bestLightning, 0);

    const counters = (p.counters && typeof p.counters === 'object') ? p.counters : {};
    p.counters = {
      practiceRounds: toCount(counters.practiceRounds, 0),
      perfectRounds: toCount(counters.perfectRounds, 0),
      typingRounds: toCount(counters.typingRounds, 0),
      perfectTypingRounds: toCount(counters.perfectTypingRounds, 0),
      totalCorrect: toCount(counters.totalCorrect, 0),
      totalAnswered: toCount(counters.totalAnswered, 0)
    };

    const factWrong = (p.factWrong && typeof p.factWrong === 'object') ? p.factWrong : {};
    p.factWrong = {};
    Object.keys(factWrong).forEach(key => {
      const count = toCount(factWrong[key], 0);
      const match = key.match(/^(\d+)x(\d+)$/);
      if (!match || count <= 0) return;
      const a = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      if (a >= 1 && a <= MAX_TABLE && b >= 1 && b <= MAX_TABLE) {
        p.factWrong[key] = count;
      }
    });

    p.treasures = Array.isArray(p.treasures)
      ? [...new Set(p.treasures.filter(id => SHOP_ITEMS.some(item => item.id === id)))]
      : [];
    p.badges = Array.isArray(p.badges)
      ? [...new Set(p.badges.filter(id => BADGES.some(badge => badge.id === id)))]
      : [];

    const tableStats = (p.tableStats && typeof p.tableStats === 'object') ? p.tableStats : {};
    p.tableStats = {};
    allTables().forEach(t => {
      const stats = (tableStats[t] && typeof tableStats[t] === 'object') ? tableStats[t] : {};
      p.tableStats[t] = {
        rounds: toCount(stats.rounds, 0),
        bestScore: Math.min(toCount(stats.bestScore, 0), PRACTICE_QUESTIONS),
        mastery: Math.min(toCount(stats.mastery, 0), MAX_MASTERY)
      };
    });

    return p;
  }

  /* ---------------- audio ---------------- */

  let audioCtx = null;

  function ensureAudio() {
    if (!save.soundOn) return null;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, startDelay, duration, type, volume) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + startDelay;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(volume || 0.16, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  const sfx = {
    click:   () => tone(620, 0, 0.07, 'sine', 0.07),
    correct: () => { tone(660, 0, 0.12); tone(880, 0.1, 0.18); },
    wrong:   () => tone(200, 0, 0.3, 'triangle', 0.1),
    star:    () => { tone(988, 0, 0.1, 'sine', 0.1); tone(1319, 0.09, 0.15, 'sine', 0.1); },
    tick:    () => tone(880, 0, 0.05, 'square', 0.04),
    fanfare: () => {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.22));
      tone(1319, 0.6, 0.4);
    },
    buy: () => {
      [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.09, 0.16));
    }
  };

  /* ---------------- speech ---------------- */

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.pitch = 1.1;
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.warn('Speech not available:', err);
    }
  }

  /* ---------------- screens & top bar ---------------- */

  const SCREENS = ['welcome', 'home', 'tables', 'learn', 'practice', 'typing', 'lightning', 'results', 'badges', 'shop', 'dragon'];

  function showScreen(name) {
    abortRunningRound(name);
    SCREENS.forEach(s => $('screen-' + s).classList.toggle('hidden', s !== name));
    $('topbar').classList.toggle('hidden', name === 'welcome');
    window.scrollTo(0, 0);
  }

  function currentScreen() {
    return SCREENS.find(s => !$('screen-' + s).classList.contains('hidden'));
  }

  function updateTopbar(pulse) {
    if (!player) return;
    $('star-count').textContent = player.stars;
    if (pulse) {
      const chip = $('star-chip');
      chip.classList.remove('pulse');
      void chip.offsetWidth; // restart animation
      chip.classList.add('pulse');
    }
  }

  function updateSoundIcon() {
    $('btn-sound').textContent = save.soundOn ? '🔊' : '🔇';
  }

  function showToast(text, ms) {
    const toast = $('toast');
    toast.textContent = text;
    toast.classList.remove('hidden');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.add('hidden'), ms || 2600);
  }

  /* ---------------- stars, mastery & badges ---------------- */

  function awardStars(amount, options) {
    if (!player || amount <= 0) return;
    player.stars += amount;
    player.starsEarned += amount;
    updateTopbar(true);
    if (!options || !options.silent) sfx.star();
  }

  function questStars() {
    return allTables().reduce((sum, t) => sum + player.tableStats[t].mastery, 0);
  }

  function questTotal() {
    return MAX_TABLE * MAX_MASTERY;
  }

  function checkBadges() {
    if (!player) return [];
    const earnedNow = [];
    BADGES.forEach(badge => {
      if (!player.badges.includes(badge.id) && badge.test(player)) {
        player.badges.push(badge.id);
        earnedNow.push(badge);
      }
    });
    return earnedNow;
  }

  function announceBadges(newBadges) {
    if (newBadges.length === 0) return;
    const first = newBadges[0];
    showToast(`New badge: ${first.emoji} ${first.name}!`);
  }

  function nextTreasureGoal() {
    const remaining = SHOP_ITEMS
      .filter(item => !player.treasures.includes(item.id))
      .sort((a, b) => a.price - b.price);
    if (remaining.length === 0) return null;
    return remaining[0];
  }

  function dragonStageIndex(p) {
    const owned = p.treasures.length;
    let index = 0;
    DRAGON_STAGES.forEach((stage, i) => {
      if (owned >= stage.treasures) index = i;
    });
    return index;
  }

  function dragonStage(p) {
    return DRAGON_STAGES[dragonStageIndex(p)];
  }

  /* ---------------- welcome screen ---------------- */

  function renderWelcome() {
    const wrap = $('returning-players');
    const buttons = $('player-buttons');
    buttons.innerHTML = '';
    $('import-code').value = '';
    $('import-feedback').textContent = '';
    $('import-feedback').className = 'transfer-feedback';
    if (save.players.length === 0) {
      wrap.classList.add('hidden');
    } else {
      wrap.classList.remove('hidden');
      save.players.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'player-pill';
        btn.textContent = `${p.name} ⭐${p.stars}`;
        btn.addEventListener('click', () => {
          sfx.click();
          selectPlayer(p.id);
        });
        buttons.appendChild(btn);
      });
    }
    $('player-name').value = '';
  }

  function selectPlayer(id) {
    player = save.players.find(p => p.id === id) || null;
    if (!player) return;
    ensurePlayerShape(player);
    save.lastPlayerId = id;
    persist();
    updateTopbar(false);
    renderHome();
    showScreen('home');
  }

  function startNewPlayer() {
    const input = $('player-name');
    const name = input.value.trim();
    if (!name) {
      input.classList.remove('wobble');
      void input.offsetWidth;
      input.classList.add('wobble');
      input.focus();
      return;
    }
    sfx.click();
    const existing = save.players.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      selectPlayer(existing.id);
      return;
    }
    const created = newPlayer(name);
    save.players.push(created);
    persist();
    selectPlayer(created.id);
  }

  /* ---------------- home screen ---------------- */

  function renderHome() {
    $('home-mascot').src = dragonStage(player).img;
    const greetings = [
      `Hi ${player.name}! Ready for an adventure?`,
      `Welcome back, ${player.name}! Sparky missed you!`,
      `Hello ${player.name}! Let's earn some stars!`,
      `${player.name}! The castle is waiting for you!`
    ];
    $('home-greeting').textContent = pick(greetings);

    const goal = nextTreasureGoal();
    const goalLine = $('home-goal');
    if (goal) {
      const needed = goal.price - player.stars;
      if (needed > 0) {
        goalLine.textContent = `Only ${needed} more ⭐ until you can get the ${goal.emoji} ${goal.name}!`;
      } else {
        goalLine.textContent = `You have enough stars for the ${goal.emoji} ${goal.name}! Visit the Star Shop!`;
      }
    } else {
      goalLine.textContent = 'You have collected every treasure! Incredible!';
    }

    const treasureRow = $('home-treasures');
    treasureRow.innerHTML = '';
    if (player.treasures.length === 0) {
      const span = document.createElement('span');
      span.className = 'placeholder';
      span.textContent = 'Earn stars and visit the Star Shop to collect treasures — they will appear here!';
      treasureRow.appendChild(span);
    } else {
      player.treasures.forEach(id => {
        const item = SHOP_ITEMS.find(s => s.id === id);
        if (item) {
          const span = document.createElement('span');
          span.textContent = item.emoji;
          span.title = item.name;
          treasureRow.appendChild(span);
        }
      });
    }
  }

  /* ---------------- table picker ---------------- */

  let pendingMode = 'practice';

  function openTablePicker(mode) {
    pendingMode = mode;
    const titles = {
      learn: 'Which table shall we learn?',
      practice: 'Which table shall we practice?',
      typing: 'Pick a table to type!',
      lightning: 'Pick a table for Lightning!'
    };
    $('tables-title').textContent = titles[mode] || 'Choose a times table';
    renderTableGrid(mode);
    showScreen('tables');
  }

  function suggestedTable() {
    // The lowest table that is not yet fully mastered, preferring ones already started.
    const started = allTables().filter(t => player.tableStats[t].rounds > 0 && player.tableStats[t].mastery < MAX_MASTERY);
    if (started.length > 0) return started[0];
    const fresh = allTables().filter(t => player.tableStats[t].mastery < MAX_MASTERY);
    return fresh.length > 0 ? fresh[0] : null;
  }

  function renderTableGrid(mode) {
    const grid = $('table-grid');
    grid.innerHTML = '';

    const earned = questStars();
    $('tables-progress').textContent = `Quest to the castle: ⭐ ${earned} of ${questTotal()} table stars earned`;
    $('tables-progress-bar').style.width = `${(earned / questTotal()) * 100}%`;

    const suggestion = suggestedTable();

    allTables().forEach(t => {
      const stats = player.tableStats[t];
      const tile = document.createElement('button');
      tile.className = 'table-tile';
      if (mode !== 'learn' && t === suggestion) tile.classList.add('suggested');

      const num = document.createElement('span');
      num.className = 'tile-number';
      num.textContent = `× ${t}`;

      const stars = document.createElement('span');
      stars.className = 'tile-stars';
      stars.innerHTML = starRow(stats.mastery, MAX_MASTERY);

      tile.appendChild(num);
      tile.appendChild(stars);
      tile.addEventListener('click', () => {
        sfx.click();
        startMode(mode, t);
      });
      grid.appendChild(tile);
    });

    if (mode === 'practice' || mode === 'typing' || mode === 'lightning') {
      const mix = document.createElement('button');
      mix.className = 'table-tile mix-tile';
      const num = document.createElement('span');
      num.className = 'tile-number';
      num.textContent = '🎲 Mix';
      const label = document.createElement('span');
      label.className = 'tile-stars';
      label.textContent = 'All tables together!';
      mix.appendChild(num);
      mix.appendChild(label);
      mix.addEventListener('click', () => {
        sfx.click();
        startMode(mode, 0);
      });
      grid.appendChild(mix);
    }
  }

  function starRow(earned, total) {
    let html = '';
    for (let i = 0; i < total; i++) {
      html += i < earned ? '<span class="earned">★</span>' : '<span class="empty">☆</span>';
    }
    return html;
  }

  function startMode(mode, table) {
    if (mode === 'learn') startLearn(table);
    else if (mode === 'practice') startPractice(table);
    else if (mode === 'typing') startTyping(table);
    else if (mode === 'lightning') startLightning(table);
  }

  /* ---------------- learn mode ---------------- */

  let learn = { table: 2, index: 1 };

  function startLearn(table) {
    learn = { table, index: 1 };
    $('learn-title').textContent = `The ${table} times table`;
    renderLearnDots();
    renderLearnFact();
    showScreen('learn');
  }

  function renderLearnDots() {
    const wrap = $('learn-dots');
    wrap.innerHTML = '';
    for (let i = 1; i <= MAX_TABLE; i++) {
      const dot = document.createElement('button');
      dot.className = 'learn-dot' + (i === learn.index ? ' active' : '');
      dot.textContent = i;
      dot.addEventListener('click', () => {
        sfx.click();
        learn.index = i;
        renderLearnFact();
        renderLearnDots();
      });
      wrap.appendChild(dot);
    }
  }

  function renderLearnFact() {
    const a = learn.table;
    const b = learn.index;
    const result = a * b;
    $('learn-fact').textContent = `${a} × ${b} = ${result}`;
    $('learn-story').textContent = `${b} ${b === 1 ? 'group' : 'groups'} of ${a} ${a === 1 ? 'star' : 'stars'} makes ${result}!`;

    const visual = $('learn-visual');
    visual.innerHTML = '';
    visual.classList.toggle('dense', result > 60);
    for (let g = 0; g < b; g++) {
      const group = document.createElement('div');
      group.className = 'star-group';
      group.style.animationDelay = `${g * 0.05}s`;
      for (let i = 0; i < a; i++) {
        const star = document.createElement('span');
        star.textContent = '⭐';
        group.appendChild(star);
      }
      visual.appendChild(group);
    }

    $('btn-learn-prev').disabled = learn.index <= 1;
    $('btn-learn-next').disabled = learn.index >= MAX_TABLE;
  }

  function learnStep(delta) {
    sfx.click();
    learn.index = Math.min(MAX_TABLE, Math.max(1, learn.index + delta));
    renderLearnFact();
    renderLearnDots();
  }

  /* ---------------- question generation ---------------- */

  function factKey(a, b) {
    return `${a}x${b}`;
  }

  function recordWrong(a, b) {
    const key = factKey(a, b);
    player.factWrong[key] = (player.factWrong[key] || 0) + 1;
  }

  function clearSomeWrong(a, b) {
    const key = factKey(a, b);
    if (player.factWrong[key]) {
      player.factWrong[key] = Math.max(0, player.factWrong[key] - 1);
    }
  }

  function buildPracticeQuestions(table, count) {
    const questions = [];
    if (table > 0) {
      // Weighted selection: facts answered wrong before show up more often.
      let candidates = allTables().map(b => ({
        b,
        weight: 1 + 2 * (player.factWrong[factKey(table, b)] || 0)
      }));
      while (questions.length < count && candidates.length > 0) {
        const totalWeight = candidates.reduce((s, c) => s + c.weight, 0);
        let roll = Math.random() * totalWeight;
        let chosenIndex = 0;
        for (let i = 0; i < candidates.length; i++) {
          roll -= candidates[i].weight;
          if (roll <= 0) { chosenIndex = i; break; }
        }
        const chosen = candidates.splice(chosenIndex, 1)[0];
        questions.push({ a: table, b: chosen.b });
      }
    } else {
      const used = new Set();
      while (questions.length < count) {
        const a = randomInt(2, MAX_TABLE);
        const b = randomInt(1, MAX_TABLE);
        const key = factKey(a, b);
        if (used.has(key) && used.size < 100) continue;
        used.add(key);
        questions.push({ a, b });
      }
    }
    return shuffle(questions).map(q => ({ ...q, answer: q.a * q.b }));
  }

  function makeChoices(a, b) {
    const correct = a * b;
    const pool = new Set();
    [
      a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b,
      correct + a, correct - a, correct + b, correct - b,
      correct + 1, correct - 1, correct + 10, correct - 10
    ].forEach(v => {
      if (v > 0 && v !== correct) pool.add(v);
    });
    const distractors = shuffle([...pool]).slice(0, 3);
    while (distractors.length < 3) {
      const filler = correct + randomInt(2, 12);
      if (filler !== correct && !distractors.includes(filler)) distractors.push(filler);
    }
    return shuffle([correct, ...distractors]);
  }

  /* ---------------- practice mode ---------------- */

  let practice = null;
  let practiceTimer = null;

  function startPractice(table) {
    practice = {
      table,
      questions: buildPracticeQuestions(table, PRACTICE_QUESTIONS),
      index: 0,
      correct: 0,
      answered: false
    };
    showScreen('practice');
    renderPracticeQuestion();
  }

  function renderPracticeQuestion() {
    const q = practice.questions[practice.index];
    practice.answered = false;
    $('practice-progress-label').textContent = `Question ${practice.index + 1} of ${practice.questions.length}`;
    $('practice-progress-bar').style.width = `${(practice.index / practice.questions.length) * 100}%`;
    $('practice-prompt').textContent = pick(PROMPTS);
    $('practice-question').textContent = `${q.a} × ${q.b} = ?`;
    const feedback = $('practice-feedback');
    feedback.textContent = '\u00a0';
    feedback.className = 'feedback-line';

    const grid = $('practice-answers');
    grid.innerHTML = '';
    makeChoices(q.a, q.b).forEach(value => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = value;
      btn.addEventListener('click', () => answerPractice(btn, value));
      grid.appendChild(btn);
    });
  }

  function answerPractice(btn, value) {
    if (practice.answered) return;
    practice.answered = true;
    const q = practice.questions[practice.index];
    const buttons = [...$('practice-answers').children];
    buttons.forEach(b => { b.disabled = true; });

    const feedback = $('practice-feedback');
    let delay;

    player.counters.totalAnswered += 1;

    if (value === q.answer) {
      practice.correct += 1;
      player.counters.totalCorrect += 1;
      clearSomeWrong(q.a, q.b);
      btn.classList.add('correct');
      feedback.textContent = pick(PRAISE) + '  +1 ⭐';
      feedback.classList.add('good');
      sfx.correct();
      awardStars(1, { silent: true });
      delay = 1000;
    } else {
      recordWrong(q.a, q.b);
      btn.classList.add('wrong');
      buttons.forEach(b => {
        if (parseInt(b.textContent, 10) === q.answer) b.classList.add('reveal');
      });
      feedback.textContent = `${pick(ENCOURAGE)}  ${q.a} × ${q.b} = ${q.answer}`;
      feedback.classList.add('oops');
      sfx.wrong();
      delay = 2200;
    }

    persist();

    practiceTimer = setTimeout(() => {
      practice.index += 1;
      if (practice.index >= practice.questions.length) {
        finishPractice();
      } else {
        renderPracticeQuestion();
      }
    }, delay);
  }

  function finishPractice() {
    const score = practice.correct;
    const total = practice.questions.length;
    const table = practice.table;

    let bonus = 0;
    if (score === total) {
      bonus = PERFECT_BONUS_STARS;
      awardStars(bonus, { silent: true });
    }

    player.counters.practiceRounds += 1;
    if (score === total) player.counters.perfectRounds += 1;

    let earnedTableStar = false;
    if (table > 0) {
      const stats = player.tableStats[table];
      stats.rounds += 1;
      stats.bestScore = Math.max(stats.bestScore, score);
      if (score >= MASTERY_SCORE_THRESHOLD && stats.mastery < MAX_MASTERY) {
        stats.mastery += 1;
        earnedTableStar = true;
      }
    }

    const newBadges = checkBadges();
    persist();

    showResults({
      mode: 'practice',
      table,
      score,
      total,
      bonus,
      earnedTableStar,
      newBadges
    });
  }

  /* ---------------- Type It mode (keyboard-first, typed answers) ---------------- */

  let typing = null;
  let typingTimer = null;

  function startTyping(table) {
    typing = {
      table,
      questions: buildPracticeQuestions(table, PRACTICE_QUESTIONS),
      index: 0,
      correct: 0,
      typed: '',
      answered: false
    };
    showScreen('typing');
    renderTypingQuestion();
  }

  function renderTypingQuestion() {
    const q = typing.questions[typing.index];
    typing.answered = false;
    typing.typed = '';
    $('typing-progress-label').textContent = `Question ${typing.index + 1} of ${typing.questions.length}`;
    $('typing-progress-bar').style.width = `${(typing.index / typing.questions.length) * 100}%`;
    $('typing-prompt').textContent = pick(PROMPTS);
    $('typing-question').textContent = `${q.a} × ${q.b} = ?`;
    renderTypingAnswer();
    const feedback = $('typing-feedback');
    feedback.textContent = '\u00a0';
    feedback.className = 'feedback-line';
  }

  function renderTypingAnswer() {
    $('typing-answer').textContent = typing && typing.typed !== '' ? typing.typed : '\u00a0';
  }

  function typingKey(key) {
    if (!typing) return;
    if (typing.answered) {
      // After feedback, Enter / ✓ moves on straight away instead of waiting.
      if (key === 'ok') advanceTyping();
      return;
    }
    if (key === 'del') {
      typing.typed = typing.typed.slice(0, -1);
    } else if (key === 'ok') {
      submitTypingAnswer();
      return;
    } else if (/^[0-9]$/.test(key)) {
      if (typing.typed.length < 3) typing.typed += key;
      sfx.click();
    }
    renderTypingAnswer();
  }

  function submitTypingAnswer() {
    if (!typing || typing.answered || typing.typed === '') return;
    typing.answered = true;
    const q = typing.questions[typing.index];
    const value = parseInt(typing.typed, 10);
    const feedback = $('typing-feedback');
    let delay;

    player.counters.totalAnswered += 1;

    if (value === q.answer) {
      typing.correct += 1;
      player.counters.totalCorrect += 1;
      clearSomeWrong(q.a, q.b);
      feedback.textContent = pick(PRAISE) + '  +1 ⭐';
      feedback.className = 'feedback-line good';
      sfx.correct();
      awardStars(1, { silent: true });
      delay = 1000;
    } else {
      recordWrong(q.a, q.b);
      feedback.textContent = `${pick(ENCOURAGE)}  ${q.a} × ${q.b} = ${q.answer}`;
      feedback.className = 'feedback-line oops';
      sfx.wrong();
      delay = 2200;
    }

    persist();
    typingTimer = setTimeout(advanceTyping, delay);
  }

  function advanceTyping() {
    if (!typing) return;
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    typing.index += 1;
    if (typing.index >= typing.questions.length) {
      finishTyping();
    } else {
      renderTypingQuestion();
    }
  }

  function finishTyping() {
    const score = typing.correct;
    const total = typing.questions.length;
    const table = typing.table;

    let bonus = 0;
    if (score === total) {
      bonus = PERFECT_BONUS_STARS;
      awardStars(bonus, { silent: true });
    }

    player.counters.typingRounds += 1;
    if (score === total) player.counters.perfectTypingRounds += 1;

    let earnedTableStar = false;
    if (table > 0) {
      const stats = player.tableStats[table];
      stats.rounds += 1;
      stats.bestScore = Math.max(stats.bestScore, score);
      if (score >= MASTERY_SCORE_THRESHOLD && stats.mastery < MAX_MASTERY) {
        stats.mastery += 1;
        earnedTableStar = true;
      }
    }

    const newBadges = checkBadges();
    persist();

    showResults({
      mode: 'typing',
      table,
      score,
      total,
      bonus,
      earnedTableStar,
      newBadges
    });
  }

  /* ---------------- lightning mode ---------------- */

  let lightning = null;

  function startLightning(table) {
    lightning = {
      table,
      score: 0,
      asked: 0,
      timeLeft: LIGHTNING_SECONDS,
      typed: '',
      current: null,
      previousKey: null,
      running: true,
      timerId: null
    };
    showScreen('lightning');
    nextLightningQuestion();
    updateLightningHud();
    renderTypedAnswer();
    $('lightning-feedback').textContent = '\u00a0';
    $('lightning-feedback').className = 'feedback-line';
    lightning.timerId = setInterval(tickLightning, 1000);
  }

  function nextLightningQuestion() {
    let a, b, key;
    do {
      a = lightning.table > 0 ? lightning.table : randomInt(2, MAX_TABLE);
      b = randomInt(1, MAX_TABLE);
      key = factKey(a, b);
    } while (key === lightning.previousKey);
    lightning.previousKey = key;
    lightning.current = { a, b, answer: a * b };
    lightning.typed = '';
    $('lightning-question').textContent = `${a} × ${b} = ?`;
    renderTypedAnswer();
  }

  function updateLightningHud() {
    $('lightning-time').textContent = lightning.timeLeft;
    $('lightning-score').textContent = lightning.score;
    $('lightning-timer-bar').style.width = `${(lightning.timeLeft / LIGHTNING_SECONDS) * 100}%`;
  }

  function tickLightning() {
    if (!lightning || !lightning.running) return;
    lightning.timeLeft -= 1;
    updateLightningHud();
    if (lightning.timeLeft <= 5 && lightning.timeLeft > 0) sfx.tick();
    if (lightning.timeLeft <= 0) finishLightning();
  }

  function renderTypedAnswer() {
    $('lightning-answer').textContent = lightning && lightning.typed !== '' ? lightning.typed : '\u00a0';
  }

  function lightningKey(key) {
    if (!lightning || !lightning.running) return;
    if (key === 'del') {
      lightning.typed = lightning.typed.slice(0, -1);
    } else if (key === 'ok') {
      submitLightningAnswer();
      return;
    } else if (/^[0-9]$/.test(key)) {
      if (lightning.typed.length < 3) lightning.typed += key;
      sfx.click();
    }
    renderTypedAnswer();
  }

  function submitLightningAnswer() {
    if (!lightning || !lightning.running || lightning.typed === '') return;
    const value = parseInt(lightning.typed, 10);
    const q = lightning.current;
    const feedback = $('lightning-feedback');
    lightning.asked += 1;
    player.counters.totalAnswered += 1;

    if (value === q.answer) {
      lightning.score += 1;
      player.counters.totalCorrect += 1;
      clearSomeWrong(q.a, q.b);
      awardStars(1, { silent: true });
      sfx.correct();
      feedback.textContent = pick(PRAISE);
      feedback.className = 'feedback-line good';
    } else {
      recordWrong(q.a, q.b);
      sfx.wrong();
      feedback.textContent = `${q.a} × ${q.b} = ${q.answer} — keep going!`;
      feedback.className = 'feedback-line oops';
    }

    updateLightningHud();
    persist();
    nextLightningQuestion();
  }

  function finishLightning() {
    if (!lightning) return;
    lightning.running = false;
    clearInterval(lightning.timerId);

    const score = lightning.score;
    const isNewBest = score > player.bestLightning;
    if (isNewBest) player.bestLightning = score;

    const newBadges = checkBadges();
    persist();

    showResults({
      mode: 'lightning',
      table: lightning.table,
      score,
      total: lightning.asked,
      isNewBest,
      newBadges
    });
  }

  /* ---------------- keypads & physical keyboard ---------------- */

  function buildKeypad(containerId, handler) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
    const pad = $(containerId);
    pad.innerHTML = '';
    keys.forEach(key => {
      const btn = document.createElement('button');
      btn.className = 'key-btn';
      if (key === 'del') { btn.classList.add('key-del'); btn.textContent = '⌫'; }
      else if (key === 'ok') { btn.classList.add('key-ok'); btn.textContent = '✓'; }
      else btn.textContent = key;
      btn.addEventListener('click', () => handler(key));
      pad.appendChild(btn);
    });
  }

  function handlePhysicalKeys(event) {
    const screen = currentScreen();

    if (screen === 'lightning' && lightning && lightning.running) {
      if (/^[0-9]$/.test(event.key)) {
        lightningKey(event.key);
        event.preventDefault();
      } else if (event.key === 'Backspace') {
        lightningKey('del');
        event.preventDefault();
      } else if (event.key === 'Enter') {
        lightningKey('ok');
        event.preventDefault();
      }
      return;
    }

    if (screen === 'typing' && typing) {
      if (/^[0-9]$/.test(event.key)) {
        typingKey(event.key);
        event.preventDefault();
      } else if (event.key === 'Backspace') {
        typingKey('del');
        event.preventDefault();
      } else if (event.key === 'Enter' && !event.repeat) {
        typingKey('ok');
        event.preventDefault();
      }
      return;
    }

    // On the results screen, Enter starts another round (unless a button is focused,
    // in which case the button handles it).
    if (screen === 'results' && lastRound) {
      if (event.key === 'Enter' && !event.repeat &&
          (!event.target || event.target.tagName !== 'BUTTON')) {
        repeatLastRound();
        event.preventDefault();
      }
    }
  }

  /* ---------------- results ---------------- */

  let lastRound = null;

  function performanceTier(round) {
    if (round.mode === 'lightning') {
      if (round.score >= 25) return 3;
      if (round.score >= 15) return 2;
      if (round.score >= 8) return 1;
      return 0;
    }
    const ratio = round.score / round.total;
    if (ratio === 1) return 3;
    if (round.score >= 8) return 2;
    if (round.score >= 5) return 1;
    return 0;
  }

  function showResults(round) {
    lastRound = round;
    const tier = performanceTier(round);

    const headings = [
      ['Good try!', 'Keep practising!'],
      ['Nice work!', 'You are getting there!'],
      ['Great job!', 'So close to perfect!'],
      ['AMAZING!', 'Superstar!']
    ];
    $('results-heading').textContent = pick(headings[tier]);
    $('results-mascot').src = tier >= 2 ? 'assets/mascot_cheer.png' : 'assets/mascot.png';

    if (round.mode === 'lightning') {
      $('results-detail').textContent = `You answered ${round.score} questions correctly in ${LIGHTNING_SECONDS} seconds!`;
    } else {
      const tableName = round.table > 0 ? `the ${round.table} times table` : 'the big mix';
      const verb = round.mode === 'typing' ? 'typed' : 'got';
      $('results-detail').textContent = `You ${verb} ${round.score} out of ${round.total} on ${tableName}!`;
    }

    const starsWrap = $('results-stars');
    starsWrap.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const star = document.createElement('span');
      star.className = 'star-pop';
      star.style.animationDelay = `${0.2 + i * 0.25}s`;
      star.textContent = i < tier ? '⭐' : '☆';
      starsWrap.appendChild(star);
    }

    const messages = [];
    messages.push(`You earned ${round.score} ⭐ for correct answers.`);
    if (round.mode === 'lightning') {
      if (round.isNewBest) messages.push('That is your best Lightning score ever! 🏆');
    } else {
      if (round.bonus) messages.push(`Perfect round bonus: +${round.bonus} ⭐!`);
      if (round.earnedTableStar) messages.push(`You earned a table star for the ${round.table} times table! 🌟`);
    }
    const goal = nextTreasureGoal();
    if (goal && player.stars >= goal.price) {
      messages.push(`You can now afford the ${goal.emoji} ${goal.name} in the Star Shop!`);
    }
    $('results-message').textContent = messages.join(' ');

    const badgeWrap = $('results-badges');
    badgeWrap.innerHTML = '';
    round.newBadges.forEach((badge, i) => {
      const chip = document.createElement('span');
      chip.className = 'new-badge';
      chip.style.animationDelay = `${0.3 + i * 0.2}s`;
      chip.textContent = `New badge: ${badge.emoji} ${badge.name}`;
      badgeWrap.appendChild(chip);
    });

    showScreen('results');

    if (tier >= 2) {
      sfx.fanfare();
      launchConfetti(tier === 3 ? 120 : 70);
    } else {
      sfx.star();
    }
    announceBadges(round.newBadges);
  }

  function repeatLastRound() {
    if (!lastRound) { goHome(); return; }
    sfx.click();
    startMode(lastRound.mode, lastRound.table);
  }

  /* ---------------- My Quest screen ---------------- */

  function renderBadgesScreen() {
    $('badges-star-total').textContent = player.starsEarned;
    $('badges-best-lightning').textContent = `Best Lightning score: ${player.bestLightning}`;

    const earned = questStars();
    $('badges-quest-label').textContent = `Quest to the castle: ${earned} of ${questTotal()} table stars`;
    $('badges-quest-bar').style.width = `${(earned / questTotal()) * 100}%`;

    const masteryGrid = $('mastery-grid');
    masteryGrid.innerHTML = '';
    allTables().forEach(t => {
      const stats = player.tableStats[t];
      const tile = document.createElement('div');
      tile.className = 'mastery-tile' + (stats.mastery >= MAX_MASTERY ? ' maxed' : '');
      tile.innerHTML = `<div class="m-label">× ${t}</div><div class="m-stars">${starRow(stats.mastery, MAX_MASTERY)}</div>`;
      masteryGrid.appendChild(tile);
    });

    const badgeGrid = $('badge-grid');
    badgeGrid.innerHTML = '';
    BADGES.forEach(badge => {
      const owned = player.badges.includes(badge.id);
      const card = document.createElement('div');
      card.className = 'badge-card' + (owned ? '' : ' locked');
      card.innerHTML = `
        <span class="b-emoji">${owned ? badge.emoji : '🔒'}</span>
        <div>
          <p class="b-name">${badge.name}</p>
          <p class="b-desc">${badge.desc}</p>
        </div>`;
      badgeGrid.appendChild(card);
    });

    $('export-code').value = encodePlayerCode(player);
    const exportFeedback = $('export-feedback');
    exportFeedback.textContent = '';
    exportFeedback.className = 'transfer-feedback';
  }

  /* ---------------- Star Shop ---------------- */

  function renderShop() {
    $('shop-star-count').textContent = player.stars;
    $('shop-mascot').src = dragonStage(player).img;

    const ownedWrap = $('owned-treasures');
    ownedWrap.innerHTML = '';
    if (player.treasures.length === 0) {
      const span = document.createElement('span');
      span.className = 'placeholder';
      span.textContent = 'No treasures yet — answer questions to earn stars, then come back to spend them!';
      ownedWrap.appendChild(span);
    } else {
      player.treasures.forEach(id => {
        const item = SHOP_ITEMS.find(s => s.id === id);
        if (item) {
          const span = document.createElement('span');
          span.textContent = item.emoji;
          span.title = item.name;
          ownedWrap.appendChild(span);
        }
      });
    }

    const grid = $('shop-grid');
    grid.innerHTML = '';
    SHOP_ITEMS.forEach(item => {
      const owned = player.treasures.includes(item.id);
      const card = document.createElement('div');
      card.className = 'shop-item' + (owned ? ' owned' : '');

      const emoji = document.createElement('span');
      emoji.className = 's-emoji';
      emoji.textContent = item.emoji;

      const name = document.createElement('span');
      name.className = 's-name';
      name.textContent = item.name;

      const price = document.createElement('span');
      price.className = 's-price';
      price.textContent = owned ? 'Collected ✓' : `⭐ ${item.price}`;

      card.appendChild(emoji);
      card.appendChild(name);
      card.appendChild(price);

      if (!owned) {
        const buy = document.createElement('button');
        buy.className = 'buy-btn';
        buy.textContent = 'Get it!';
        buy.disabled = player.stars < item.price;
        buy.addEventListener('click', () => buyTreasure(item.id));
        card.appendChild(buy);
      }

      grid.appendChild(card);
    });
  }

  function buyTreasure(itemId) {
    const item = SHOP_ITEMS.find(s => s.id === itemId);
    if (!item || player.treasures.includes(itemId) || player.stars < item.price) return;
    const stageBefore = dragonStageIndex(player);
    player.stars -= item.price;
    player.treasures.push(itemId);
    const stageAfter = dragonStageIndex(player);
    const newBadges = checkBadges();
    persist();
    updateTopbar(true);
    sfx.buy();

    const messages = [];
    if (stageAfter > stageBefore) {
      sfx.fanfare();
      launchConfetti(130);
      messages.push(`✨ Sparky has grown into ${DRAGON_STAGES[stageAfter].name}! Visit Sparky's Den to see!`);
    } else {
      launchConfetti(50);
      messages.push(`You earned the ${item.emoji} ${item.name}! It is now in Sparky's den!`);
    }
    if (newBadges.length > 0) {
      messages.push(`New badge: ${newBadges[0].emoji} ${newBadges[0].name}!`);
    }
    showToast(messages.join('  '), messages.length > 1 || stageAfter > stageBefore ? 4500 : 2600);
    renderShop();
  }

  /* ---------------- Sparky's Den ---------------- */

  function renderDragon() {
    const owned = player.treasures.length;
    const stageIdx = dragonStageIndex(player);
    const stage = DRAGON_STAGES[stageIdx];

    $('dragon-image').src = stage.img;
    $('dragon-stage-name').textContent = stage.name;
    $('dragon-stage-desc').textContent = stage.desc;
    $('dragon-progress-label').textContent = `Treasure collection: ${owned} of ${SHOP_ITEMS.length}`;
    $('dragon-progress-bar').style.width = `${(owned / SHOP_ITEMS.length) * 100}%`;

    const next = DRAGON_STAGES[stageIdx + 1];
    const hint = $('dragon-next-hint');
    if (next) {
      const needed = next.treasures - owned;
      hint.textContent = `Collect ${needed} more ${needed === 1 ? 'treasure' : 'treasures'} and Sparky grows into ${next.name}!`;
    } else {
      hint.textContent = 'Sparky has grown as much as a dragon can grow. Legendary!';
    }

    const wrap = $('dragon-treasures');
    wrap.innerHTML = '';
    if (player.treasures.length === 0) {
      const span = document.createElement('span');
      span.className = 'placeholder';
      span.textContent = "Sparky's den is empty. Earn stars and buy treasures in the Star Shop to fill it!";
      wrap.appendChild(span);
    } else {
      player.treasures.forEach(id => {
        const item = SHOP_ITEMS.find(s => s.id === id);
        if (item) {
          const span = document.createElement('span');
          span.textContent = item.emoji;
          span.title = item.name;
          wrap.appendChild(span);
        }
      });
    }

    const row = $('dragon-stages-row');
    row.innerHTML = '';
    DRAGON_STAGES.forEach((s, i) => {
      const dot = document.createElement('div');
      dot.className = 'stage-dot' + (i === stageIdx ? ' current' : '') + (i > stageIdx ? ' locked' : '');
      const img = document.createElement('img');
      img.src = s.img;
      img.alt = s.name;
      const cap = document.createElement('div');
      cap.className = 'stage-cap';
      cap.textContent = i <= stageIdx ? s.name : `🔒 ${s.treasures} treasures`;
      dot.appendChild(img);
      dot.appendChild(cap);
      row.appendChild(dot);
    });
  }

  /* ---------------- save transfer (export / import) ---------------- */

  const SAVE_CODE_PREFIX = 'TTQ1.';

  // Unicode-safe base64 helpers (names may contain accents or emoji).
  function toBase64Unicode(str) {
    const utf8Binary = encodeURIComponent(str).replace(/%([0-9A-F]{2})/gi,
      (match, hex) => String.fromCharCode(parseInt(hex, 16)));
    return btoa(utf8Binary);
  }

  function fromBase64Unicode(b64) {
    const binary = atob(b64);
    let percentEncoded = '';
    for (let i = 0; i < binary.length; i++) {
      percentEncoded += '%' + binary.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return decodeURIComponent(percentEncoded);
  }

  function encodePlayerCode(p) {
    return SAVE_CODE_PREFIX + toBase64Unicode(JSON.stringify(p));
  }

  function decodePlayerCode(code) {
    let trimmed = (code || '').trim();
    if (!trimmed) throw new Error('Empty save code');
    if (trimmed.startsWith(SAVE_CODE_PREFIX)) trimmed = trimmed.slice(SAVE_CODE_PREFIX.length);
    trimmed = trimmed.replace(/\s+/g, '');
    const parsed = JSON.parse(fromBase64Unicode(trimmed));
    if (!parsed || typeof parsed !== 'object' || typeof parsed.name !== 'string' || !parsed.name.trim()) {
      throw new Error('Not a valid player save');
    }
    if (typeof parsed.id !== 'string' || !parsed.id) {
      parsed.id = 'p' + Date.now().toString(36) + randomInt(100, 999);
    }
    return ensurePlayerShape(parsed);
  }

  function importSaveCode() {
    const input = $('import-code');
    const feedback = $('import-feedback');
    feedback.className = 'transfer-feedback';
    let imported;
    try {
      imported = decodePlayerCode(input.value);
    } catch (err) {
      console.warn('Could not import save code:', err);
      sfx.wrong();
      input.classList.remove('wobble');
      void input.offsetWidth;
      input.classList.add('wobble');
      feedback.textContent = 'Hmm, that code does not look right. Make sure the whole code was copied.';
      feedback.classList.add('oops');
      return;
    }
    const existingIndex = save.players.findIndex(p => p.id === imported.id);
    if (existingIndex >= 0) {
      save.players[existingIndex] = imported;
    } else {
      save.players.push(imported);
    }
    persist();
    input.value = '';
    feedback.textContent = '';
    sfx.fanfare();
    selectPlayer(imported.id);
    showToast(`Welcome back, ${imported.name}! Your save arrived safely with ⭐ ${imported.stars} stars.`, 4200);
  }

  function copySaveCode() {
    const area = $('export-code');
    const feedback = $('export-feedback');
    const code = area.value;
    feedback.className = 'transfer-feedback';
    const onCopied = () => {
      sfx.click();
      feedback.textContent = 'Copied! Paste it into "Import a save code" on the other device.';
      feedback.classList.add('good');
    };
    const fallback = () => {
      try {
        area.focus();
        area.select();
        if (document.execCommand && document.execCommand('copy')) {
          onCopied();
          return;
        }
      } catch (err) {
        console.warn('Copy fallback failed:', err);
      }
      feedback.textContent = 'Select the code above and copy it (Ctrl+C, or long-press on a tablet).';
      feedback.classList.add('good');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(onCopied, fallback);
    } else {
      fallback();
    }
  }

  /* ---------------- confetti ---------------- */

  const CONFETTI_COLORS = ['#ff7b54', '#2ec4b6', '#ffc145', '#b89ae0', '#f48fb1', '#58c977'];

  function launchConfetti(count) {
    const layer = $('confetti-layer');
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.background = pick(CONFETTI_COLORS);
      piece.style.width = `${randomInt(8, 14)}px`;
      piece.style.height = `${randomInt(8, 14)}px`;
      piece.style.animationDuration = `${2 + Math.random() * 2}s`;
      piece.style.animationDelay = `${Math.random() * 0.6}s`;
      layer.appendChild(piece);
    }
    setTimeout(() => { layer.innerHTML = ''; }, 5200);
  }

  /* ---------------- navigation & cleanup ---------------- */

  function abortRunningRound(nextScreenName) {
    if (practiceTimer) {
      clearTimeout(practiceTimer);
      practiceTimer = null;
    }
    if (typingTimer && nextScreenName !== 'typing') {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    if (lightning && lightning.running && nextScreenName !== 'lightning') {
      lightning.running = false;
      clearInterval(lightning.timerId);
    }
  }

  function goHome() {
    sfx.click();
    if (!player) {
      renderWelcome();
      showScreen('welcome');
      return;
    }
    renderHome();
    showScreen('home');
  }

  /* ---------------- wiring ---------------- */

  function wireEvents() {
    // Welcome
    $('btn-start').addEventListener('click', startNewPlayer);
    $('player-name').addEventListener('keydown', event => {
      if (event.key === 'Enter') startNewPlayer();
    });

    // Save transfer
    $('btn-import-save').addEventListener('click', importSaveCode);
    $('btn-copy-save').addEventListener('click', copySaveCode);

    // Top bar
    $('btn-home').addEventListener('click', goHome);
    $('btn-sound').addEventListener('click', () => {
      save.soundOn = !save.soundOn;
      persist();
      updateSoundIcon();
      if (save.soundOn) sfx.click();
    });

    // Home modes
    $('btn-mode-learn').addEventListener('click', () => { sfx.click(); openTablePicker('learn'); });
    $('btn-mode-practice').addEventListener('click', () => { sfx.click(); openTablePicker('practice'); });
    $('btn-mode-typing').addEventListener('click', () => { sfx.click(); openTablePicker('typing'); });
    $('btn-mode-lightning').addEventListener('click', () => { sfx.click(); openTablePicker('lightning'); });
    $('btn-mode-dragon').addEventListener('click', () => { sfx.click(); renderDragon(); showScreen('dragon'); });
    $('btn-mode-badges').addEventListener('click', () => { sfx.click(); renderBadgesScreen(); showScreen('badges'); });
    $('btn-mode-shop').addEventListener('click', () => { sfx.click(); renderShop(); showScreen('shop'); });

    // Sparky's Den buttons
    $('btn-dragon-play').addEventListener('click', () => { sfx.click(); openTablePicker('practice'); });
    $('btn-dragon-shop').addEventListener('click', () => { sfx.click(); renderShop(); showScreen('shop'); });
    $('btn-switch-player').addEventListener('click', () => {
      sfx.click();
      player = null;
      renderWelcome();
      showScreen('welcome');
    });

    // Learn
    $('btn-learn-prev').addEventListener('click', () => learnStep(-1));
    $('btn-learn-next').addEventListener('click', () => learnStep(1));
    $('btn-learn-say').addEventListener('click', () => {
      sfx.click();
      speak(`${learn.table} times ${learn.index} equals ${learn.table * learn.index}`);
    });
    $('btn-learn-practice').addEventListener('click', () => {
      sfx.click();
      startPractice(learn.table);
    });

    // Practice question read-aloud
    $('practice-question').addEventListener('click', () => {
      if (practice && !practice.answered) {
        const q = practice.questions[practice.index];
        speak(`What is ${q.a} times ${q.b}?`);
      }
    });

    // Type It question read-aloud
    $('typing-question').addEventListener('click', () => {
      if (typing && !typing.answered) {
        const q = typing.questions[typing.index];
        speak(`What is ${q.a} times ${q.b}?`);
      }
    });

    // Results
    $('btn-results-again').addEventListener('click', repeatLastRound);
    $('btn-results-tables').addEventListener('click', () => {
      sfx.click();
      openTablePicker(lastRound ? lastRound.mode : 'practice');
    });
    $('btn-results-home').addEventListener('click', goHome);

    // Physical keyboard: Type It, Lightning and the results shortcut
    document.addEventListener('keydown', handlePhysicalKeys);
  }

  /* ---------------- init ---------------- */

  function init() {
    buildKeypad('keypad', lightningKey);
    buildKeypad('keypad-typing', typingKey);
    wireEvents();
    updateSoundIcon();
    renderWelcome();
    showScreen('welcome');
  }

  document.addEventListener('DOMContentLoaded', init);
})();