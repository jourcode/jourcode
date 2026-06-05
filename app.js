const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const expectedSequence = Object.freeze(['teal', 'blue', 'green', 'violet']);
const statusNode = document.getElementById('sequence-status');
const vaultNode = document.getElementById('vault');
const resetButton = document.getElementById('reset-sequence');
const hintButton = document.getElementById('reveal-hint');
const glyphButtons = Array.from(document.querySelectorAll('[data-glyph]'));
const commandButtons = Array.from(document.querySelectorAll('[data-command]'));
const commandDots = Array.from(document.querySelectorAll('[data-command-dot]'));
const commandOutputNode = document.getElementById('command-output');
const glowButton = document.getElementById('toggle-glow');
const gridButton = document.getElementById('toggle-grid');
const paletteButton = document.getElementById('cycle-palette');
const openPuzzleButton = document.getElementById('open-puzzle');
const playSection = document.getElementById('play');
const controlStatusNode = document.getElementById('control-status');
const consoleInput = document.getElementById('console-input');
const consoleRunButton = document.getElementById('run-console-command');
const consoleOutputNode = document.getElementById('console-output');
const traceButtons = Array.from(document.querySelectorAll('[data-trace]'));
const traceStatusNode = document.getElementById('trace-status');
const decodeButton = document.getElementById('decode-clue');
const cipherStatusNode = document.getElementById('cipher-status');
const coreStatusNode = document.getElementById('core-status');
const coreNode = document.getElementById('core');
const coreSteps = Array.from(document.querySelectorAll('[data-core-step]'));
const commandMessages = Object.freeze({
  access: 'Access path active.',
  privacy: 'Privacy path active.',
  motion: 'Motion path active.',
  code: 'Code path active.',
});
const expectedTrace = Object.freeze(['C', 'N', 'E', 'S']);
let sequence = [];
let completedCommands = new Set();
let tracePath = [];
let paletteIndex = 0;
let coreState = {
  board: false,
  cipher: false,
  sequence: false,
  trace: false,
};

function setCursorLight(event) {
  if (reducedMotionQuery.matches) return;

  const x = `${Math.round((event.clientX / window.innerWidth) * 100)}%`;
  const y = `${Math.round((event.clientY / window.innerHeight) * 100)}%`;
  document.documentElement.style.setProperty('--cursor-x', x);
  document.documentElement.style.setProperty('--cursor-y', y);
}

function sequenceLabel(items) {
  if (!items.length) return 'none yet';
  return items.join(', ');
}

function updateActiveButtons() {
  for (const button of glyphButtons) {
    const glyph = button.dataset.glyph;
    button.classList.toggle('is-active', sequence.includes(glyph));
  }
}

function resetSequence(message = 'Sequence reset.') {
  sequence = [];
  vaultNode.hidden = true;
  coreState.sequence = false;
  statusNode.textContent = message;
  updateActiveButtons();
  updateCoreState();
}

function showHint() {
  statusNode.textContent = 'Hint: teal, blue, green, violet.';
}

function checkSequence() {
  const currentIndex = sequence.length - 1;
  if (sequence[currentIndex] !== expectedSequence[currentIndex]) {
    resetSequence('Not that path. Try the palette order.');
    return;
  }

  if (sequence.length === expectedSequence.length) {
    statusNode.textContent = 'Signal found. Vault open.';
    vaultNode.hidden = false;
    coreState.sequence = true;
    updateCoreState();
    vaultNode.focus?.();
    return;
  }

  statusNode.textContent = `Path: ${sequenceLabel(sequence)}.`;
}

function addGlyph(glyph) {
  if (!expectedSequence.includes(glyph)) return;
  sequence.push(glyph);
  updateActiveButtons();
  checkSequence();
}

function updateCommandProgress() {
  for (const button of commandButtons) {
    const command = button.dataset.command;
    const isComplete = completedCommands.has(command);
    button.classList.toggle('is-active', isComplete);
    button.setAttribute('aria-pressed', String(isComplete));
  }

  for (const dot of commandDots) {
    dot.classList.toggle('is-lit', completedCommands.has(dot.dataset.commandDot));
  }
}

function runCommand(command) {
  if (!commandMessages[command]) return;

  completedCommands.add(command);
  updateCommandProgress();

  const isComplete = completedCommands.size === commandButtons.length;
  coreState.board = isComplete;
  updateCoreState();
  commandOutputNode.textContent = isComplete
    ? `${commandMessages[command]} All paths online.`
    : commandMessages[command];
}

function setControlStatus(message) {
  controlStatusNode.textContent = message;
}

function toggleSoftGlow() {
  const isSoft = document.body.classList.toggle('is-soft-glow');
  glowButton.setAttribute('aria-pressed', String(isSoft));
  setControlStatus(isSoft ? 'Soft glow active.' : 'Full glow active.');
}

function toggleGridDetail() {
  const isStrong = document.body.classList.toggle('is-grid-strong');
  gridButton.setAttribute('aria-pressed', String(isStrong));
  setControlStatus(isStrong ? 'Grid pulse active.' : 'Grid pulse off.');
}

function cyclePalette() {
  paletteIndex = (paletteIndex + 1) % expectedSequence.length;
  const accent = expectedSequence[paletteIndex];
  document.documentElement.dataset.accent = accent;
  setControlStatus(`Palette: ${accent}.`);
}

function openPuzzleVault() {
  playSection.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
  statusNode.textContent = 'Puzzle vault ready.';
}

function updateTraceButtons() {
  for (const button of traceButtons) {
    button.classList.toggle('is-active', tracePath.includes(button.dataset.trace));
  }
}

function addTraceNode(node) {
  const currentIndex = tracePath.length;
  if (node !== expectedTrace[currentIndex]) {
    tracePath = [];
    coreState.trace = false;
    traceStatusNode.textContent = 'Trace reset. Start at center.';
    updateTraceButtons();
    updateCoreState();
    return;
  }

  tracePath.push(node);
  updateTraceButtons();

  if (tracePath.length === expectedTrace.length) {
    coreState.trace = true;
    traceStatusNode.textContent = 'Trace route complete.';
    updateCoreState();
    return;
  }

  traceStatusNode.textContent = `Trace: ${tracePath.join(' -> ')}.`;
}

function decodeCipher() {
  if (!coreState.sequence) {
    cipherStatusNode.textContent = 'Find the color signal first.';
    return;
  }

  coreState.cipher = true;
  cipherStatusNode.textContent = 'Decoded: SIGNAL.';
  updateCoreState();
}

function updateCoreState() {
  const completed = Object.values(coreState).filter(Boolean).length;

  for (const step of coreSteps) {
    const key = step.dataset.coreStep;
    step.classList.toggle('is-complete', Boolean(coreState[key]));
  }

  coreStatusNode.textContent = completed === 4
    ? 'Core online. Rank: Explorer.'
    : `Core locked. Solve ${completed} of 4.`;

  if (completed === 4 && coreNode.hidden) {
    coreNode.hidden = false;
    coreNode.focus?.();
  } else if (completed < 4) {
    coreNode.hidden = true;
  }
}

function runConsoleCommand() {
  const command = consoleInput.value.trim().toLowerCase();
  if (!command) return;

  if (command === 'help') {
    consoleOutputNode.textContent = [
      'commands:',
      'status',
      'hint',
      'decrypt',
      'unlock',
      'reset',
    ].join('\n');
  } else if (command === 'status') {
    consoleOutputNode.textContent = coreStatusNode.textContent;
  } else if (command === 'hint') {
    consoleOutputNode.textContent = 'meta: color signal + board + trace + cipher';
  } else if (command === 'decrypt') {
    decodeCipher();
    consoleOutputNode.textContent = cipherStatusNode.textContent;
  } else if (command === 'unlock') {
    updateCoreState();
    consoleOutputNode.textContent = coreNode.hidden ? 'core locked: solve every path' : 'core online: rank explorer';
  } else if (command === 'reset') {
    completedCommands = new Set();
    tracePath = [];
    coreState = { board: false, cipher: false, sequence: false, trace: false };
    resetSequence('Sequence reset.');
    updateCommandProgress();
    updateTraceButtons();
    cipherStatusNode.textContent = 'Waiting for signal.';
    traceStatusNode.textContent = 'Trace waiting.';
    commandOutputNode.textContent = 'Pick a path.';
    coreNode.hidden = true;
    consoleOutputNode.textContent = 'reset complete';
  } else {
    consoleOutputNode.textContent = 'unknown command. try: help';
  }

  consoleInput.value = '';
}

for (const button of glyphButtons) {
  button.addEventListener('click', () => addGlyph(button.dataset.glyph));
}

for (const button of commandButtons) {
  button.addEventListener('click', () => runCommand(button.dataset.command));
}

for (const button of traceButtons) {
  button.addEventListener('click', () => addTraceNode(button.dataset.trace));
}

resetButton.addEventListener('click', () => resetSequence());
hintButton.addEventListener('click', showHint);
glowButton.addEventListener('click', toggleSoftGlow);
gridButton.addEventListener('click', toggleGridDetail);
paletteButton.addEventListener('click', cyclePalette);
openPuzzleButton.addEventListener('click', openPuzzleVault);
decodeButton.addEventListener('click', decodeCipher);
consoleRunButton.addEventListener('click', runConsoleCommand);
consoleInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    runConsoleCommand();
  }
});
window.addEventListener('pointermove', setCursorLight, { passive: true });

reducedMotionQuery.addEventListener('change', () => {
  if (reducedMotionQuery.matches) {
    document.documentElement.style.removeProperty('--cursor-x');
    document.documentElement.style.removeProperty('--cursor-y');
  }
});
