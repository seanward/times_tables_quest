/* ============================================================
   Times Tables Quest — DOM integration tests (jsdom)

   Run with:
     npm install jsdom   (anywhere, e.g. /tmp/ttq_test)
     NODE_PATH=<that>/node_modules node tests/dom_test.js

   The tests load the real index.html and game.js, then drive the
   game through its actual UI: clicks, keyboard events and the
   localStorage save format.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const GAME_JS = fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8');

let passed = 0;
let failed = 0;

function check(condition, label) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${label}`);
  }
}

function bootGame(seedSave) {
  const dom = new JSDOM(HTML, {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const { window } = dom;
  if (seedSave) {
    window.localStorage.setItem('timesTablesQuest.save.v1', JSON.stringify(seedSave));
  }
  window.eval(GAME_JS);
  // game.js registers its init on DOMContentLoaded; fire it explicitly.
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  return window;
}

function $(window, id) {
  return window.document.getElementById(id);
}

function visible(window, screenId) {
  return !$(window, screenId).classList.contains('hidden');
}

function pressKey(window, key) {
  window.document.dispatchEvent(new window.KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true
  }));
}

function typeNumber(window, value) {
  String(value).split('').forEach(digit => pressKey(window, digit));
}

function parseQuestion(text) {
  const match = text.match(/(\d+)\s*[×x]\s*(\d+)/);
  if (!match) throw new Error(`Could not parse question: "${text}"`);
  return { a: parseInt(match[1], 10), b: parseInt(match[2], 10) };
}

function clickTableTile(window, label) {
  const tiles = [...window.document.querySelectorAll('#table-grid .table-tile')];
  const tile = tiles.find(t => t.querySelector('.tile-number').textContent.trim() === label);
  if (!tile) throw new Error(`Table tile "${label}" not found`);
  tile.click();
}

/* ------------------------------------------------------------
   Scenario 1: new player, perfect Type It round, shop purchase,
   Sparky's Den, Lightning keyboard input, Enter-to-replay.
   ------------------------------------------------------------ */
function scenarioNewPlayer() {
  console.log('\nScenario 1: new player, Type It, shop purchase, den');
  const window = bootGame(null);

  check(visible(window, 'screen-welcome'), 'welcome screen is shown on load');

  // Create a player.
  $(window, 'player-name').value = 'Testchild';
  $(window, 'btn-start').click();
  check(visible(window, 'screen-home'), 'home screen appears after creating a player');
  check($(window, 'star-count').textContent === '0', 'star balance starts at 0');
  check($(window, 'home-mascot').getAttribute('src') === 'assets/mascot.png',
    'home mascot starts as Little Sparky');

  // Start Type It on the 2 times table.
  $(window, 'btn-mode-typing').click();
  check(visible(window, 'screen-tables'), 'table picker opens for Type It');
  clickTableTile(window, '× 2');
  check(visible(window, 'screen-typing'), 'Type It screen opens');

  // Answer all 10 questions correctly with the physical keyboard.
  for (let i = 0; i < 10; i++) {
    const label = $(window, 'typing-progress-label').textContent;
    if (!label.includes(`Question ${i + 1} of 10`)) {
      check(false, `progress label shows question ${i + 1} (got "${label}")`);
    }
    const { a, b } = parseQuestion($(window, 'typing-question').textContent);
    typeNumber(window, a * b);
    check($(window, 'typing-answer').textContent === String(a * b),
      `typed digits appear in the answer box for question ${i + 1}`);
    pressKey(window, 'Enter');                  // check the answer
    const feedback = $(window, 'typing-feedback').textContent;
    check(feedback.includes('⭐'), `question ${i + 1} marked correct`);
    pressKey(window, 'Enter');                  // skip the wait, move on
  }

  check(visible(window, 'screen-results'), 'results screen appears after 10 questions');
  const detail = $(window, 'results-detail').textContent;
  check(detail.includes('typed 10 out of 10'), `results text reports a perfect typed round ("${detail}")`);
  check($(window, 'star-count').textContent === '15', 'perfect round earns 15 stars (10 + 5 bonus)');
  const message = $(window, 'results-message').textContent;
  check(message.includes('Perfect round bonus'), 'results mention the perfect round bonus');
  check(message.includes('table star'), 'results mention the earned table star');
  check(message.includes('Baby Chick'), 'results point out the Baby Chick is now affordable');
  const badgeText = $(window, 'results-badges').textContent;
  check(badgeText.includes('Keyboard Explorer'), 'Keyboard Explorer badge awarded');
  check(badgeText.includes('Typing Champion'), 'Typing Champion badge awarded');

  // Buy the Baby Chick in the Star Shop.
  $(window, 'btn-results-home').click();
  $(window, 'btn-mode-shop').click();
  check(visible(window, 'screen-shop'), 'Star Shop opens');
  check($(window, 'shop-star-count').textContent === '15', 'shop shows the 15 star balance');
  const chickCard = [...window.document.querySelectorAll('#shop-grid .shop-item')]
    .find(card => card.querySelector('.s-name').textContent === 'Baby Chick');
  const buyBtn = chickCard.querySelector('.buy-btn');
  check(buyBtn && !buyBtn.disabled, 'Baby Chick "Get it!" button is enabled at 15 stars');
  buyBtn.click();
  const toast = $(window, 'toast').textContent;
  check(toast.includes('Baby Chick'), 'purchase toast names the Baby Chick');
  check(toast.includes("Sparky's den"), "purchase toast mentions Sparky's den");
  check(toast.includes('New badge'), 'purchase toast includes the Treasure Hunter badge');
  check($(window, 'star-count').textContent === '0', 'stars are spent after the purchase');
  check($(window, 'owned-treasures').textContent.includes('🐣'), 'chick appears in the shop collection');

  // Sparky's Den shows the treasure and stage information.
  $(window, 'btn-home').click();
  $(window, 'btn-mode-dragon').click();
  check(visible(window, 'screen-dragon'), "Sparky's Den opens");
  check($(window, 'dragon-stage-name').textContent === 'Little Sparky', 'den shows the Little Sparky stage');
  check($(window, 'dragon-progress-label').textContent.includes('1 of 17'), 'den shows 1 of 17 treasures');
  check($(window, 'dragon-treasures').textContent.includes('🐣'), 'den shows the Baby Chick treasure');
  check($(window, 'dragon-next-hint').textContent.includes('2 more'), 'den says 2 more treasures for the next stage');
  const stageDots = window.document.querySelectorAll('#dragon-stages-row .stage-dot');
  check(stageDots.length === 6, 'den shows all six stages');
  check(window.document.querySelectorAll('#dragon-stages-row .stage-dot.locked').length === 5,
    'five future stages are locked');

  // Lightning accepts physical keyboard input.
  $(window, 'btn-dragon-play').click();          // opens the practice table picker
  $(window, 'btn-home').click();
  $(window, 'btn-mode-lightning').click();
  clickTableTile(window, '× 2');
  check(visible(window, 'screen-lightning'), 'Lightning screen opens');
  const q = parseQuestion($(window, 'lightning-question').textContent);
  typeNumber(window, q.a * q.b);
  pressKey(window, 'Enter');
  check($(window, 'lightning-score').textContent === '1', 'Lightning scores a typed correct answer');
  $(window, 'btn-home').click();                 // abort the round

  // Enter on the results screen replays the last round.
  $(window, 'btn-mode-typing').click();
  clickTableTile(window, '× 3');
  for (let i = 0; i < 10; i++) {
    const fact = parseQuestion($(window, 'typing-question').textContent);
    typeNumber(window, fact.a * fact.b);
    pressKey(window, 'Enter');
    pressKey(window, 'Enter');
  }
  check(visible(window, 'screen-results'), 'results screen appears after the second Type It round');
  pressKey(window, 'Enter');
  check(visible(window, 'screen-typing'), 'pressing Enter on the results screen starts a new round');
  $(window, 'btn-home').click();

  return window;
}

/* ------------------------------------------------------------
   Scenario 2: saved profiles — stage evolution thresholds and
   migration of a legacy save without the newer fields.
   ------------------------------------------------------------ */
function scenarioSavedProfiles() {
  console.log('\nScenario 2: saved profiles, stage evolution, legacy migration');
  const seed = {
    soundOn: true,
    lastPlayerId: 'pA',
    players: [
      {
        id: 'pA',
        name: 'Star',
        stars: 50,
        starsEarned: 300,
        treasures: ['chick', 'butterfly', 'turtle', 'rainbow', 'kitten', 'puppy'],
        badges: [],
        bestLightning: 12,
        factWrong: {},
        tableStats: {},
        counters: { practiceRounds: 2, perfectRounds: 1, typingRounds: 0, perfectTypingRounds: 0, totalCorrect: 30, totalAnswered: 40 }
      },
      {
        // Legacy profile from the first release: no treasures, starsEarned or typing counters.
        id: 'pB',
        name: 'Old',
        stars: 7,
        badges: [],
        bestLightning: 3,
        factWrong: {},
        tableStats: {},
        counters: { practiceRounds: 1, perfectRounds: 0, totalCorrect: 5, totalAnswered: 10 }
      }
    ]
  };
  const window = bootGame(seed);

  check(visible(window, 'screen-welcome'), 'welcome screen lists returning players');
  const pills = [...window.document.querySelectorAll('#player-buttons .player-pill')];
  check(pills.length === 2, 'both saved players are offered');

  // Player with 6 treasures should be Explorer Sparky (stage 3).
  pills.find(p => p.textContent.startsWith('Star')).click();
  check(visible(window, 'screen-home'), 'saved player with treasures loads');
  check($(window, 'home-mascot').getAttribute('src') === 'assets/sparky_stage3.png',
    'home mascot shows Explorer Sparky at 6 treasures');
  $(window, 'btn-mode-dragon').click();
  check($(window, 'dragon-stage-name').textContent === 'Explorer Sparky', 'den names the Explorer Sparky stage');
  check($(window, 'dragon-progress-label').textContent.includes('6 of 17'), 'den shows 6 of 17 treasures');
  check($(window, 'dragon-next-hint').textContent.includes('4 more'), 'den asks for 4 more treasures for Hero Sparky');
  check($(window, 'dragon-next-hint').textContent.includes('Hero Sparky'), 'next stage is Hero Sparky');

  // Legacy profile must load without errors and show sensible defaults.
  $(window, 'btn-home').click();
  $(window, 'btn-switch-player').click();
  const oldPill = [...window.document.querySelectorAll('#player-buttons .player-pill')]
    .find(p => p.textContent.startsWith('Old'));
  oldPill.click();
  check(visible(window, 'screen-home'), 'legacy profile loads without errors');
  check($(window, 'star-count').textContent === '7', 'legacy profile keeps its star balance');
  $(window, 'btn-mode-dragon').click();
  check($(window, 'dragon-progress-label').textContent.includes('0 of 17'), 'legacy profile starts with an empty den');
  $(window, 'btn-home').click();
  $(window, 'btn-mode-badges').click();
  check(visible(window, 'screen-badges'), 'My Quest screen renders for the legacy profile');
  check($(window, 'badges-star-total').textContent === '7',
    'lifetime stars fall back to the balance for legacy profiles');

  return window;
}

/* ------------------------------------------------------------ */

try {
  scenarioNewPlayer();
  scenarioSavedProfiles();
} catch (err) {
  failed += 1;
  console.error('\nUnexpected error during tests:', err);
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);